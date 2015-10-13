'use strict';

var _ = require('lodash');

/**
 * A limited queue utility class that that can calculate the average.
 */
class LimitQueue {
  construct(limit) {
    this.limit = limit;
    this.data = Array(limit);
  }

  push(elem) {
    this.data.push(elem);
    this.data.shift();
  }

  average() {
    return _.sum(this.latencies) / this.limit;
  }
}

module.exports = LimitQueue;