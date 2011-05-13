/*!
 * node-mongo-pool
 * Copyright(c) 2011 Senmiao Liu <zir.echo@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies
 */
var EventEmitter = require('events').EventEmitter;
var mongodb = require('mongodb');



/**
 * MongoPool
 *
 * @param options Options for mongodb and MongoPool:
 *
 * - `host` Hostname of mongodb server, defaults to `127.0.0.1`
 * - `port` Port of mongodb server, defaults to `27017`
 * - `db` Database name, defaults to `mongo_pool_test`
 * - `poolSize` Number of connections for this pool, defaults to `5`
 *
 */
var MongoPool = exports.MongoPool = function MongoPool(options) {
    // array to hold the db clients
    this._pool = [];
    // array to hold the pending requests (request a db client)
    this._queue = [];
    // closing status
    this._closing = false;
    // setup default options
    options = options || {};
    options.host = options.host || '127.0.0.1';
    options.port = options.port || 27017;
    options.db = options.db || 'mongo_pool_test';
    options.poolSize = options.poolSize > 0 ? options.poolSize : 5;

    this.on('release', function(client) {
        if (this._closing) {
            // close the client if pool is in `closing` status
            client.close();
        } else if (this._queue.length > 0) {
            this._queue.shift().call(this, client);
        } else if (this._pool.indexOf(client) === -1) {
            this._pool.push(client);
        }
    });

    var self = this;
    for (var i = 0; i < options.poolSize; i++) {
        this.createClient(options.host, options.port, options.db)
            .open(function(error, client) {
                if (error) throw error;
                self.release(client);
            });
    }
}

/**
 * Inherits EventEmitter
 */
MongoPool.prototype.__proto__ = EventEmitter.prototype;

/**
 * Create and return a `mongodb.Db` instance
 * 
 * @param {String} host Hostname of database server
 * @param {Number|String} port Port of database server
 * @param {String} db Name of database
 * @return {Object}
 */
MongoPool.prototype.createClient = function(host, port, db) {
    var client = new mongodb.Db(db, new mongodb.Server(host, port, {auto_reconnect: true}));
    return client;
};

/**
 * Get a client object from pool or put the `callback` function into queue
 * 
 * @param {Function} callback Callback function to receive the db client:
 *
 *      `function(client) {}`
 *
 */
MongoPool.prototype.getClient = function(callback) {
    if (this._pool.length > 0) {
        callback.call(this, this._pool.shift());
    } else {
        this._queue.push(callback);
    }
};

/**
 * Get a collection object
 * 
 * @param {String} name Name of the collection
 * @param {Function} callback Callback function to receive the collection object:
 *
 *      `function(error, collection) {}`
 */
MongoPool.prototype.getCollection = function(name, callback) {
    this.getClient(function(client) {
        client.collection(name, callback);
    });
};

/**
 * Release a mongodb client to the connection pool,
 * return `true` if the releasing process is handled by `MongoPool`.
 * 
 * @param {Object} client Instance of `mongodb.Db` or `mongodb.Collection`
 * @return {Boolean}
 */
MongoPool.prototype.release = function(client) {
    if (client instanceof mongodb.Db) {
        return this.emit('release', client);
    } else if (client instanceof mongodb.Collection) {
        return this.emit('release', client.db);
    }
    return false;
}

/**
 * Close all db connections
 */
MongoPool.prototype.destory = function() {
    this._closing = true;
    this._pool.forEach(function(client) {
        client.close();
    });
};