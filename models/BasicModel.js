"use strict"

var Model = require('../core/Model.js');

const ADAPTERS = {
  MongoDB: 'BasicAdapter'
};

class BasicModel extends Model {
  constructor(parameters) {
    super(parameters, ADAPTERS);
  }
}

module.exports = BasicModel;