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
    return this.sum() / this.data.length;
  }

  sum() {
    return _.sum(this.data);
  }
}

function pushShift(elem) {
  this.data.push(elem);
  this.data.shift();
}

module.exports = LimitQueue;