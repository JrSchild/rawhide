'use strict'

var Adapter = require('rawhide/core/Adapter');

class MongoDBBasicAdapter extends Adapter {
  READ(metric) {}

  WRITE(data, done) {
    var start = Date.now();

    this.db.collection(this.parameters.thread.tableName)
      .insertOne(data, (err) => {
        this.model.setLatency(start, Date.now());
        done(err);
      });
  }

  READ(done) {
    var start = Date.now();

    var cursor = this.db.collection(this.parameters.thread.tableName)
      .find({});

    cursor.nextObject((err, res) => {
      cursor.close()
      this.model.setLatency(start, Date.now());
      done(err);
    });
  }

  createTable() {
    return null;
  }
}

module.exports = MongoDBBasicAdapter;