export class MongoDaemon {
    // @param options
    //     - port: The port to use for this mongod instance.
    //       Defaults to mongodb default port of 27017.
    //     - use_tmp_dir: Set this to true to create a temporary directory that will be deleted when the calling process exits.
    //     - db_path: The path to the data storage directory for this mongod instance.
    //       Note that this is not used if *use_tmp_dir* is true.
    //     - disable_logging: Set this to true if you want to disable logging from mongod-runner.
    //     - log_path: The path to the logging directory for this mongod instance.
    //       If this is not set, then logging is disabled for mongod.
    constructor(options: {port?: number | string, use_tmp_dir?: boolean, db_path?: string, disable_logging?: boolean, log_path?: string})
    // Start up a mongod instance, and report completion via a callback.
    // This call is for use with mocha test before().
    start(done: (error?: Error) => void): void 
    // Stop a mongod instance, and report completion via a callback.
    // This call is for use with mocha test after().
    stop(done: (error? : Error) => void): void
}

