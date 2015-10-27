'use strict'

var express = require('express');
var socket = require('socket.io');
var _ = require('lodash');

/**
 * Creates an epxress app and pipes through data realtime to the browser.
 */
class WebClient {
  constructor(spawner) {
    this.spawner = spawner;
    this.app = express();
    this.app.use(express.static(`${__dirname}/../static`));

    this.app.get('/api/start', (req, res) => {
      if (this.spawner.start()) {
        console.log('Started Spawner.');
      }
      res.status(204);
    });

    this.server = this.app.listen(1337, () => {
      console.log('Express is listening to http://localhost:1337');
    });

    this.io = socket.listen(this.server);

    this.spawner.statistics.on('latency', (latency) => {
      this.io.sockets.emit('latency', latency);
    });
    this.spawner.throughputController.on('operationsPerSecond', (operationsPerSecond) => {
      this.io.sockets.emit('operationsPerSecond', [Date.now(), operationsPerSecond]);
    });

    this.threadsCounterStates = {};
    this.spawner.threads.forEach((thread) => {
      thread.on('message', (message) => {
        if (message.type === 'counterState') {
          this.threadsCounterStates[message.pid] = message.data;
        }
      });
    });

    setInterval(() => {
      this.io.sockets.emit('counterState', [Date.now(), _.sum(this.threadsCounterStates)]);
    }, 600);
  }
}

module.exports = WebClient;