import * as winston from "winston";
import * as fs from "fs";
import {IConfig} from "./IConfig";
import {MongoCache} from "./MongoCache";
import * as yargs from "yargs";

// Get the command line arguments
var arguments = yargs.argv;

// Saves logs to file
if (arguments.logFile && arguments.logFile.trim() != "")
    winston.add(winston.transports.File, { filename: arguments.logFile, maxsize: 50000000, maxFiles: 1, tailable: true });

// If no logging - remove all transports
if (arguments.logging && arguments.logging.toLowerCase().trim() == "false")
{
    winston.remove(winston.transports.File);
    winston.remove(winston.transports.Console);
}

// Saves logs to file
winston.info(`Setting up modepress-render server`, { process: process.pid });

// Make sure the config path argument is there
if (!arguments.config || arguments.config.trim() == "")
{
    winston.error("No config file specified. Please start modepress-render with the config path in the argument list. Eg: 'node main.js --config=\"config.js\"'", { process: process.pid });
    process.exit();
}

// Make sure the file exists
if (!fs.existsSync(arguments.config))
{
    winston.error(`Could not locate the config file at '${arguments.config}'`, { process: process.pid });
    process.exit();
}

try
{
    var config: IConfig = JSON.parse(fs.readFileSync(arguments.config, "utf8"));
}
catch (err)
{
    winston.error(`Could not parse config file at '${arguments.config}' : '${err.toString()}'`, { process: process.pid });
    process.exit();
}

// Get the prerender
var prerender = require('./node_modules/prerender/lib');

// Create the server
var server= prerender({
    workers: process.env.PHANTOM_CLUSTER_NUM_WORKERS,
    iterations: process.env.PHANTOM_WORKER_ITERATIONS || 10,
    phantomBasePort: process.env.PHANTOM_CLUSTER_BASE_PORT || 12300,
    messageTimeout: process.env.PHANTOM_CLUSTER_MESSAGE_TIMEOUT,
    port: config.port || 3000
});

// Use the standard plugins
server.use(prerender.blacklist());
server.use(prerender.removeScriptTags());
server.use(prerender.httpHeaders());
server.use(prerender.httpHeaders());

// By default prerender uses bcrypt & weak - but we dont need this as its a bitch to setup
// Below is a way of configuring it so that prerender forces phantom to not use weak
server.options.phantomArguments = [];
server.options.phantomArguments.push = function ()
{
    if (arguments[0] && arguments[0].port !== undefined)
        arguments[0].dnodeOpts = { weak: false };

    //Do what you want here...
    return Array.prototype.push.apply(this, arguments);
}


// Custom cache plugin
var cache = new MongoCache(config);
cache.initialize().then(function ()
{
    server.use(cache);

    winston.info(`Rerender set to port: ${config.port}`, { process: process.pid });

    // Start the server
    server.start();

}).catch(function (error: Error)
{
    winston.error(`An error occurred while setting up the cache: ${error.message}`, { process: process.pid });
    process.exit();
});




