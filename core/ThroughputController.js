"use strict"

var _ = require('lodash');
var PIDController = require('./PIDController');
var settings = require('../settings.json');
var getOpsPerSecInRange;

/**
 * This class is used to control the number of operations per second
 * for all threads. The algorithm adjusts the throughput towards the
 * goalLatency and emits the new number of operations per second.
 */
class ThroughputController {
  constructor(threads) {
    this.threads = threads;
    this.reset();
    this.initThreads();
    this.initThroughputEmitter();
    this.currentLatency = 0;
  }

  reset() {
    this.operationsPerSecond = settings.minOperationsPerSecond;
    this.latencies = [];
  }

  // Start listening to all threads.
  initThreads() {
    this.threads.forEach((thread) => thread.on('message', this.onThreadMessage.bind(this)));
  }

  onThreadMessage(message) {
    if (message.type === 'latency') {
      this.setLatency(message.data);
    }
  }

  /**
   * Collect latencies for 1000ms and adjust operationsPerSecond
   * with a PID Controller to approach targetLatency.
   */
  initThroughputEmitter() {
    this.pid = new PIDController(4, 0.01, 0.1);
    this.pid.setTarget(settings.targetLatency);

    setInterval(() => {
      var currentLatency, correction;

      currentLatency = _.sum(this.latencies) / this.latencies.length;

      // Start fresh on next iteration.
      this.latencies = [];

      // If average is 0 or NaN (in case length is 0) the threads haven't started yet.
      if (!currentLatency) {
        return;
      }

      // Use PID algorithm to calculate correction.
      correction = this.pid.update(currentLatency);

      // Update operationsPerSecond, make sure its between min and max value and send out data.
      this.operationsPerSecond = getOpsPerSecInRange(this.operationsPerSecond + correction);
      this.currentLatency = currentLatency;
      this.emitOperationsPerSecond();

      console.log(`latency: ${currentLatency}, correction: ${correction > 0 ? '+' : ''}${correction}, opsPSec: ${this.operationsPerSecond}`);
    }, settings.PIDInterval);
  }

  // Measure average latency for the last second.
  setLatency(latency) {
    this.latencies.push(latency);
  }

  emitOperationsPerSecond() {
    this.threads.forEach((thread) => thread.send({
      type: 'setOperationsPerSecond',
      data: this.operationsPerSecond
    }));
  }
}

/**
 * Get the operations per seconds but makes sure they are
 * in the range of min and max operations per second.
 * Caches the min, max values.
 */
getOpsPerSecInRange = () => {
  var min = settings.minOperationsPerSecond;
  var max = settings.maxOperationsPerSecond;

  return (value) => Math.min(max, Math.max(min, value));
}();

module.exports = ThroughputController;