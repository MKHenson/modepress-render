import {IConfig} from "./IConfig";
import {ICacheItem} from "./ICacheItem";
import * as mongodb from "mongodb";
import * as winston from "winston";

export class MongoCache
{
    private _collection: mongodb.Collection;
    private _config: IConfig;

    constructor(config: IConfig)
    {
        this._config = config;
    }

    /**
	* Initializes the cache with its mongo db collection
	*/
    initialize(): Promise<MongoCache>
    {
        var cfg = this._config;
        var that = this;

        return new Promise<any>(function (resolve, reject)
        {
            that.connect(cfg.databaseHost, cfg.databasePort, cfg.databaseName).then(function (db)
            {
                db.collection(cfg.databaseCollection, function (err: Error, collection: mongodb.Collection)
                {
                    if (err)
                        reject(err);
                    else
                    {
                        that._collection = collection;
                        resolve(that);
                    }
                });

            }).catch(function (err: Error)
            {
                reject(err);
            });
        });
    }

    /**
	* Connects to the mongo database 
	* @param {string} host The host URI
	* @param {number} port The port number
	* @param {mongodb.ServerOptions} opts Any additional options
	* @returns {Promise<mongodb.Db>}
	*/
    connect(host: string, port: number, database: string, opts?: mongodb.ServerOptions): Promise<mongodb.Db>
    {
        return new Promise<mongodb.Db>(function (resolve, reject)
        {
            if (!host)
                return reject(new Error("Please provide a 'host' field in your configuration"));
            if (!port)
                return reject(new Error("Please provide a 'port' field in your configuration"));
            if (!database)
                return reject(new Error("Please provide a 'databaseName' field in your configuration"));

            var mongoServer: mongodb.Server = new mongodb.Server(host, port, opts);
            var mongoDB: mongodb.Db = new mongodb.Db(database, mongoServer, { w: 1 });
            mongoDB.open(function (err: Error, db: mongodb.Db)
            {
                if (err || !db)
                    reject(err);
                else
                    resolve(db);
            });
        });
    }

    /**
    * Intercept the URL, and if we already have it saved - then serve that insted.
    */
    beforePhantomRequest(req: any, res: any, next: Function)
    {
        if (req.method !== 'GET')
            return next();

        var renders = this._collection;
        renders.findOne({ url: req.url }, function (error: Error, result: ICacheItem)
        {
            var now = Date.now();

            if (error || !result)
                return next();
            else if (result.updateDate < now)
            {
                winston.info(`URL out of date, updating content: '${req.url}'`, { process: process.pid });
                return next();
            }
            else
            {
                winston.info(`Retrieving cache for: '${req.url}'`, { process: process.pid });
                res.send(200, result.html);
            }
        });
    }

    /**
    * Called after a request has been sent through
    */
    afterPhantomRequest(req: any, res: any, next: Function)
    {
        winston.info(`Saving request '${req.url}' to DB`, { process: process.pid });
        var renders = this._collection;
        var token: ICacheItem = { url: req.url, html: req.prerender.documentHTML, createdOn: Date.now(), updateDate: Date.now() + this._config.cachePeriod };

        this._collection.update({ url: req.url }, token, { upsert: true }, function (err: Error)
        {
            if (err)
            {
                winston.error(`An error occurred while saving a render: ${err.message}`, { process: process.pid });
                next();
            }
            else
                next();
        });
    }
}