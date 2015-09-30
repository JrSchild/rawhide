"use strict"

var _ = require('lodash');

class Adapter {
  constructor(parameters) {
    this.parameters = parameters;

    var DB = require(`../databases/${parameters.settings.database}.js`);

    // Copy over the methods of the DB class as sort of 'composition'.
    Object.getOwnPropertyNames(DB.prototype).forEach((method) => {
      this[method] = DB.prototype[method];
    });
  }
}

module.exports = Adapter;