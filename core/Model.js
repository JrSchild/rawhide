'use strict'

var loader = require('./lib/loader');

/**
 * Class that transforms incoming data and passes it through to the adapter.
 * This is used to benchmark the impact of data that needs to be processed
 * before it can be saved.
 */
class Model {
  constructor(parameters) {
    this.parameters = parameters;
    this.adapters = this.constructor.ADAPTERS || {};
    this.connect();
  }

  connect() {
    var connect, createTable;

    if (!this.adapters[this.parameters.settings.database]) {
      throw new Error('AdapterNotSetError');
    }

    // TODO: Move connecting to adapter.
    this.adapter = new (loader(`./adapters/${this.adapters[this.parameters.settings.database]}`))(this);

    this.adapter.connect()
      .then(() => this.adapter.createTable())
      .then(() => process.send({
        type: 'connected'
      }))
      .catch((err) => process.send({
        type: 'errorConnecting',
        data: err
      }));
  }

  // This will be replaced by smarter/better methods for metrics handling/collecting.
  // Maybe within the done() callback of the LimitCounter. Where that class will be
  // collect metrics data.
  setLatency(latency) {
    process.send({
      type: 'latency',
      data: latency
    });
  }
}

module.exports = Model;