"use strict"

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

    // TODO: Promises/generators...
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
}

module.exports = Model;