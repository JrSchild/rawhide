"use strict"

var DiscreteGenerator = require('./DiscreteGenerator.js');
var LimitCounter = require('./LimitCounter.js');
var settings = require('../settings.json').workload;

// When throughtputMode set to true: rather than running with a fixed number of operations
// per second, it will try to execute as many operations as possible.

/**
 * Process Events:
 *   connected       - Database connection successfuly established.
 *   finishedLoading - When the table has been created and the dummy data is inserted.
 */
class Workload {
  constructor(parameters) {
    this.parameters = parameters;
    this.operationsPerSecond = settings.operationsPerSecond;
    this.loadRecords = parameters.settings.loadRecords;
    this.isLoading = false;

    this.model = new (require(`../models/${parameters.thread.model}.js`))(parameters);
    this.discreteGenerator = new DiscreteGenerator(parameters.thread.proportions);

    process.on('message', (message) => {
      if (message.type === 'setOperationsPerSecond') {
        console.log(`setting operations per seconds ${message.data}`);

        this.operationsPerSecond = message.data;
      }
    });
  }

  destructor() {}

  executeLoad() {
    if (this.isLoading) return;
    console.log('start loading phase');

    this.isLoading = true;
    this.loadingCounter = 0;
    this.counter = new LimitCounter(this.parameters.settings.loadRecords, (err) => {
      process.send({
        type: 'finishedLoading'
      });
    });
    this.loadingInterval = setInterval(this.loadSecond.bind(this), 1e3);
  }

  loadSecond() {
    var interval = 1e3 / settings.loadSplit;
    var opsPerInterval = ~~(this.operationsPerSecond / settings.loadSplit);

    console.log(`load ${opsPerInterval} records per ${interval}ms`, Date.now(), this.counter.prepCurrent, this.counter.current);
    if (this.counter.isLimit) {
      return clearInterval(this.loadingInterval);
    }

    for (let i = 0; i < settings.loadSplit; i++) {
      setTimeout(() => {
        for (let l = opsPerInterval; l-- && !this.counter.isLimit;) {
          this.load(this.counter.add());
        };
      }, i * interval);
    }
  }

  loadTable() {}

  run() {}

  stop() {}

  // Define transactions
  WRITE(metric) {
    return Math.random();
    // return this.model.write({someData: true}, metric);
  }

  READ(metric) {
    return Math.round(Math.random() * 100);
    // return this.model.read(metric);
  }
}

module.exports = Workload;