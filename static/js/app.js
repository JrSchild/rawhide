var socket;

socket = io.connect('http://localhost:1337');

socket.on('message', function (data) {
  console.log(data);
});


$('#startTestRun').on('click', function () {
  $.get('/api/start');
});