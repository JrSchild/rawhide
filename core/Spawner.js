'use strict'

var fork = require('child_process').fork;
var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');
var loader = require('./lib/loader');
var ThroughputController = require('./ThroughputControllerPush');
var Statistics = require('./Statistics');
var settings = require('../settings.json');

class Spawner {
  constructor(parameters) {
    this.parameters = parameters;
    this.threads = [];
    this.threadsConnected = [];
  }

  start() {
    if (this.started) {
      return;
    }

    this.started = true;
    this.threadsConnected.then(() => this.throughputController.start());

    return true;
  }

  spawnThreads() {
    console.log('Spawning threads');

    // Also send the start time of when the threads are spanwed to each thread.
    // Useful for unique generation of objectIds as date in combination with thread number.
    this.startTime = Date.now();

    _.times(this.parameters.thread.multiply || 1, (id) => this.spawnThread(id));

    // this.threadsConnected is an array of promises. Turn it into one promise to be resolved.
    return (this.threadsConnected = Promise.all(this.threadsConnected));
  }

  spawnThread(id) {
    var resolverConnected = Promise.pending();
    var process = fork(path.resolve(__dirname, '../worker.js'));

    // TODO: Imporove error handling.
    process.on('error', (error) => {});

    // When process is connected
    process.on('message', (message) => {
      if (message.type === 'connected') {
        resolverConnected.resolve();
      } else if (message.type === 'errorConnecting') {
        resolverConnected.reject(message.data);
      }
    });

    resolverConnected.promise.catch(console.error);

    // Initialize the client with settings and add to list of threads.
    this.sendToProcess('init', _.merge({
      id: id,
      start: this.startTime
    }, this.parameters))(process);
    this.threads.push(process);
    this.threadsConnected.push(resolverConnected.promise);
  }

  sendToThreads(type, data) {
    this.threads.forEach(this.sendToProcess(type, data));
  }

  sendToProcess(type, data) {
    var command = _.defaults({type, data}, {data: null});

    return (process) => process.send(command);
  }

  connect() {
    var promise = Promise.resolve();

    if (settings.preTruncate) {
      console.log('Clearing database');

      promise = this.clearDB();
    }

    return promise
      .then(() => this.spawnThreads())
      .tap(() => console.log('All threads connected'))
      .then(() => {
        this.statistics = new Statistics(this);
        this.throughputController = new ThroughputController(this);
      });
  }

  clearDB() {
    this.db = new (loader(`./databases/${this.parameters.database}`))();

    return this.db.connect()
      .then(() => this.db.clearDB());
  }
}

module.exports = Spawner;