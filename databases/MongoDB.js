'use strict'

var Q = require('q');
var MongoClient = require('mongodb').MongoClient;
var DBSettings = require('../database.json').MongoDB;

/**
 * Connector class for MongoDB. Can also ask for index memory and stuff like that.
 * Methods are all generic, they do not depend on Model implementation.
 */
class MongoDB {
  connect(/*overwrites*/) {
    var url = `mongodb://${DBSettings.host}:${DBSettings.port}/${DBSettings.database}`;

    return Q.ninvoke(MongoClient, 'connect', url).then((db) => {
      this.db = db;
      this.db.on('close', (error) => console.error(`Connection to db closed! ${error}`))
    });
  }

  getIndexMemory() {}

  getDiskSize() {}
}

module.exports = MongoDB;