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
      .then(() => this.run());
    this.discreteGenerator = new DiscreteGenerator(parameters.thread.proportions);
    this.operationMethod = () => this[this.discreteGenerator.next](this.counter.add());

    process.on('message', (message) => {
      if (message.type === 'setOperationsPerSecond') {
        this.operationsPerSecond = message.data;
      } else if (message.type === 'pushOperations') {
        this.pushOperationsPerSecond(message.data);
      }
    });
  }

  run() {
    this.execute('Running', this.parameters.operations, this.operationMethod);
  }

  // Immediately execute a set amount of operations.
  pushOperationsPerSecond(operations) {
    this.counter = new LimitCounter(operations, (err) => {
      if (err) {
        process({
          type: 'finishedWithError',
          err, err
        });
        throw err;
      }

      process.send('finished');
    });

    while (operations--) {
      this.operationMethod();
    }
  }

  execute(name, operations, operationMethod) {
    if (this[`is${name}`] || this.isBusy) return;
    // console.log(`Start ${name}.`);

    this.isBusy = true;
    this[`is${name}`] = true;
    this[`start${name}Time`] = Date.now();
    this.counter = new LimitCounter(operations, (err) => {
      if (err) throw err;

      this[`is${name}`] = false;
      this.isBusy = false;

      var end = Date.now() - this[`start${name}Time`];
      console.log(`finished ${name}`, ~~(end / 1000) + 's', `(${end})ms`);
      process.send({
        type: `finished${name}`
      });
    });
    this.emitCounterInterval = setInterval(() => {
      process.send({
        type: 'queueCount',
        pid: process.pid,
        data: this.counter.prepCurrent - this.counter.current
      });
    }, 500);
    this.loadingInterval = setInterval(this.runSecond.bind(this, operationMethod), 1000);
  }

  runSecond(operationMethod) {
    var interval = 1000 / settings.loadSplit;
    var opsPerInterval = ~~(this.operationsPerSecond / settings.loadSplit);

    if (this.counter.isLimit) {
      clearInterval(this.emitCounterInterval);
      return clearInterval(this.loadingInterval);
    }

    // Divide the operations per second over `settings.loadSplit` number of intervals.
    for (let i = 0; i < settings.loadSplit; i++) {
      setTimeout(() => {
        for (let l = opsPerInterval; l-- > 0 && !this.counter.isLimit && this.counter.inQueue < settings.queueLimit;) operationMethod();
      }, i * interval);
    }
  }
}

module.exports = Workload;