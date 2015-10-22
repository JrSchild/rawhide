'use strict'

var Model = require('rawhide/core/Model');

const ADAPTERS = {
  MongoDB: 'MongoDBBasicAdapter'
};

class BasicModel extends Model {
  WRITE(data, done) {
    this.adapter.WRITE(data, done);
  }

  READ(done) {
    this.adapter.READ(done);
  }
}

module.exports = BasicModel;
module.exports.ADAPTERS = ADAPTERS;