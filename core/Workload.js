"use strict"

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
    this.operationsPerSecond = settings.minOperationsPerSecond;
    this.loadRecords = parameters.settings.loadRecords;

    this.model = new (require(`../models/${parameters.thread.model}.js`))(parameters);
    this.discreteGenerator = new DiscreteGenerator(parameters.thread.proportions);

    process.on('message', (message) => {
      if (message.type === 'setOperationsPerSecond') {
        this.operationsPerSecond = message.data;
      }
    });
  }

  destructor() {}

  executeLoad() {
    this.execute('Loading', this.parameters.settings.loadRecords, () => this.load(this.counter.add()));
  }

  executeRun() {
    this.execute('Running', this.parameters.thread.runOperations, () => {
      this[this.discreteGenerator.next](this.counter.add())
    });
  }

  execute(name, operations, operationMethod) {
    if (this[`is${name}`] || this.isBusy) return;
    console.log(`Start ${name} phase.`);

    this.isBusy = true;
    this[`is${name}`] = true;
    this[`start${name}Time`] = Date.now();
    this.operationsPerSecond = settings.operationsPerSecond;
    this.counter = new LimitCounter(operations, (err) => {
      this[`is${name}`] = false;
      this.isBusy = false;

      var end = Date.now() - this[`start${name}Time`];
      console.log(`finished ${name}`, ~~(end / 1000) + 's', `(${end})ms`);
      process.send({
        type: `finished${name}`
      });
    });
    this.loadingInterval = setInterval(this.runSecond.bind(this, operationMethod), 1000);
  }

  runSecond(operationMethod) {
    var interval = 1000 / settings.loadSplit;
    var opsPerInterval = ~~(this.operationsPerSecond / settings.loadSplit);

    if (this.counter.isLimit) {
      return clearInterval(this.loadingInterval);
    }

    // Divide the operations per second over `settings.loadSplit` number of intervals.
    for (let i = 0; i < settings.loadSplit; i++) {
      setTimeout(() => {
        for (let l = opsPerInterval; l-- && !this.counter.isLimit;) operationMethod();
      }, i * interval);
    }
  }

  loadTable() {}

  run() {}

  stop() {}
}

module.exports = Workload;