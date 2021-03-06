'use strict'

var EventEmitter = require('events');
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var loader = require('./lib/loader');
var settings = require('../settings.json');
var parameters = loader('./parameters.json')

/**
 * For now this class simply intercepts statistics and allows other classes
 * to listen for events or something like this. It's still a little abstract
 * but it will defintely be necessary.
 */
class Statistics extends EventEmitter {
  constructor(spawner) {
    super();
    this.threads = spawner.threads;

    // Required to retrieve extra statistics on collection through db instance.
    this.db = spawner.db;

    // Keep latencies in ms until cleared, defined by settings.updateLatencyInterval.
    this.latencies = [];

    // key: time in seconds,
    // value: count
    this.operationsPerSecond = {};

    // Stores the queueCount for each thread with pid as key.
    this.queueCounts = {};

    this.initThreads();
    this.initLatencyUpdater();

    // Keep an array of results.
    this.results = [];
  }

  // Start listening to all threads.
  initThreads() {
    this.threads.forEach((thread) => thread.on('message', this.onThreadMessage.bind(this)));
  }

  onThreadMessage(message) {
    if (message.type === 'latency') {
      this.latencies.push(message.end - message.start);
      this.updateOpsPerSec(message.end);
    } else if (message.type === 'queueCount') {
      this.queueCounts[message.pid] = message.data;
      this.updateQueueCount();
    }
  }

  // Keep a hashmap per second with a counter as value.
  updateOpsPerSec(time, skipIncrement) {
    var key = ~~(time / 1000);

    if (this.operationsPerSecond[key] && !skipIncrement) {
      return this.operationsPerSecond[key]++;
    }

    // A new entry was made, emit the last amount of operations per seconds.
    if (this.operationsPerSecond[key - 1]) {
      this.emit('executedOperationsPerSecond', [Date.now(), this.operationsPerSecond[key - 1]]);
    }

    // Start the new seconds-data. Cleanup previous value (for now).
    if (!this.operationsPerSecond[key]) {
      this.operationsPerSecond = { [key]: skipIncrement ? 0 : 1 };
    }
  }

  // TODO: This could be made async. ThroughputControllerPush can wait
  // for this until exiting program. On the other side who cares, this
  // is the last thing that needs to happen and the program will close
  // after this regardless.
  finish() {
    var now = Date.now();

    this.emit('executedOperationsPerSecond', [now, 0]);
    this.emit('queueCount', [now, 0]);
    this.emit('latency', [now, 0]);

    var resultPath = path.resolve(process.cwd(), './results');

    Statistics.ensureDirSync(resultPath);

    // Load the Model and check if it has a static name method. Use that, otherwise use the real name.
    var model = loader(`./models/${parameters.thread.model}`);
    model = _.isFunction(model.name) && model.name() || parameters.thread.model;
    var data = {
      date: new Date(),
      operations: parameters.operations,
      workload: parameters.thread.workload,
      results: this.results,
      average: _.sum(this.results) / this.results.length
    };

    var resultsLatest = Statistics.requireOrCreate(resultPath + '/results.latest.json');
    var resultsAll = Statistics.requireOrCreate(resultPath + '/results.all.json');

    return this.db.stats()
      .then((stats) => {
        _.merge(data, stats);

        resultsLatest[model] = data;
        resultsAll[model] = resultsAll[model] || [];
        resultsAll[model].push(data);

        fs.writeFileSync(resultPath + '/results.latest.json', JSON.stringify(resultsLatest, undefined, 2));
        fs.writeFileSync(resultPath + '/results.all.json', JSON.stringify(resultsAll, undefined, 2));
      });
  }

  initLatencyUpdater() {
    setInterval(() => {
      var length;

      this.updateOpsPerSec(Date.now(), true);

      // If no latencies are recieved send out null.
      if (!(length = this.latencies.length)) {
        return this.emit('latency', [Date.now(), null])
      }

      // Calculate average and notify to listeners.
      this.emit('latency', [Date.now(), _.sum(this.latencies) / length]);

      // Start fresh on next iteration.
      this.latencies = [];
    }, settings.updateLatencyInterval);
  }

  // Waits until queue count of all threads are in, then rewrites the
  // method to a throttled function that emits the sum of all threads.
  updateQueueCount() {
    if (Object.keys(this.queueCounts).length === this.threads.length) {
      this.updateQueueCount = _.throttle(() => {
        this.emit('queueCount', [Date.now(), _.sum(this.queueCounts)]);
      }, 100);
    }
  }

  setResult(result) {
    console.log(`New result: ${result} operations per second.`);
    this.results.push(result);
  }
  
  static requireOrCreate(path, otherwise) {
    try {
      return require(path);
    } catch (error) {
      return otherwise || {};
    }
  }

  static ensureDirSync(dirPath) {
    try {
      fs.mkdirSync(dirPath);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }
}

module.exports = Statistics;