var request = require('request');
var path = require('path');
var fs = require('fs');

var filename = process.argv[2];

var target = 'http://localhost:3000/upload/' + path.basename(filename);

var rs = fs.createReadStream(filename);
var ws = request.post(target);

ws.on('drain', function () {
  console.log('drain', new Date());
  rs.resume();
});

rs.on('end', function () {
  console.log('uploaded to ' + target);
});

ws.on('error', function (err) {
  console.error('cannot send file to ' + target + ': ' + err);
});

rs.pipe(ws);