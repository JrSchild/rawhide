"use strict"

var Model = require('../core/Model.js');

const ADAPTERS = {
  MongoDB: 'MongoDBBasicAdapter'
};

class BasicModel extends Model {
  constructor(parameters) {
    super(parameters, ADAPTERS);
  }

  WRITE(data, done) {
    this.adapter.WRITE(data, done);
  }

  READ(done) {
    this.adapter.READ(done);
  }
}

module.exports = BasicModel;