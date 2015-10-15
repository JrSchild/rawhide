'use strict'

var _ = require('lodash');
var settings = require('../settings.json');
var ThroughputController = require('./ThroughputController');
var PhaseControl = require('./PhaseControl');

/**
 * Increase the operations per second linearly until the latency freaks out.
 */
class ThroughtputControllerSteps extends ThroughputController {

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

    /**
     * Phase 1: +1000 On each interval until it fails.   [0] Store 60% Of result after first phase.
     * Phase 2: +300 On each interval until it fails.    [1] Store last failed result.
     * Phase 3: -500 For 30 seconds until it passes.     [2] Store last passed result.
     * Phase 4?: +100 For 30 seconds until it fails.     [3] Store last passed result.
     */
    var results = [];
    var phases = new PhaseControl('active', this, true);
    var verified = null;

    phases.add('active', {
      condition() {
        if (this.currentLatency > 800) {
          this.spikeTime = process.hrtime();

          return 'spike';
        }

        // When the current operationsPerSecond are verified
        if (this.verifyTime && process.hrtime(this.verifyTime)[0] > 30) {
          console.log(`Found a new maximum: ${this.operationsPerSecond}`);

          if (!results[3]) {
            results[2] = results[3] = this.operationsPerSecond;
          }
          results[3] += 100;

          return 'waitForZeroLatency';
        }
      },
      correction() {
        if (!results[0]) return 1000;
        if (!results[1]) return 300;
      }
    });

    phases.add('waitForZeroLatency', {
      condition() {
        if (this.currentLatency === 0) {
          this.cooldownTime = process.hrtime();

          return 'cooldown';
        }
      },
      correction() {
        return -this.operationsPerSecond;
      }
    });

    phases.add('cooldown', {
      condition() {
        if (process.hrtime(this.cooldownTime)[0] > 10) {
          this.cooldownTime = null;
          this.operationsPerSecond = _.last(results);

          if (results[2]) {
            this.verifyTime = process.hrtime();
          }

          return 'active';
        }
      },
      correction() {
        return -this.operationsPerSecond;
      }
    });

    phases.add('spike', {
      condition() {
        if (this.currentLatency < 800) {
          this.spikeTime = null;

          return 'active';
        }

        if (process.hrtime(this.spikeTime)[0] > 20) {
          this.spikeTime = null;

          if (!results[0]) results[0] = this.operationsPerSecond * 0.60;
          else if (!results[1]) results[1] = results[2] = this.operationsPerSecond;
          if (results[2] && !results[3]) results[2] -= 500;

          console.log('RESUlTS', results);
          return 'waitForZeroLatency';
        }
      },
      correction() {
        return 0;
      }
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