"use strict"

var Model = require('../core/Model.js');

const ADAPTERS = {
  MongoDB: 'BasicAdapter'
};

class BasicModel extends Model {
  constructor(parameters) {
    super(parameters, ADAPTERS);
  }

  LOAD_WRITE(done) {
  	setTimeout(done, 1000);
  }

  WRITE(data, metric) {}
  READ(metric) {}
}

module.exports = BasicModel;