'use strict'

var _ = require('lodash');
var Q = require('q');
var MongoClient = require('mongodb').MongoClient;
var globalDBSettings = require('../database.json').MongoDB;
var loader = require('../core/lib/loader');
var parameters = loader('parameters.json');

/**
 * Connector class for MongoDB. Can also ask for index memory and stuff like that.
 * Methods are all generic, they do not depend on Model implementation.
 */
class MongoDB {
  connect(settings) {
    settings = _.merge(_.clone(globalDBSettings), settings);

    var url = `mongodb://${settings.host}:${settings.port}/${settings.database}`;

    return Q.ninvoke(MongoClient, 'connect', url).then((db) => {
      this.db = db;
      this.db.on('close', (error) => console.error(`Connection to db closed! ${error}`))
    });
  }

  // Delete the database to clear up the space. It will be automatically recreated when reconnecting.
  clearDB() {
    return Q.ninvoke(this.db, 'dropDatabase');
  }

  /**
   * Should return the following statistics:
   * storageSize<Int>: The total amount of storage allocated for the database.
   * indexSize<Int>:   The total size of all indexes for the database.
   */
  stats() {
    return this.db.collection(parameters.thread.tableName).stats()
      .then((stats) => _.pick(stats, 'size', 'totalIndexSize', 'count', 'avgObjSize', 'storageSize'));
  }
}

module.exports = MongoDB;