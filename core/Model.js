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
  }

  connect() {
    if (!this.adapters[this.parameters.settings.database]) {
      throw new Error('AdapterNotSetError');
    }

    // TODO: Move connecting to adapter.
    this.adapter = new (loader(`./adapters/${this.adapters[this.parameters.settings.database]}`))(this);

    return this.adapter.connect();
  }

  // This will be replaced by smarter/better methods for metrics handling/collecting.
  // Maybe within the done() callback of the LimitCounter. Where that class will be
  // collect metrics data.
  setLatency(start, end) {
    process.send({
      type: 'latency',
      start,
      end
    });
  }
}

module.exports = Model;