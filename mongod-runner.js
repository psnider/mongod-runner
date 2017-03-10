"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process = require("child_process");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const tmp = require("tmp");
let log = pino({ name: 'mongod-runner' });
class MongoDaemonRunner {
    // See mongod-runner.d.ts for docs.
    constructor(options) {
        this.port = (options.port || MongoDaemonRunner.PORT_DEFAULT).toString();
        if (options.use_tmp_dir) {
            this.tmp_dir = tmp.dirSync({ unsafeCleanup: true });
            this.db_path = path.join(this.tmp_dir.name, 'data');
            this.log_path = (options.log_path) ? options.log_path : path.join(this.tmp_dir.name, 'log');
        }
        else {
            this.db_path = options.db_path;
            this.log_path = options.log_path;
        }
        if (options.disable_logging) {
            log.level = 'silent';
        }
        fs.mkdirSync(this.db_path);
        if (this.log_path) {
            fs.mkdirSync(this.log_path);
        }
    }
    // See mongod-runner.d.ts for docs.
    start(done) {
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
        log.info(`starting mongod with args=${JSON.stringify(args)}`);
        // TODO: [replace spawn() with process-spawner](https://github.com/psnider/process-spawner/issues/1) 
        this.spawned_mongod = child_process.spawn('mongod', args, options);
        this.spawned_mongod.on('exit', function (exit_code, signal) {
            let obj = { exit_code, signal };
            let text = 'mongod exited with code=' + exit_code + ' signal=' + signal;
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
        // TODO: [modify start() to call done after mongod is accepting connections](https://github.com/psnider/mongod-runner/issues/1)
        // TODO: [replace spawn() with process-spawner](https://github.com/psnider/process-spawner/issues/1) 
        setTimeout(function () {
            guardedDone();
        }, 500);
    }
    // See mongod-runner.d.ts for docs.
    stop(done) {
        this.spawned_mongod.kill();
        // Give mongod a chance to shut down
        // TODO: [modify end() to check that pid is no longer running before returning](https://github.com/psnider/mongod-runner/issues/2)
        // TODO: [replace spawn() with process-spawner](https://github.com/psnider/process-spawner/issues/1) 
        setTimeout(() => {
            done();
        }, 500);
    }
}
MongoDaemonRunner.PORT_DEFAULT = '27017';
exports.MongoDaemonRunner = MongoDaemonRunner;
