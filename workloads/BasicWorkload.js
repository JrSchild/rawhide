"use strict"

var Workload = require('../core/Workload.js');
var _ = require('lodash');

class BasicWorkload extends Workload {
  load(done) {
    this.model.LOAD_WRITE(this.generateData(), done);
  }

  WRITE(metric) {
    return this.model.WRITE(this.generateData(), metric);
  }

  READ(metric) {
    return this.model.READ(metric);
  }

  // Return some dummy data generated with faker.js.
  generateData() {
    return {
      name: "Destany Hayes",
      username: "Ellis_Funk81",
      email: "Mallory.Swaniawski14@gmail.com",
      address: {
        streetA: "Bartoletti Trail",
        streetB: "1954 Purdy Union",
        streetC: "900 Merritt Locks Suite 611"
      }
    };
  }
}

module.exports = BasicWorkload;