var winston = require("winston");
var fs = require("fs");
// Saves logs to file
winston.add(winston.transports.File, { filename: "logs.log", maxsize: 50000000, maxFiles: 1, tailable: true });
winston.info("Setting up modepress server", { process: process.pid });
// Make sure the config path argument is there
if (process.argv.length < 3) {
    winston.error("No config file specified. Please start modepress-render with the config path in the argument list. Eg: 'node main.js config.js'", { process: process.pid });
    process.exit();
}
// Make sure the file exists
if (!fs.existsSync(process.argv[2])) {
    winston.error("Could not locate the config file at '" + process.argv[2] + "'", { process: process.pid });
    process.exit();
}
try {
    var config = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
}
catch (err) {
    winston.error("Could not parse config file at '" + process.argv[2] + "' : '" + err.toString() + "'", { process: process.pid });
    process.exit();
}
// Get the prerender
var prerender = require('./node_modules/prerender/lib');
// Create the server
var server = prerender({
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
// Custom plugins
server.use(this);
winston.info("Rerender set to port: " + config.port, { process: process.pid });
// By default prerender uses bcrypt & weak - but we dont need this as its a bitch to setup
// Below is a way of configuring it so that prerender forces phantom to not use weak
server.options.phantomArguments = [];
server.options.phantomArguments.push = function () {
    if (arguments[0] && arguments[0].port !== undefined)
        arguments[0].dnodeOpts = { weak: false };
    //Do what you want here...
    return Array.prototype.push.apply(this, arguments);
};
// Start the server
server.start();
