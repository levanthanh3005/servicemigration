const express = require('express');

const bodyParser = require('body-parser');
const request = require('request');

var path = require('path');
var fs = require('fs');

var http = require('http');

var port = process.env.PORT || 3000;

var externalPort = process.env.EXTERNALPORT || 3000;

const app = express()
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

var data = {}

app.get('/', function (req, res) {
  // res.render('index');
  res.redirect("/index");
})

app.get('/index', function (req, res) {
  //docker-machine ssh swarm-00 "docker stack ls"

  var render = function(){
    res.render('notification', {
      data : data
    });
  }

  render();
})

app.get('/getNotification', function (req, res) {
  res.send(data);
})

app.post('/notification', function (req, res) {
  res.send("Done");
  var addr = req.connection.remoteAddress;
  addr = addr.split(":").pop();
  data = req.body;
  data.ipAddress = addr;
});

http.createServer(app).listen(port, function () {
  console.log('Notification app listening on port' + port);
});