'use strict'

var Promise = require('bluebird');

/**
 * Class that transforms incoming data and passes it through to the adapter.
 * This is used to benchmark the impact of data that needs to be processed
 * before it can be saved.
 */
class Model {
  constructor(parameters, adapters) {
    this.parameters = parameters;
    this.adapters = adapters || {};
    this.connect();
  }

  connect() {
    var connect, createTable;

    if (!this.adapters[this.parameters.settings.database]) {
      throw new Error('AdapterNotSetError');
    }

    // TODO: Move to adapter and use Promises/generators...?
    this.adapter = new (require(`../adapters/${this.adapters[this.parameters.settings.database]}.js`))(this);

    connect = Promise.promisify(this.adapter.connect).bind(this.adapter);
    createTable = Promise.promisify(this.adapter.createTable).bind(this.adapter);

    connect()
      .then(() => createTable())
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