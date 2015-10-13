'use strict'

var _ = require('lodash');

/**
 * This class is used to hook up the Model with the database. It
 * defines the model-specific transactions to the database. The
 * constructor automatically copies over the methods of its 
 * database functionality.
 */
class Adapter {
  constructor(model) {
    this.model = model;
    this.parameters = model.parameters;

    var DB = require(`../databases/${this.parameters.settings.database}.js`);

    // Copy over the methods of the DB class as sort of 'composition'.
    Object.getOwnPropertyNames(DB.prototype).forEach((method) => {
      this[method] = DB.prototype[method];
    });
  }
}

module.exports = Adapter;