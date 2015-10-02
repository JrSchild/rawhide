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
      text: 'Operations per Second'
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
  }]
});

var latencyBuffer = [];
var operationsPerSecondBuffer = [];
socket.on('latency', function (latency) {
  if (latency[1] <= 0 && !started) {
    return;
  }
  started = true;

  latency[1] = Math.round(latency[1]);
  latencyBuffer.push(latency);
});
socket.on('operationsPerSecond', function (operationsPerSecond) {
  operationsPerSecond[1] = Math.max(0, operationsPerSecond[1]);
  operationsPerSecondBuffer.push(operationsPerSecond);
});

setInterval(function () {
  var series = chart.highcharts().series;

  latencyBuffer.forEach(function (latency) { chart.highcharts().series[0].addPoint(latency, false); });
  operationsPerSecondBuffer.forEach(function (latency) { series[1].addPoint(latency, false); });

  latencyBuffer = [];
  operationsPerSecondBuffer = [];
  chart.highcharts().redraw(false);
}, 200);

$('#startTestRun').on('click', function () {
  $.get('/api/start');
});