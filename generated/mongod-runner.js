"use strict";
var child_process = require('child_process');
var fs = require('fs');
var path = require('path');
var pino = require('pino');
var tmp = require('tmp');
var log = pino({ name: 'mongod-runner' });
var MongoDaemon = (function () {
    // @param options
    //     - port: The port to use for this mongod instance. Defaults to  The path to the data storage directory for this mongod instance,
    //   or "tmp" to create a temporary directory
    // @param log_path The path to the log file for this mongod instance. Set to null if not needed.
    function MongoDaemon(options) {
        this.port = options.port || MongoDaemon.PORT_DEFAULT;
        if (options.use_tmp_dir) {
            this.tmp_dir = tmp.dirSync({ unsafeCleanup: true });
            this.db_path = path.join(this.tmp_dir.name, 'data');
            this.log_path = (options.log_path) ? options.log_path : path.join(this.tmp_dir.name, 'log');
        }
        else {
            this.db_path = options.db_path;
            this.log_path = options.log_path;
        }
        fs.mkdirSync(this.db_path);
        if (this.log_path) {
            fs.mkdirSync(this.log_path);
        }
    }
    // Start up a mongod instance, and report completion via a callback.
    // For example, this can be called in mocha before(), to set up a test database instance.
    MongoDaemon.prototype.start = function (done) {
        var done_called = false;
        function guardedDone(error) {
            if (!done_called) {
                done_called = true;
                done(error);
            }
        }
        var args = ['--port', this.port, '--dbpath', this.db_path, '--smallfiles'];
        if (this.log_path) {
            args.concat(['--logpath', this.log_path]);
        }
        var options = { env: process.env };
        log.info("starting mongod with args=" + JSON.stringify(args));
        this.spawned_mongod = child_process.spawn('mongod', args, options);
        this.spawned_mongod.on('exit', function (exit_code, signal) {
            var obj = { exit_code: exit_code, signal: signal };
            var text = 'mongod exited with code=' + exit_code + ' signal=' + signal;
            if ((exit_code != 0) || (signal)) {
                log.error(obj, text);
            }
            else {
                log.info(obj, text);
            }
        });
        this.spawned_mongod.on('error', function (error) {
            log.error('startMongod error=' + error);
            guardedDone(error);
        });
        setTimeout(function () {
            guardedDone();
        }, 500);
    };
    // Stop a mongod instance, and report completion via a callback.
    // This call is for use with mocha test after().
    MongoDaemon.prototype.stop = function (done) {
        this.spawned_mongod.kill();
        // Give mongod a chance to shut down
        // TODO: how can we have an event to show this?
        setTimeout(function () {
            done();
        }, 500);
    };
    MongoDaemon.PORT_DEFAULT = 27017;
    return MongoDaemon;
}());
exports.MongoDaemon = MongoDaemon;
