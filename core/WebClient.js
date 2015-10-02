"use strict"

var express = require('express');
var socket = require('socket.io');

/**
 * Creates an epxress app and pipes through data realtime to the browser.
 */
class WebClient {
  constructor(spawner) {
    this.spawner = spawner;
    this.app = express();
    this.app.use(express.static('static'));

    this.app.get('/api/start', (req, res) => {
      if (this.spawner.start()) {
        console.log('Started Spawner.');
      }
      res.status(204);
    });

    this.server = this.app.listen(1337, () => {
      console.log('Express is listening to http://localhost:3000');
    });

    this.io = socket.listen(this.server);

    this.spawner.threads.forEach((thread) => {
      console.log(thread);
    });
    this.io.sockets.emit('message', {blaat: 'hi'});
  }
}

module.exports = WebClient;