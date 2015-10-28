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

  initThroughputEmitter() {
    var phases;

    this.queueCount = 0;
    this.started = false;
    this.queueCountCap = 10000;
    this.queueCountBottom = 5000;
    this.executedOperationsPerSecondQueue = new LimitQueue(5);

    this.statistics.on('queueCount', (queueCount) => {
      this.queueCount = queueCount[1];
    });
    this.statistics.on('executedOperationsPerSecond', (executedOperationsPerSecond) => {
      this.executedOperationsPerSecondQueue.push(executedOperationsPerSecond[1]);
    });
    this.statistics.on('latency', (latency) => {
      if (latency[1]) {
        this.started = true;
      }
    });

    phases = new PhaseControl('loadQueue', this, true);

    this.avgOperationsPerSecond = null;
    this.targetQueueSize = null;

    phases.add('loadQueue', {
      condition() {
        if (this.queueCount > 40000) {
          this.lastAvg = this.executedOperationsPerSecondQueue.average();
          return 'cooldown'
        }
        console.log(this.operationsPerSecond, this.executedOperationsPerSecondQueue.average(), this.queueCount);
      },
      correction() {
        return 1000;
      }
    });

    phases.add('cooldown', {
      condition() {
        console.log('cooling down', this.queueCount, this.lastAvg);
        if (this.queueCount < this.lastAvg * 5) {
          this.operationsPerSecond = this.lastAvg;
          this.executedOperationsPerSecondQueue = new LimitQueue(5);
          return 'active';
        }
      },
      correction() {
        return -this.operationsPerSecond;
      }
    })

    phases.add('active', {
      condition() {},
      correction() {
        if (this.executedOperationsPerSecondQueue.data.length === 5) {
          this.queueCountCap = Math.max(this.executedOperationsPerSecondQueue.average() * 10, this.queueCountCap);
        }
        console.log(this.queueCountCap / 10);
        var change = 500;
        if (this.queueCount > this.queueCountCap) {
          change = -200;
        }
        console.log('in queue:', this.queueCount, 'ops per sec:', this.operationsPerSecond + change);
        return change;
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
      // this.operationsPerSecond = 20000;
      this.emitOperationsPerSecond();
    }, 1000);
  }
}

module.exports = ThroughputControllerInQueue;