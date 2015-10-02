"use strict"

var EventEmitter = require('events');
var _ = require('lodash');
var PIDController = require('./PIDController');
var settings = require('../settings.json');
var getOpsPerSecInRange;

/**
 * This class is used to control the number of operations per second
 * for all threads. The algorithm adjusts the throughput towards the
 * goalLatency and emits the new number of operations per second.
 */
class ThroughputController extends EventEmitter {
  constructor(threads) {
    super();
    this.threads = threads;
    this.reset();
    this.initThreads();
  }

  reset() {
    this.currentLatency = 0;
    this.operationsPerSecond = settings.minOperationsPerSecond;
    this.latencies = [];
    clearInterval(this.latencyUpdater);
    clearInterval(this.opsPerSecUpdater);
    this.initThroughputEmitter()
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
    this.pid = new PIDController(0.01, 0.1, 0.01);
    this.pid.setTarget(settings.targetLatency);

    this.latencyUpdater = setInterval(() => {
      var currentLatency;

      // If average is 0 or NaN (in case length is 0) the threads haven't started yet, so keep it unchanged.
      currentLatency = (_.sum(this.latencies) / this.latencies.length);

      if (currentLatency > 15000) {
        // console.log(this.latencies);
      }
      // Start fresh on next iteration.
      this.latencies = [];

      if (!currentLatency) {
        return;
      }

      this.currentLatency = currentLatency;

      // Let everybody know.
      // console.log(this.currentLatency);
      this.emit('latency', [Date.now(), this.currentLatency]);
    }, settings.updateLatencyInterval);

    this.opsPerSecUpdater = setInterval(() => {
      var correction;

      if (!this.currentLatency) {
        return;
      }

      // Use PID algorithm to calculate correction.
      correction = this.pid.update(this.currentLatency);

      // Update operationsPerSecond, make sure its between min and max value and send out data.
      this.operationsPerSecond = getOpsPerSecInRange(this.operationsPerSecond + correction);
      this.emitOperationsPerSecond();

      console.log(`latency: ${this.currentLatency}, correction: ${correction > 0 ? '+' : ''}${correction}, opsPSec: ${this.operationsPerSecond}`);
    }, settings.PIDInterval);
  }

  // Measure average latency for the last second.
  setLatency(latency) {
    this.latencies.push(latency);
  }

  emitOperationsPerSecond() {
    this.emit('operationsPerSecond', this.operationsPerSecond);
    this.threads.forEach((thread) => thread.send({
      type: 'setOperationsPerSecond',
      data: this.operationsPerSecond / this.threads.length
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

  return (value) => Math.min(max, value);
  return (value) => Math.min(max, Math.max(min, value));
}();

module.exports = ThroughputController;