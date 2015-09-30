"use strict"

var Workload = require('../core/Workload.js');

class BasicWorkload extends Workload {
  load(done) {
    this.model.LOAD_WRITE(done);
  }
}

module.exports = BasicWorkload;