"use strict"

var Adapter = require('../core/Adapter.js');

class MongoDBBasicAdapter extends Adapter {
  WRITE(data, metric) {}
  READ(metric) {}

  LOAD_WRITE(data, done) {
    var start = Date.now();

    this.db.collection(this.parameters.thread.tableName)
      .insertOne(data, (err) => {
        this.model.setLatency(Date.now() - start);
        done(err);
      });
  }

  createTable(cb) {
    this.db.createCollection(this.parameters.thread.tableName)
      .then(() => cb())
      .catch((err) => cb(err));
  }

  // Clean up and delete database.
  destroy() {}
}

module.exports = MongoDBBasicAdapter;