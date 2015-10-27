'use strict'

var _ = require('lodash');
var EventEmitter = require('events');
var settings = require('../settings.json');

/**
 * For now this class simply intercepts statistics and allows other classes
 * to listen for events or something like this. It's still a little abstract
 * but it will defintely be necessary.
 */
class Statistics extends EventEmitter {
  constructor(threads) {
    super();
    this.threads = threads;

    // Keep latencies in ms until cleared, defined by settings.updateLatencyInterval.
    this.latencies = [];

    // key: time in seconds,
    // value: count
    this.operationsPerSecond = {};

    // Stores the queueCount for each thread with pid as key.
    this.queueCounts = {};

    this.initThreads();
    this.initLatencyUpdater();
  }

  // Start listening to all threads.
  initThreads() {
    this.threads.forEach((thread) => thread.on('message', this.onThreadMessage.bind(this)));
  }

  onThreadMessage(message) {
    if (message.type === 'latency') {
      this.latencies.push(message.end - message.start);
      this.updateOpsPerSec(message);
    } else if (message.type === 'queueCount') {
      this.queueCounts[message.pid] = message.data;
      this.updateQueueCount();
    }
  }

  // Keep a hashmap per second with a counter as value.
  updateOpsPerSec(message) {
    var key = ~~(message.end / 1000);

    if (this.operationsPerSecond[key]) {
      return this.operationsPerSecond[key]++;
    }

    // A new entry was made, emit the last amount of operations per seconds.
    if (this.operationsPerSecond[key - 1]) {
      this.emit('executedOperationsPerSecond', [Date.now(), this.operationsPerSecond[key - 1]]);
    }

    // Start the new seconds-data. Cleanup previous value (for now).
    this.operationsPerSecond = { [key]: 1 };
  }

  initLatencyUpdater() {
    setInterval(() => {
      var length;

      // If no latencies are recieved send out null.
      if (!(length = this.latencies.length)) {
        return this.emit('latency', [Date.now(), null])
      }

      // Calculate average and notify to listeners.
      this.emit('latency', [Date.now(), _.sum(this.latencies) / length]);

      // Start fresh on next iteration.
      this.latencies = [];
    }, settings.updateLatencyInterval);
  }

  // Waits until queue count of all threads are in, then rewrites the
  // method to a throttled function that emits the sum of all threads.
  updateQueueCount() {
    if (Object.keys(this.queueCounts).length === this.threads.length) {
      this.updateQueueCount = _.throttle(() => {
        this.emit('queueCount', [Date.now(), _.sum(this.queueCounts)]);
      }, 100);
    }
  }
}

module.exports = Statistics;