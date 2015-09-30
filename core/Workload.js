"use strict"

var DiscreteGenerator = require('./DiscreteGenerator.js');
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
    // console.log(parameters.settings.loadRecords);
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
    // this.counter = new LimitCounter();
    this.loadingInterval = setInterval(this.loadSecond.bind(this), 1e3);
  }

  loadSecond() {
    var interval = 1e3 / settings.loadSplit;
    var opsPerInterval = ~~(this.operationsPerSecond / settings.loadSplit);

    if (this.loadingCounter >= this.parameters.settings.loadRecords) {
      console.log('finished loading');
      clearInterval(this.loadingInterval);
      process.send({
        type: 'finishedLoading'
      });
      return;
    }

    console.log(`load ${opsPerInterval} records per ${interval}ms`, Date.now(), this.loadingCounter);
    for (let i = 0; i < settings.loadSplit; i++) {
      setTimeout(() => {
        for (var l = opsPerInterval; l--;) this.load();
      }, i * interval);
    }
  }

  // If this method is implemented the spawner will ask the thread to load data.
  load() {
    this.loadingCounter++;
    // console.log('load');
    // this.model.adapter.WRITE();
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

// class LimitCounter {
//   constructor(limit, cb) {
//     this.limit = limit;

//     // prepLimit is raise before the async method is called.
//     this.preplimit = 0;
//     this.current = 0;
//     this.cb = cb;
//   }

//   isLimit() {
//     return this.prepLimit >= this.limit;
//   }

//   addPrep(number) {
//     this.prepLimit += number;
//   }

//   add(number) {
//     this.current += number;

//     if (this.isLimit()) {
//       cb();
//     }
//   }
// }

module.exports = Workload;