"use strict"

var _ = require('lodash');
var settings = require('../settings.json');
var ThroughputController = require('./ThroughputController');
var PhaseControl = require('./PhaseControl');

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
    var steps = [
      {correction: 1000, opsDecr: 0.60},
      {correction: 300, opsDecr: 0.75},
      {correction: 10, opsDecr: 0.98}
    ];

    var phases = new PhaseControl('active');

    phases.add('active', {
      condition: () => {
        console.log(this.currentLatency);
        if (this.currentLatency > 2000) {
          if (steps[runResults.length]) {
            runResults.push(this.operationsPerSecond);
          }

          console.log('start waitForZeroLatency');
          return 'waitForZeroLatency';
        }
      },
      correction: () => steps[runResults.length] ? steps[runResults.length].correction : 0
    });

    phases.add('waitForZeroLatency', {
      condition: () => {
        if (this.currentLatency === 0) {
          this.cooldownTime = Date.now() + 3000;
          console.log('start cooldown');
          return 'cooldown';
        }
      },
      correction: () => -this.operationsPerSecond
    });

    phases.add('cooldown', {
      condition: () => {
        if (this.cooldownTime < Date.now()) {
          if (_.last(runResults)) {
            this.operationsPerSecond = _.last(runResults) * _.last(steps).opsDecr;
          } else {
            this.operationsPerSecond = 0;
          }

          console.log('start active');
          return 'active';
        }
      },
      correction: () => -this.operationsPerSecond
    });

    phases.add('spike', {
      condition: () => {},
      correction: () => {}
    });
    phases.add('verify', {
      condition: () => {},
      correction: () => {}
    });

    this.opsPerSecUpdater = setInterval(() => {
      var correction;

      if (_.isNull(this.currentLatency)) {
        return;
      }

      correction = phases.next();

      // Update operationsPerSecond, make sure its between min and max value and send out data.
      this.operationsPerSecond = ThroughputController.getOpsPerSecInRange(this.operationsPerSecond + correction);
      this.emitOperationsPerSecond();

      // console.log(`latency: ${this.currentLatency}, correction: ${correction > 0 ? '+' : ''}${correction}, opsPSec: ${this.operationsPerSecond}`);
    }, 5000);
  }
}

module.exports = ThroughtputControllerSteps;