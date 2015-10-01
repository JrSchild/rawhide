"use strict"

var blessed = require('blessed');
var contrib = require('blessed-contrib');

class Dashboard {
  constructor(spawner) {
    this.spawner = spawner;
    this.data = {
      currentLatency: {
        title: 'Latency',
        style: { line: 'green' },
        x: [],
        y: []
      },
      operationsPerSecond: {
        title: 'Operations per Second',
        style: { line: 'red' },
        x: [],
        y: []
      }
    };
  }

  render() {
    var screen = this.screen = blessed.screen()

    var grid = this.grid = new contrib.grid({rows: 12, cols: 12, screen: screen})

    var counter = 0;

    var transactionsLine = grid.set(0, 0, 6, 6, contrib.line, {
      showNthLabel: 5,
        maxY: 100,
        label: 'Total Transactions',
        showLegend: true,
        legend: {
          width: 10
        }
    });
    var transactionsLine2 = grid.set(0, 6, 6, 6, contrib.line, {
      showNthLabel: 5,
        maxY: 100,
        label: 'Set ops per second',
        showLegend: true,
        legend: {
          width: 10
        }
    });

    setInterval(() => {
      this.data.currentLatency.x.push(`${counter}`);
      this.data.currentLatency.y.push(this.spawner.throughputController.currentLatency);

      this.data.operationsPerSecond.x.push(`${counter}`);
      this.data.operationsPerSecond.y.push(this.spawner.throughputController.operationsPerSecond);

      setLineData([this.data.currentLatency], transactionsLine);
      setLineData([this.data.operationsPerSecond], transactionsLine2);
      this.screen.render();

      counter++;
    }, 1000);

    var transactionsData = {
      title: 'USA',
      style: {line: 'red'},
      x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:30', '00:40', '00:50', '01:00', '01:10', '01:20', '01:30', '01:40', '01:50', '02:00', '02:10', '02:20', '02:30', '02:40', '02:50', '03:00', '03:10', '03:20', '03:30', '03:40', '03:50', '04:00', '04:10', '04:20', '04:30'],
      y: [0, 20, 40, 45, 45, 50, 55, 70, 65, 58, 50, 55, 60, 65, 70, 80, 70, 50, 40, 50, 60, 70, 82, 88, 89, 89, 89, 80, 72, 70]
    }

    var transactionsData1 = {
      title: 'Europe',
      style: {line: 'yellow'},
      x: ['00:00', '00:05', '00:10', '00:15', '00:20', '00:30', '00:40', '00:50', '01:00', '01:10', '01:20', '01:30', '01:40', '01:50', '02:00', '02:10', '02:20', '02:30', '02:40', '02:50', '03:00', '03:10', '03:20', '03:30', '03:40', '03:50', '04:00', '04:10', '04:20', '04:30'],
      y: [0, 5, 5, 10, 10, 15, 20, 30, 25, 30, 30, 20, 20, 30, 30, 20, 15, 15, 19, 25, 30, 25, 25, 20, 25, 30, 35, 35, 30, 30]
    }

    setLineData([this.data.currentLatency], transactionsLine);
    setLineData([this.data.operationsPerSecond], transactionsLine2);

    function setLineData(mockData, line) {
      for (var i=0; i<mockData.length; i++) {
        var last = mockData[i].y[mockData[i].y.length-1]
        mockData[i].y.shift()
        var num = Math.max(last + Math.round(Math.random()*10) - 5, 10)    
        mockData[i].y.push(num)  
      }
      
      line.setData(mockData)
    }

    var log = grid.set(6, 0, 6, 12, contrib.log, {
      fg: "green",
      selectedFg: "green",
      label: 'Server Log'
    });

    // Set log dummy data
    var servers = ['US1', 'US2', 'EU1', 'AU1', 'AS1', 'JP1'];
    var commands = ['grep', 'node', 'java', 'timer', '~/ls -l', 'netns', 'watchdog', 'gulp', 'tar -xvf', 'awk', 'npm install'];
    setInterval(function() {
      var rnd = Math.round(Math.random()*2);

      if (rnd==0) log.log('starting process ' + commands[Math.round(Math.random()*(commands.length-1))]);
      else if (rnd==1) log.log('terminating server ' + servers[Math.round(Math.random()*(servers.length-1))]);
      else if (rnd==2) log.log('avg. wait time ' + Math.random().toFixed(2));
      screen.render();
    }, 500);

    screen.render();
  }
}

module.exports = Dashboard;