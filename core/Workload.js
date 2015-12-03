'use strict'

var loader = require('./lib/loader');
var DiscreteGenerator = require('./DiscreteGenerator');
var LimitCounter = require('./LimitCounter');
var settings = require('../settings.json');

/**
 * Process Events:
 *   connected       - Database connection successfuly established.
 *   finishedLoading - When the table has been created and the dummy data is inserted.
 *   finishedRunning - When the workload has finished running.
 */
class Workload {
  constructor(parameters) {
    this.parameters = parameters;
    this.operationsPerSecond = 0;

    this.model = new (loader(`./models/${parameters.thread.model}`))(parameters);
    this.model.connect()
      .then(() => this.start());
    this.discreteGenerator = new DiscreteGenerator(parameters.thread.proportions);

    process.on('message', (message) => {
      if (message.type === 'setOperationsPerSecond') {
        this.operationsPerSecond = message.data;
      } else if (message.type === 'pushOperations') {
        this.pushOperationsPerSecond(message.data);
      }
    });
  }

  start() {
    this.initQueueCountInterval();
  }

  operationMethod() {
    return this[this.discreteGenerator.next](this.counter.add());
  }

  // Immediately execute a set amount of operations.
  pushOperationsPerSecond(operations) {
    this.counter = new LimitCounter(operations, (err) => {
      if (err) {
        throw err;
      }

      process.send('finished');
    });

    splitExec(operations, 20, 50, (i) => {
      while (i--) this.operationMethod();
    });
  }

  initQueueCountInterval() {
    this.queueCountInterval = setInterval(() => {
      if (!this.counter) {
        return;
      }

      process.send({
        type: 'queueCount',
        pid: process.pid,
        data: this.counter.prepCurrent - this.counter.current
      });
    }, 500);
  }
}

function splitExec(operations, split, delay, fn, iteration) {
  var parts;

  if ((iteration = iteration || 0) >= split) return;

  parts = operations / split;
  fn(parts, iteration);

  setTimeout(() => {
    splitExec(operations, split, delay, fn, ++iteration);
  }, delay);
}

module.exports = Workload;