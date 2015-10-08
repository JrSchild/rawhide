var Benchmark = require('benchmark');
var microtime = require('microtime');

(new Benchmark.Suite)
.add('Date.now()', () => {
  Date.now();
})
.add('new Date().getTime()', () => {
  new Date().getTime();
})
.add('process.hrtime()', () => {
  process.hrtime();
})
.add('microtime.now()', () => {
  microtime.now();
})
.add('microtime.nowDouble()', () => {
  microtime.nowDouble();
})
.add('microtime.nowStruct()', () => {
  microtime.nowStruct();
})
.on('cycle', (event) => console.log(`${event.target}`))
.run({async: true});