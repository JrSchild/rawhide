"use strict"

var _ = require('lodash');

/**
 * A super-lightweight asynchrounous counter that executes the
 * callback after a limit is reached.
 * Usage: 
 * Instantiate with these parameters.
 * var counter = new LimitCounter(limit: integer, callback: function);
 *
 * call done to add given number to the counter.
 * var done = counter.add(number: 1 [default=1]);
 */
class LimitCounter {
  constructor(limit, cb) {
    this.limit = limit;
    this.cb = _.once(cb || () => {});

    // prepCurrent is count before async method is called.
    this.prepCurrent = 0;

    // current is count after async method is completed.
    this.current = 0;
  }

  get isLimit() {
    return this.prepCurrent >= this.limit;
  }

  get isFinished() {
    return this.current >= this.limit;
  }

  add(number) {
    number = number || 1
    this.prepCurrent += number;

    return (err) => {
      if (err) return this.cb(err);

      this.current += number;

      if (this.isFinished) this.cb();
    };
  }
}

module.exports = LimitCounter;