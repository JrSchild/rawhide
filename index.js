var Spawner = require('./core/Spawner');
var WebClient = require('./core/WebClient');
var parameters = require('./parameters.json');

var spawner = new Spawner(parameters);
spawner.connect()
  .then(() => new WebClient(spawner))
  .catch((err) => {/** TODO **/});