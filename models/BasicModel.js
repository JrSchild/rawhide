"use strict"

var Model = require('../core/Model.js');

const ADAPTERS = {
  MongoDB: 'MongoDBBasicAdapter'
};

class BasicModel extends Model {
  constructor(parameters) {
    super(parameters, ADAPTERS);
  }

  LOAD_WRITE(data, done) {
    this.adapter.LOAD_WRITE(data, done);
  }

  WRITE(data, metric) {}
  READ(metric) {}
}

module.exports = BasicModel;