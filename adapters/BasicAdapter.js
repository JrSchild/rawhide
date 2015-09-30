"use strict"

var Adapter = require('../core/Adapter.js');

// Database functionality is automatically injected.
class BasicAdapter extends Adapter {
  WRITE(data, metric) {}
  READ(metric) {}

  createTable(cb) {
    this.db.createCollection(this.parameters.thread.tableName)
      .then(() => cb())
      .catch((err) => cb(err));
  }

  // Clean up and delete database.
  destroy() {}
}

module.exports = BasicAdapter;