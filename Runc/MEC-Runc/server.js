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
  
lsService = {};
// data = {
//   "DockerImage" : "levanthanh3005/nodecasting:countdown",
//   "serviceName" : "nodecasting",
//   "ports" : [5000],
//   "env" : ["RATIO=0.3","VIDEO_PATH=","MODE=SERVER","INTERNALPORT=5000","BUFFERSIZE=3"],
//   "workdir": "/todo",
//   "args": ["python","main.py"],
//   "migration": {
//      "pause": "5000/pause",
//      "resume": "5000/resume",
//      "checkpoint": true,
//      "lazypage": 172.17.0.3,
//      "predump": true
//    }
// };
  
  console.log("Start service");
  console.log(req.body);
  console.log(req.body.migration.checkpoint);
  serviceName = req.body.migration.serviceName;

  if (!serviceName) {
      res.send({
        status : 0,
        description : "service name must be specified"
      });
  }

  if (req.body.migration.checkpoint && !req.body.migration.lazypage) {

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

  } else if (req.body.migration.checkpoint && req.body.migration.lazypage && req.body.migration.predump) {
    var cmd = "/script/lazyPageRestore.sh "+serviceName+" "+req.body.migration.resume+" "+req.body.migration.lazypage;
    // ./lazyPageRestore.sh videoserver 5000/resume 172.17.0.3
    extras.execute(cmd, function(stdout, error) {
      testConnection(req.body.ports[0],function(){
        console.log("Service retored:"+serviceName);
        res.send({
          status : 1,
          serviceName : serviceName,
          description : "service retored"
        });
      })
    })
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

app.post('/stop', function (req, res) {
  
  /*
    Post {
      serviceName : <serviceName>
    }
  */

  console.log(req.body);
  var serviceName = req.body.serviceName;

  var cmd = "./script/cleanContainer.sh "+serviceName;

  console.log("Run:"+cmd);

  extras.execute(cmd, function(stdout) {
    res.send({
      serviceName: serviceName,
      status : 1,
      description: "container stop"
    });   
  })
})

function postCommitFile(checkpoint, callback){
  var filename = "/tmp/"+checkpoint+".tar.gz";

  var rs = fs.createReadStream(filename);
  var ws = request.post(pathPost+"/"+checkpoint);

  ws.on('drain', function () {
    console.log('drain', new Date());
    rs.resume();
  });

  rs.on('end', function () {
    console.log('uploaded to ' + pathPost);
    callback({
      status : 1,
      serviceName : serviceName,
      fileName : checkpoint
    });
  });

  ws.on('error', function (err) {
    console.error('cannot send file to ' + pathPost + ': ' + err);
    callback({
      status : 0,
      description : err
    });  
  });

  rs.pipe(ws);
}

function askNeighbourToPrepare(migrationControlPath, serviceName, callback) {
  request.post(migrationControlPath, {
    json: {
      cmd : "SERVICEPREPARING",
      config : lsService[serviceName]
    }
  }, (error, res, body) => {
    callback();
  })
}

function askNeighbourToUnzipPredump(migrationControlPath, serviceName, filename, callback) {
  request.post(migrationControlPath, {
    json: {
      cmd : "UNZIPPREDUMP",
      config : lsService[serviceName],
      filename : filename
    }
  }, (error, res, body) => {
    callback();
  })
}

app.post('/migrationcontrol', function (req, res) {
  if (req.body.cmd == "SERVICEPREPARING") {
    var cmd = "/script/runContainer_Prepare.sh "+req.body.config.DockerImage+" "+req.body.config.serviceName;
    extras.execute(cmd, function(stdout, error) {
      console.log("Done preparing service:"+req.body.config.serviceName)
    });
  } else if (req.body.cmd == "UNZIPPREDUMP") {
    var cmd = "/script/unzip_predump.sh "+req.body.config.serviceName+" "+req.body.filename;
    extras.execute(cmd, function(stdout, error) {
      console.log("Done unzip predump:"+req.body.config.serviceName+" "+req.body.filename);
    });
  } else if (req.body.cmd == "LAZYPAGERETORE") {
    var cmd = "/script/lazyPageRestore.sh "+req.body.config.serviceName+" "+req.body.+" "+req.body.config.migration.resume+" "+req.body.newIp;
    // ./lazyPageRestore.sh videoserver 5000/resume 172.17.0.3
    extras.execute(cmd, function(stdout, error) {
      console.log("Done restore "+req.body.config.serviceName);
    });
  }
})

app.post('/predump', function (req, res) {
  
  /*
    Post {
      serviceName : <serviceName>,
      newIP : <newIP>,
      pathPost : <pathPost the zip file>,
      migrationControlPath : <path>
    }
  */

  console.log(req.body);
  var serviceName = req.body.serviceName;
  var newIP = req.body.newIP;
  var pathPost = req.body.pathPost;

  var predump = "predump_" + new Date().getTime();

  cmd = "/script/predumpCheckPoint.sh "+serviceName;
//     cmd = "docker checkpoint create --leave-running --checkpoint-dir /tmp "+serviceName+" "+checkpoint;
  extras.execute(cmd, function(stdout,error) {
    console.log("predump for "+serviceName); 

    if (error !== null) {
      res.send({
        status : 0,
        description : error
      });  
      return;
    }
    postCommitFile(predump,function(result){
      res.send(result);
    });

  })
})

app.post('/lazymigration', function (req, res) {
  
  /*
    Post {
      serviceName : <serviceName>,
      newIP : <newIP>,
      pathPost : <pathPost the zip file>,
      migrationControlPath : <path>
    }
  */

  console.log(req.body);
  var serviceName = req.body.serviceName;
  var newIP = req.body.newIP;
  var pathPost = req.body.pathPost;

  var checkpoint = "cp" + new Date().getTime();


  var makeCheckpoint = function(callback) {
    cmd = "docker checkpoint create --checkpoint-dir /tmp "+serviceName+" "+checkpoint;
//     cmd = "docker checkpoint create --leave-running --checkpoint-dir /tmp "+serviceName+" "+checkpoint;
    extras.execute(cmd, function(stdout,error) {
      console.log("checkpoint "+checkpoint); 

      if (error !== null) {
        res.send({
          status : 0,
          description : error
        });  
        return;
      }

      callback(checkpoint);

    })
  }

  makeCheckpoint(function(checkpoint){
    postCommitFile(checkpoint,function(){
      request.post(req.body.migrationControlPath, {
        json: {
          cmd : "LAZYPAGERETORE",
          config : lsService[serviceName],
          filename : checkpoint,
          newIP: req.body.newIP
        }
      }, (error, respost, body) => {
        res.send({
          status : 1,
          description : "ask neighbour to migrate "
        }); 
      })
    });
  });
})

app.post('/uploadcheckpoint/:checkpoint', function (req, res) {
  var checkpoint = path.basename(req.params.checkpoint);
  //Ref: https://gist.github.com/alepez/9205394
  filename = path.resolve(__dirname, "/tmp/"+checkpoint+".tar.gz");

  var dst = fs.createWriteStream(filename);
  req.pipe(dst);
  dst.on('drain', function() {
    console.log('drain', new Date());
    req.resume();
  });
  req.on('end', function () {
    console.log("Received a file in "+filename);
    res.sendStatus(200);
  });
});

app.get('/getContainers', function (req, res) {
  getRunningContainers(function(containers){
    res.send(containers);
  })
})


function getRunningContainers(callback){
  var containers = [];

  var cmd = "runc list";
  extras.execute(cmd, function(stdout) {
    data = extras.splitString(stdout);
    var containers = extras.parseContainers(data.fullData);
    // console.log(runningContainers);
    callback(containers)
  }, false, true);

}


app.get('/cleanall', function (req, res) {
  //localhost:3000/setNote/Italy
  res.send("Not support yet")
})

app.get('/reboot', function (req, res) {
  //localhost:3000/setNote/Italy
  var cmd = "sudo reboot";
  console.log(cmd);
  extras.execute(cmd, function(stdout) {
    console.log(stdout);
    console.log("Reboot");
  });
})

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
