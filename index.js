var loader = require('./core/lib/loader');
var Spawner = require('./core/Spawner');
var WebClient = require('./core/WebClient');
var parameters = loader('./parameters.json');

var spawner = new Spawner(parameters);

module.exports = spawner.connect()
  .then(() => new WebClient(spawner))
  .then(() => spawner)

module.exports.catch(console.error); // TODO