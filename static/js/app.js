var socket, started, chart;

socket = io.connect('http://localhost:1337');

chart = $('#latencyChart').highcharts({
  chart: {
    zoomType: 'x'
  },
  title: {
    text: 'Latency increase and executed operations per second over time.'
  },
  credits: {
    enabled: false
  },
  xAxis: {
    type: 'datetime'
  },
  yAxis: [{
    title: {
      text: 'Latency'
    }
  }, {
    title: {
      text: '(Executed) Operations per Second'
    },
    opposite: true
  }],
  tooltip: {
    shared: true
  },
  legend: {
    layout: 'vertical',
    align: 'left',
    x: 80,
    verticalAlign: 'top',
    y: 55,
    floating: true,
    backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
  },
  plotOptions: {
    area: {
      fillOpacity: 0,
      marker: {
        radius: 2
      },
      lineWidth: 1,
      states: {
        hover: {
          lineWidth: 1
        }
      },
      threshold: null
    },
    series: {
      animation: false
    }
  },
  series: [{
    name: 'Latency',
    type: 'area',
    data: []
  }, {
    name: 'Operations per second',
    type: 'spline',
    yAxis: 1,
    data: []
  }, {
    name: 'Executed operations per second',
    type: 'area',
    yAxis: 1,
    data: []
  }]
});

var latencyBuffer = [];
var operationsPerSecondBuffer = [];
var executedOperationsPerSecondBuffer = [];
socket.on('latency', function (latency) {
  if (latency[1] <= 0 && !started) {
    return;
  }
  started = true;

  latency[1] = Math.round(latency[1]);
  latencyBuffer.push(latency);
});

var last;
socket.on('operationsPerSecond', function (operationsPerSecond) {
  operationsPerSecond[1] = Math.max(0, Math.round(operationsPerSecond[1]));
  if (last) {
    operationsPerSecondBuffer.push([operationsPerSecond[0] - 1, last]);
  }

  operationsPerSecondBuffer.push(operationsPerSecond);
  last = operationsPerSecond[1];
});

socket.on('queueCount', function (queueCount) {
  if (started) {
    console.log(queueCount[0], queueCount[1]);
  }
});

socket.on('executedOperationsPerSecond', function (executedOperationsPerSecond) {
  executedOperationsPerSecond[1] = Math.max(0, Math.round(executedOperationsPerSecond[1]));
  executedOperationsPerSecondBuffer.push(executedOperationsPerSecond);
});

setInterval(function () {
  var series = chart.highcharts().series;

  latencyBuffer.forEach(function (v) { chart.highcharts().series[0].addPoint(v, false); });
  operationsPerSecondBuffer.forEach(function (v) { series[1].addPoint(v, false); });
  executedOperationsPerSecondBuffer.forEach(function (v) { series[2].addPoint(v, false); });

  latencyBuffer = [];
  operationsPerSecondBuffer = [];
  executedOperationsPerSecondBuffer = [];
  chart.highcharts().redraw(false);
}, 200);

$('#startTestRun').on('click', function () {
  $.get('/api/start');
});