'use strict';

var _ = require('lodash');

/**
 * A limited queue utility class that that can calculate the average.
 */
class LimitQueue {
  constructor(limit) {
    this.limit = limit;
    this.data = [];
  }

  push(elem) {
    this.data.push(elem);

    if (this.data.length === this.limit) {
      this.push = pushShift;
    }
  }

  average() {
    return _.sum(this.data) / this.data.length;
  }
}

function pushShift(elem) {
  this.data.push(elem);
  this.data.shift();
}

module.exports = LimitQueue;