"use strict"

var Workload = require('../core/Workload.js');
var _ = require('lodash');
var faker = require('faker');

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

  generateData() {
  	return _.pick(faker.helpers.createCard(), 'name', 'username', 'email', 'address', 'phone', 'company');
  }
}

module.exports = BasicWorkload;