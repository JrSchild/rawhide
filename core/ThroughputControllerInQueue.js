'use strict'

var _ = require('lodash');
var settings = require('../settings.json');
var ThroughputController = require('./ThroughputController');
var LimitQueue = require('./LimitQueue');
var PhaseControl = require('./PhaseControl');

/**
 * Increase the operations per second based on what is in the queue.
 * Statistics will measure the finished operations per seconds.
 */
class ThroughputControllerInQueue extends ThroughputController {

  // Overwrite initThreads so we are sure it's not listening.
  initThreads() {}

  start() {
    var phases;

    this.queueCount = 0;
    this.started = false;
    this.queueCountCap = 10000;
    this.queueCountBottom = 5000;
    this.executedOperationsPerSecondQueue = new LimitQueue(5);

    this.statistics.on('queueCount', (queueCount) => {
      this.queueCount = queueCount[1];

      if (this.queueCount > last / 2 && !running) {
        console.log('running!');
        running = true;
      }
      if (this.queueCount === 0 && startTime && running) {
        finished = Date.now();
        this.statistics.setResult(last / ((finished - startTime) / 1000));
        running = false;
        process.exit();
      }
    });
    this.statistics.on('executedOperationsPerSecond', (executedOperationsPerSecond) => {
      this.executedOperationsPerSecondQueue.push(executedOperationsPerSecond[1]);
    });
    this.statistics.on('latency', (latency) => {
      if (latency[1]) {
        this.started = true;
      }
    });

    phases = new PhaseControl('active', this, true);

    this.avgOperationsPerSecond = null;
    this.targetQueueSize = null;

    var startTime, finished, running;
    var last = 50000;

    phases.add('active', {
      condition() {
        if (finished) {
          console.log('finished, cooldown?');
          finished = null;
          startTime = null;
        }
      },
      correction() {
        if (!startTime) {
          startTime = Date.now();
          return last;
        }
        return -this.operationsPerSecond;
      }
    });
    
    this.opsPerSecUpdater = setInterval(() => {
      var correction;

      if (!this.started) {
        return;
      }

      // Update operationsPerSecond, make sure its between min and max value and send out data.
      this.operationsPerSecond += phases.next();
      this.operationsPerSecond = Math.max(0, this.operationsPerSecond);
      this.emitOperationsPerSecond();
    }, 1000);
  }
}

module.exports = ThroughputControllerInQueue;