"use strict"

var _ = require('lodash');

/**
 * A class that discretely divides the load over the given names with the given
 * proportions. The total proportions do not necessarily have to add up to one.
 * Usage:
 * van discrete = new DiscreteGenerator({
 *   WRITE: 0.6,
 *   READ: 0.3
 * });
 */
class DiscreteGenerator {
  constructor(proportions) {
    this.values = DiscreteGenerator.createValues(proportions);
    this.current = -1;
  }

  get next() {
    return this.values[++this.current] || this.values[this.current = 0];
  }

  /**
   * Create an array where each key has the
   * number of occurences after its ratio.
   */
  static createValues(proportions) {
    var POW, split;

    // Find the most amount of numbers behind the comma.
    POW = _.reduce(proportions, (POW, value) => {
      split = `${value}`.split('.')[1] || [];

      return Math.max(split.length, POW);
    }, 0);
    POW = Math.pow(10, POW);

    // Construct an array where we are sure each number is a full integer.
    // Shuffle them around on each iteration and return the array.
    return _.reduce(proportions, (result, value, key) => {
      value = _.fill(Array(value * POW), key);

      return _.shuffle(result.concat(value));
    }, []);
  }
}

module.exports = DiscreteGenerator;