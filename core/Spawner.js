"use strict"

var fork = require('child_process').fork;
var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');
var ThroughputController = require('./ThroughputController.js');

class Spawner {
  constructor(settings) {
    this.settings = settings;
    this.threads = [];
    this.threadsConnected = [];
    this.threadsLoaded = [];
    this.spawnThreads();
    this.throughputController = new ThroughputController(this.threads);

    Promise.all(this.threadsConnected).then(() => this.startLoad());
    Promise.all(this.threadsLoaded).then(() => console.log('All threads are loaded'));
  }

  spawnThreads() {
    this.settings.threads.forEach((thread) => {
      _.times(thread.multiply || 1, this.spawnThread.bind(this, thread));
    });
  }

  spawnThread(thread) {
    var resolverConnected = Promise.pending();
    var resolverLoaded = Promise.pending();
    var process = fork(path.resolve(__dirname, '../client.js'));

    // TODO: Imporove error handling.
    process.on('error', (error) => {
    });

    // When process is connected
    process.on('message', (message) => {
      if (message.type === 'connected') {
        resolverConnected.resolve();
      } else if (message.type === 'finishedLoading') {
        resolverLoaded.resolve();
      } else if (message.type === 'connectionError') {
        resolverConnected.reject('NotConnectedError');
        resolverLoaded.reject('NotConnectedError');
      }
    });

    // Initialize the client with settings and add to list of threads.
    process.send({
      type: 'init',
      data: {
        thread: thread,
        settings: this.settings
      }
    });
    this.threads.push(process);
    this.threadsConnected.push(resolverConnected.promise);
    this.threadsLoaded.push(resolverLoaded.promise);
  }

  startLoad() {
    this.threads.forEach(function (process) {
      process.send({
        type: 'load'
      });
    });
  }
}

module.exports = Spawner;