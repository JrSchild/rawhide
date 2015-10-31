'use strict'

var loader = require('./lib/loader');

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

    var DB = loader(`./databases/${this.parameters.database}`);

    // Copy over the methods of the DB class as sort of 'composition'.
    Object.getOwnPropertyNames(DB.prototype).forEach((method) => {
      this[method] = DB.prototype[method];
    });

    // Intercept calls to the connect method.
    this.connect = Adapter.prototype.connect.bind(this, this.connect);
  }

  connect(connectFn) {
    return connectFn.call(this)
      .then(() => this.createTable())
      .then(() => process.send({
        type: 'connected'
      }))
      .catch((err) => {
        process.send({
          type: 'errorConnecting',
          data: err
        });

        throw err;
      });
  }

  createTable() {
    throw new Error('Create table not Implemented');
  }
}

module.exports = Adapter;