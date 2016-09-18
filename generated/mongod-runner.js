"use strict";
var child_process = require('child_process');
var fs = require('fs');
// Start up a mongod instance, and report completion via a callback.
// This call is for use with mocha test before().
// @param db_path The path to the data storage directory for this mongod instance.
// @param log_path The path to the log file for this mongod instance. Set to null if not needed.
function startMongod(port, db_path, log_path, done) {
    var done_called = false;
    function guardedDone(error) {
        if (!done_called) {
            done_called = true;
            done(error);
        }
    }
    fs.mkdirSync(db_path);
    var args = ['--port', port, '--dbpath', db_path, '--smallfiles'];
    if (log_path) {
        args.concat(['--logpath', log_path]);
    }
    var options = { env: process.env };
    // console.log(`starting mongod with args=${JSON.stringify(args)}`)
    var spawned_mongod = child_process.spawn('mongod', args, options);
    spawned_mongod.on('exit', function (code, signal) {
        if (had_error) {
            console.log('mongod exited with code=' + code + ' signal=' + signal);
        }
    });
    var had_error = false;
    spawned_mongod.on('error', function (error) {
        had_error = true;
        console.log('startMongod error=' + error);
        guardedDone(error);
    });
    setTimeout(function () {
        guardedDone();
    }, 500);
    return spawned_mongod;
}
exports.startMongod = startMongod;
// Stop a mongod instance, and report completion via a callback.
// This call is for use with mocha test after().
function stopMongod(spawned_mongod, done) {
    spawned_mongod.kill();
    // Give mongod a chance to shut down
    // TODO: how can we have an event to show this?
    setTimeout(function () {
        done();
    }, 50);
}
exports.stopMongod = stopMongod;
