"use strict"

var MongoClient = require('mongodb').MongoClient;
var settings = require('../database.json').MongoDB;

/**
 * Connector class for MongoDB. Can also ask for index memory and stuff like that.
 * Methods are all generic, they do not depend on Model implementation.
 */
class MongoDB {
  connect(cb, overwrites) {
    MongoClient.connect(`mongodb://${settings.host}:${settings.port}/${settings.database}`, (err, db) => {
      cb && cb(err, this.db = db);
    });
  }

  getIndexMemory() {}

  getDiskSize() {}
}

module.exports = MongoDB;