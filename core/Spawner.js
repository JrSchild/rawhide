'use strict'

var fork = require('child_process').fork;
var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');
var loader = require('./lib/loader');
var ThroughputController = require('./ThroughputControllerSteps');
var Statistics = require('./Statistics');
var globalSettings = require('../settings.json');

class Spawner {
  constructor(settings) {
    this.settings = settings;
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

    this.settings.threads.forEach((thread) => {
      _.times(thread.multiply || 1, this.spawnThread.bind(this, thread));
    });

    // this.threadsConnected is an array of promises. Turn it into one promise to be resolved.
    return (this.threadsConnected = Promise.all(this.threadsConnected));
  }

  spawnThread(thread) {
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
    this.sendToProcess('init', {
      thread: thread,
      settings: this.settings
    })(process);
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

    if (globalSettings.preTruncate) {
      console.log('Clearing database');

      promise = this.clearDB();
    }

    return promise
      .then(() => this.spawnThreads())
      .tap(() => console.log('All threads connected'))
      .then(() => {
        this.statistics = new Statistics(this.threads);
        this.throughputController = new ThroughputController(this.threads, this.statistics);
      });
  }

  clearDB() {
    var db = new (loader(`./databases/${this.settings.database}`))();

    return db.connect().then(db.clearDB.bind(db));
  }
}

module.exports = Spawner;