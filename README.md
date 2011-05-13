## Installation

    npm install mongo-pool

## Usage

// load the module

    var MongoPool = require('mongo-pool').MongoPool;

// make a pool with 3 connections, connect to `127.0.0.1:27017` by default

    var pool = new MongoPool({db: 'mongo_pool_test', poolSize: 3});

// get a mongodb client (the instance of `mongodb.Db` class)

    pool.getClient(function(client) {

        // do something with `client` as usual

        client.collection('mongo_pool_collection1', function(err, collection) {

           // when you don't need the client anymore,
           // you have to release it manually.

           pool.release(client);

        });

    });

// or you can get the collection object directly:

    pool.getCollection('mongo_pool_collection1', function(err, collection) {

        // release the collection
        
        pool.release(collection);

    });

## API

see [http://zir.github.com/node-mongo-pool/](http://zir.github.com/node-mongo-pool/)