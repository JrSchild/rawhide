var Spawner = require('./core/Spawner.js');
var Dashboard = require('./core/Dashboard.js');
var Statistics = require('./core/Statistics.js');
var parameters = require('./parameters.json');

var spawner = new Spawner(parameters);
var dashboard = new Dashboard(spawner);
    dashboard.render();