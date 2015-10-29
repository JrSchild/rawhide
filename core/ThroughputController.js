'use strict'

var EventEmitter = require('events');
var _ = require('lodash');
var PIDController = require('./PIDController');
var settings = require('../settings.json');

/**
 * This class is used to control the number of operations per second
 * for all threads. The algorithm adjusts the throughput towards the
 * goalLatency and emits the new number of operations per second.
 *
 * Depending on the settings, this class should either try to find the
 * maximum throughput automatically (through PID algorithm), or
 * incrementally use steps to increase the throughput over time.
 */
class ThroughputController extends EventEmitter {
  constructor(threads, statistics) {
    super();
    this.threads = threads;
    this.statistics = statistics;
    this.reset();
    this.initThreads();
  }

  stop() {
    clearInterval(this.latencyUpdater);
    clearInterval(this.opsPerSecUpdater);
  }

  reset() {
    this.stop();
    this.currentLatency = null;
    this.operationsPerSecond = settings.minOperationsPerSecond;
    this.latencies = [];
  }

  // Start listening to all threads.
  initThreads() {
    this.threads.forEach((thread) => thread.on('message', this.onThreadMessage.bind(this)));
  }

  onThreadMessage(message) {
    if (message.type === 'latency') {
      this.setLatency(message.end - message.start);
    }
  }

  /**
   * Collect latencies for 1000ms and adjust operationsPerSecond
   * with a PID Controller to approach targetLatency.
   */
  start() {
    this.pid = new PIDController(0.2, 0, 0.23);
    this.pid.setTarget(settings.targetLatency);

    this.latencyUpdater = setInterval(() => {

      // If no latencies are recieved and currentLatency has not been set yet. Stop right here.
      if (!this.latencies.length) {
        if (_.isNull(this.currentLatency)) {
          return;
        }

        // Otherwise set it to zero.
        this.currentLatency = 0;
      } else {

        // If average is 0 or NaN (in case length is 0) the threads haven't started yet, so keep it unchanged.
        this.currentLatency = (_.sum(this.latencies) / this.latencies.length);

        // Start fresh on next iteration.
        this.latencies = [];
      }

      // Let everybody know through EventEmitter.
      this.emit('latency', [Date.now(), this.currentLatency]);
    }, settings.updateLatencyInterval);

    this.opsPerSecUpdater = setInterval(() => {
      var correction;

      if (_.isNull(this.currentLatency)) {
        return;
      }

      // Use PID algorithm to calculate correction.
      correction = this.pid.update(this.currentLatency);

      // If the latency is 0 and the opsPerSecond go into the minus, reset the PID and recalculate the correction.
      if (this.currentLatency === 0 && this.operationsPerSecond + correction < 0) {
        this.pid.reset();

        correction = this.pid.update(this.currentLatency);
      }

      // Update operationsPerSecond, make sure its between min and max value and send out data.
      this.operationsPerSecond = ThroughputController.getOpsPerSecInRange(this.operationsPerSecond + correction);
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

  /**
   * Get the operations per seconds but makes sure they are
   * in the range of min and max operations per second.
   * Caches the min, max values.
   */
  static getOpsPerSecInRange(value) {
    var max = settings.maxOperationsPerSecond;
    var min = settings.minOperationsPerSecond;

    return Math.min(max, Math.max(min, value));
  }
}

module.exports = ThroughputController;