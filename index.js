var Spawner = require('./core/Spawner');
var WebClient = require('./core/WebClient');
var parameters = require('./parameters.json');

var spawner = new Spawner(parameters);
var webClient = new WebClient(spawner);