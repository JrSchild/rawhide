'use strict'

var EventEmitter = require('events');

/**
 * For now this class simply intercepts statistics and allows other classes
 * to listen for events or something like this. It's still a little abstract
 * but it will defintely be necessary.
 */
class Statistics extends EventEmitter {
  constructor(threads) {
    this.threads = threads;
    this.latency = [];
    this.operationsPerSecond = [];
  }
}

module.exports = Statistics;