'use strict'

var Workload = require('rawhide/core/Workload');
var _ = require('lodash');

// Define some dummy data generated with faker.js.
const dummyData = {
  name: "Destany Hayes",
  username: "Ellis_Funk81",
  email: "Mallory.Swaniawski14@gmail.com",
  address: {
    streetA: "Bartoletti Trail",
    streetB: "1954 Purdy Union",
    streetC: "900 Merritt Locks Suite 611"
  }
};

class BasicWorkload extends Workload {
  load(done) {
    this.WRITE(done);
  }

  WRITE(done) {
    this.model.WRITE(_.cloneDeep(dummyData), done);
  }

  READ(done) {
    this.model.READ(done);
  }
}

module.exports = BasicWorkload;