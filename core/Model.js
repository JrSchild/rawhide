"use strict"

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
    if (!this.adapters[this.parameters.settings.database]) {
      throw new Error('AdapterNotSetError');
    }

    // TODO: Move to adapter and use Promises/generators...?
    this.adapter = new (require(`../adapters/${this.adapters[this.parameters.settings.database]}.js`))(this);
    this.adapter.connect((err) => {
      if (err) throw err;

      this.adapter.createTable((err) => {
        if (err) throw err;

        process.send({
          type: 'connected'
        });
      });
    });
  }

  // This will be replaced by smarter/better methods for metrics handling/collecting.
  // Maybe within the done() callback of the LimitCounter. Where that class will be
  // collect metrics data.
  setLatency(latency) {
    process.send({
      type: 'latency',
      value: latency
    });
  }
}

module.exports = Model;