var mongodb = require("mongodb");
var winston = require("winston");
var MongoCache = (function () {
    function MongoCache(config) {
        this._config = config;
    }
    /**
    * Initializes the cache with its mongo db collection
    */
    MongoCache.prototype.initialize = function () {
        var cfg = this._config;
        var that = this;
        return new Promise(function (resolve, reject) {
            that.connect(cfg.databaseHost, cfg.databasePort, cfg.databaseName).then(function (db) {
                db.collection(cfg.databaseCollection, function (err, collection) {
                    if (err)
                        reject(err);
                    else {
                        that._collection = collection;
                        resolve(that);
                    }
                });
            }).catch(function (err) {
                reject(err);
            });
        });
    };
    /**
    * Connects to the mongo database
    * @param {string} host The host URI
    * @param {number} port The port number
    * @param {mongodb.ServerOptions} opts Any additional options
    * @returns {Promise<mongodb.Db>}
    */
    MongoCache.prototype.connect = function (host, port, database, opts) {
        return new Promise(function (resolve, reject) {
            if (!host)
                return reject(new Error("Please provide a 'host' field in your configuration"));
            if (!port)
                return reject(new Error("Please provide a 'port' field in your configuration"));
            if (!database)
                return reject(new Error("Please provide a 'databaseName' field in your configuration"));
            var mongoServer = new mongodb.Server(host, port, opts);
            var mongoDB = new mongodb.Db(database, mongoServer, { w: 1 });
            mongoDB.open(function (err, db) {
                if (err || !db)
                    reject(err);
                else
                    resolve(db);
            });
        });
    };
    /**
    * Intercept the URL, and if we already have it saved - then serve that insted.
    */
    MongoCache.prototype.beforePhantomRequest = function (req, res, next) {
        if (req.method !== 'GET')
            return next();
        var renders = this._collection;
        renders.findOne({ url: req.url }, function (error, result) {
            var now = Date.now();
            if (error || !result)
                return next();
            else if (result.updateDate < now) {
                winston.info("URL out of date, updating content: '" + req.url + "'", { process: process.pid });
                return next();
            }
            else {
                winston.info("Retrieving cache for: '" + req.url + "'", { process: process.pid });
                res.send(200, result.html);
            }
        });
    };
    /**
    * Called after a request has been sent through
    */
    MongoCache.prototype.afterPhantomRequest = function (req, res, next) {
        winston.info("Saving request '" + req.url + "' to DB", { process: process.pid });
        var renders = this._collection;
        var token = { url: req.url, html: req.prerender.documentHTML, createdOn: Date.now(), updateDate: Date.now() + this._config.cachePeriod };
        this._collection.update({ url: req.url }, token, { upsert: true }, function (err) {
            if (err) {
                winston.error("An error occurred while saving a render: " + err.message, { process: process.pid });
                next();
            }
            else
                next();
        });
    };
    return MongoCache;
})();
exports.MongoCache = MongoCache;
