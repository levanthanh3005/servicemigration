const express = require('express');
const extras = require('./extras');

const bodyParser = require('body-parser');
const request = require('request');

var path = require('path');
var fs = require('fs');

var http = require('http');

var port = process.env.PORT || 3000;

var externalPort = process.env.EXTERNALPORT || 3000;

var SMPath = process.env.SMPath;
var org = process.env.ORG;

// var gobetween = process.env.GOBETWEEN;

// var myIp = "";

const app = express()
app.use(bodyParser.json());

var MECIp = "find that";

app.use(bodyParser.urlencoded({ extended: true }));


app.post('/start', function (req, res) {
  
  /*
// data = {
//   "DockerImage" : "levanthanh3005/nodecasting:countdown",
//   "serviceName" : "nodecasting",
//   "ports" : [5000],
//   "env" : ["RATIO=0.3","VIDEO_PATH=","MODE=SERVER","INTERNALPORT=5000","BUFFERSIZE=3"],
//   "workdir": "/todo",
//   "args": ["python","main.py"],
//   "checkpoint": false,
//   "lazypage": false
// };
  */
  console.log("Start service");
  console.log(req.body);
  console.log(req.body.checkpoint);
  serviceName = req.body.serviceName;

  if (req.body.checkpoint && !req.body.lazypage) {
    if (!serviceName) {
      res.send({
        status : 0,
        description : "service name must be specified"
      });
    }

    var cmd = "cd $HOME/containerroots/"+serviceName+"/image && runc restore -d "+serviceName
    extras.execute(cmd, function(stdout, error) {
      testConnection(req.body.ports[0],function(){
        console.log("Service started:"+serviceName);
        res.send({
          status : 1,
          serviceName : serviceName,
          description : "service started"
        });

      })
    })

  } else if (req.body.checkpoint && req.body.lazypage) {

    

  } else {

    serviceName = serviceName ? serviceName : "Sv"+new Date().getTime();

    var cmd = "/script/runContainer_Prepare.sh "+req.body.DockerImage+" "+serviceName;
    extras.execute(cmd, function(stdout, error) {
      extras.convertToJson("$HOME/containerroots/"+serviceName+"/image",req.body,function(){  
        cmd = "/script/runContainer.sh "+serviceName;

        extras.execute(cmd, function(stdout, error) {
          testConnection(req.body.ports[0],function(){
            console.log("Service started:"+serviceName);
            res.send({
              status : 1,
              serviceName : serviceName,
              description : "service started"
            });

          })
        })
      })

    });

  }

})

function testConnection(port,callback){
  setHostMovie = "http://"+myIp+":"+port+"/testconnection";

  request(setHostMovie, function (error, response, body) {
    console.log('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    console.log('body:', body); // Print the HTML for the Google homepage.
    if (body == undefined) {
      testConnection(port,callback);
      return;
    } else {
      callback();
    }
  });
}

function registerToServiceManager(){
  console.log("Register to:"+SMPath+"/MECregister")
  request.post("http://"+SMPath+"/MECregister", {
      json: {
        organization : org,
        port : externalPort
      }
    }, (error, res, body) => {
      if (error) {
        console.log("Fail to register MEC");
        throw new Error("Fail to register MEC");
        return;
      }

      // gobetween = body.gobetween;
      // myIp = body.ip;

      console.log("Register information");
    })
}

http.createServer(app).listen(port, function () {
  console.log('MEC app listening on port' + port);
  registerToServiceManager();
});
// data = {
//   "DockerImage" : "levanthanh3005/nodecasting:countdown",
//   "serviceName" : "nodecasting",
//   "ports" : ["5000:5000"],
//   "env" : ["RATIO=0.3","VIDEO_PATH=","MODE=SERVER","INTERNALPORT=5000","BUFFERSIZE=3"],
//   "workdir": "/todo",
//   "args": ["python","main.py"],
//   "checkpoint": true,
//   "predump": true
// };
// extras.convertToJson("config",data,function(){
//   console.log("Done")
// })