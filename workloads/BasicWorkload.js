"use strict"

var Workload = require('../core/Workload.js');

class BasicWorkload extends Workload {
  load(done) {
    this.model.LOAD_WRITE(done);
  }

  WRITE(metric) {
    return this.model.WRITE({someData: true}, metric);
  }

  READ(metric) {
    return this.model.READ(metric);
  }
}

module.exports = BasicWorkload;