"use strict"

var _ = require('lodash');
var settings = require('../settings.json');
var ThroughputController = require('./ThroughputController');
var LimitQueue = require('./LimitQueue');

/**
 * Increase the operations per second linearly until the latency freaks out.
 */
class ThroughtputControllerSteps extends ThroughputController {

  constructor(threads) {
    super(threads);
    this.secondLatencies = 0;
    setInterval(() => {
      if (this.secondLatencies) {
        // console.log('transactions in last second: ' + this.secondLatencies);
      }
      this.secondLatencies = 0;
    }, 1000);
  }

  onThreadMessage(message) {
    if (message.type === 'latency') {
      this.setLatency(message.data);
    }
    this.secondLatencies++;
  }

  initThroughputEmitter() {
    this.latencyUpdater = setInterval(() => {

      // If no latencies are recieved and currentLatency has not been set yet. Stop right here.
      if (!this.latencies.length && _.isNull(this.currentLatency)) {
        return;
      } else {

        // If average is 0 or NaN (in case length is 0) the threads haven't started yet, so keep it unchanged.
        this.currentLatency = (_.sum(this.latencies) / this.latencies.length) || 0;

        // Start fresh on next iteration.
        this.latencies = [];
      }

      // Let everybody know through EventEmitter.
      this.emit('latency', [Date.now(), this.currentLatency]);
    }, settings.updateLatencyInterval);

    var runResults = [];
    var waitForZeroLatency, cooldown;
    var phases = [
      {correction: 1000, opsDecr: 0.60},
      {correction: 300, opsDecr: 0.75},
      {correction: 10, opsDecr: 0.98}
    ];

    this.opsPerSecUpdater = setInterval(() => {
      var correction;

      if (_.isNull(this.currentLatency)) {
        return;
      }

      if (waitForZeroLatency && this.currentLatency === 0) {
        console.log('start cooldown');
        waitForZeroLatency = false;
        cooldown = Date.now() + 3000;
      }

      if (cooldown && cooldown < Date.now()) {
        console.log('end cooldown');
        cooldown = false;
        if (runResults[runResults.length - 1]) {
          this.operationsPerSecond = runResults[runResults.length - 1] * phases[runResults.length - 1].opsDecr;
          console.log(`New opsPSec: ${this.operationsPerSecond} (${phases[runResults.length - 1].opsDecr})`);
        } else {
          this.operationsPerSecond = 0;
        }
      }

      correction = -this.operationsPerSecond;

      if (!waitForZeroLatency && !cooldown) {
        if (this.currentLatency > 2000) {
          waitForZeroLatency = true;
          console.log(`start wait-for-zero-latency, current opsPSec: ${this.operationsPerSecond}`);

          if (phases[runResults.length]) {
            runResults.push(this.operationsPerSecond);
          }
        } else if (phases[runResults.length]) {
          correction = phases[runResults.length].correction;
        } else {
          console.log(`FINISHED ${this.operationsPerSecond}`);
          correction = 0;
        }
      }

      correction = 1000;

      // Update operationsPerSecond, make sure its between min and max value and send out data.
      this.operationsPerSecond = ThroughputController.getOpsPerSecInRange(this.operationsPerSecond + correction);
      this.emitOperationsPerSecond();

      // console.log(`latency: ${this.currentLatency}, correction: ${correction > 0 ? '+' : ''}${correction}, opsPSec: ${this.operationsPerSecond}`);
    }, 5000);
  }
}

module.exports = ThroughtputControllerSteps;