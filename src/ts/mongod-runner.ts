import child_process                    = require('child_process')
import fs                               = require('fs')
import path                             = require('path')
import pino                             = require('pino')
import tmp                              = require('tmp')


let log = pino({name: 'mongod-runner'})


export class MongoDaemon {

    static PORT_DEFAULT:string = '27017'

    port: string
    db_path: string
    log_path: string
    tmp_dir: tmp.SynchrounousResult
    spawned_mongod: child_process.ChildProcess

      
    // See mongod-runner.d.ts for docs.
    constructor(options: {port?: number | string, use_tmp_dir?: boolean, db_path?: string, disable_logging?: boolean, log_path?: string}) {
        this.port = options.port.toString() || MongoDaemon.PORT_DEFAULT
        if (options.use_tmp_dir) {
            this.tmp_dir = tmp.dirSync({unsafeCleanup: true})
            this.db_path  = path.join(this.tmp_dir.name, 'data')
            this.log_path = (options.log_path) ? options.log_path : path.join(this.tmp_dir.name, 'log')
        } else {
            this.db_path = options.db_path
            this.log_path = options.log_path
        }
        if (options.disable_logging) {
            log.level = 'silent'
        }
        fs.mkdirSync(this.db_path)
        if (this.log_path) {
            fs.mkdirSync(this.log_path)
        }
    }


    // See mongod-runner.d.ts for docs.
    start(done: (error?: Error) => void): void {
        var done_called = false
        function guardedDone(error? : Error) {
            if (!done_called) {
                done_called = true
                done(error)
            }
        }
        var args = ['--port', this.port, '--dbpath', this.db_path, '--smallfiles']
        if (this.log_path) {
            args.concat(['--logpath', this.log_path])
        }
        var options = {env: process.env}
        log.info(`starting mongod with args=${JSON.stringify(args)}`)
        this.spawned_mongod = child_process.spawn('mongod', args, options)
        this.spawned_mongod.on('exit', function (exit_code, signal) {
            let obj = {exit_code, signal}
            let text = 'mongod exited with code=' + exit_code + ' signal=' + signal
            if ((exit_code != 0) || (signal)) {
                log.error(obj, text)
            } else {
                log.info(obj, text)
            }
        })
        this.spawned_mongod.on('error', function (error) {
            log.error('startMongod error=' + error)
            guardedDone(error)
        })
        setTimeout(function() {
            guardedDone()
        }, 500)
    }


    // See mongod-runner.d.ts for docs.
    stop(done: (error? : Error) => void): void {
        this.spawned_mongod.kill()
        // Give mongod a chance to shut down
        // TODO: how can we have an event to show this?
        setTimeout(() => {
            done()
        }, 500)
    }
}

