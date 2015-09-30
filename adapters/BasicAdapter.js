"use strict"

var Adapter = require('../core/Adapter.js');

class BasicAdapter extends Adapter {
  WRITE(data, metric) {}
  READ(metric) {}

  createTable(cb) {
    this.db.createCollection(this.parameters.thread.tableName)
      .then(() => cb())
      .catch((err) => cb(err));
  }
}

module.exports = BasicAdapter;