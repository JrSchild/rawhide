'use strict'

var MongoClient = require('mongodb').MongoClient;
var DBSettings = require('../database.json').MongoDB;

/**
 * Connector class for MongoDB. Can also ask for index memory and stuff like that.
 * Methods are all generic, they do not depend on Model implementation.
 */
class MongoDB {
  connect(cb, overwrites) {

    MongoClient.connect(`mongodb://${DBSettings.host}:${DBSettings.port}/${DBSettings.database}`, (err, db) => {
      if (err) return cb && cb(err);

      db.on('close', (error) => console.error(`Connection to db closed! ${error}`))
      cb && cb(null, this.db = db);
    });
  }

  getIndexMemory() {}

  getDiskSize() {}
}

module.exports = MongoDB;