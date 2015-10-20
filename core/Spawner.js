'use strict'

var fork = require('child_process').fork;
var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');
var loader = require('./lib/loader');
var ThroughputController = require('./ThroughtputControllerSteps');
var globalSettings = require('../settings.json');

class Spawner {
  constructor(settings) {
    this.settings = settings;
    this.threads = [];
    this.threadsConnected = [];
    this.threadsLoaded = [];
  }

  start() {
    if (this.started) {
      return;
    }

    this.started = true;

    Promise.all(this.threadsConnected).then(() => console.log('All threads are connected.'));
    Promise.all(this.threadsLoaded).then(() => console.log('All threads are loaded.'));

    Promise.all(this.threadsConnected).then(() => this.sendToThreads(!this.settings.skipLoadingPhase ? 'load' : 'run'));
    Promise.all(this.threadsLoaded).then(() => {
      this.throughputController.reset();
      !this.settings.skipLoadingPhase && this.sendToThreads('run');
    });

    return true;
  }

  spawnThreads() {
    this.settings.threads.forEach((thread) => {
      _.times(thread.multiply || 1, this.spawnThread.bind(this, thread));
    });
  }

  spawnThread(thread) {
    var resolverConnected = Promise.pending();
    var resolverLoaded = Promise.pending();
    var process = fork(path.resolve(__dirname, '../worker.js'));

    // TODO: Imporove error handling.
    process.on('error', (error) => {});

    // When process is connected
    process.on('message', (message) => {
      if (message.type === 'connected') {
        resolverConnected.resolve();
      } else if (message.type === 'finishedLoading') {
        resolverLoaded.resolve();
      } else if (message.type === 'errorConnecting') {
        resolverConnected.reject(message.data);
        // resolverLoaded.reject();
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
    this.threadsLoaded.push(resolverLoaded.promise);
  }

  sendToThreads(type, data) {
    this.threads.forEach(this.sendToProcess(type, data));
  }

  sendToProcess(type, data) {
    var command = _.defaults({type, data}, {data: null});

    return (process) => process.send(command);
  }

  // This method should resolve after the threads
  // are connected to the database.
  connect() {
    var promise = Promise.resolve();

    if (globalSettings.preTruncate) {
      promise = this.clearDB();
    }

    return promise.then(() => {
      this.spawnThreads();
      this.throughputController = new ThroughputController(this.threads);
    });
  }

  clearDB() {
    var db = new (loader(`./databases/${this.settings.database}`))();

    return db.connect().then(db.clearDB.bind(db));
  }
}

module.exports = Spawner;