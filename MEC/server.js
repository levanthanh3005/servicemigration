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


const app = express()
app.use(bodyParser.json());

var MECIp = "find that";

app.use(bodyParser.urlencoded({ extended: true }));


app.post('/start', function (req, res) {
  
  /*
    Post {
      DockerImage : <DockerImage>,
      env : [[,]],
      ports : [[,]],
      network : network,
      serviceName : optional
      checkpoint : checkpoint name (in case of load)
    }
  */
  console.log("Start service");
  console.log(req.body);

  if (req.body.checkpoint) {
    startWithCheckpoint(req,res);
  } else {
    normalStart(req,function(results){
        res.send(results);
    }); 
  }

})

function startWithCheckpoint(req,res) {
  //Ref: https://www.criu.org/Docker
  //docker create
  //get container id
  //unzip file from /tmp/checkpoint.tar.gz to 
  //  /var/lib/docker/containers/<container-ID>/checkpoints/<checkpoint name>/
  //docker start --checkpoint=<checkpoint name> container-name
  var getContainerId = function(callback){
    var cmd = 'docker inspect --format="{{.Id}}" '+req.body.serviceName;
    extras.execute(cmd, function(stdout, error) {
      if (error !== null) {
        res.send({
          status : 0,
          description : error
        });  
        return;
      }
      var containerId = stdout.trim();

      callback(containerId);
    });
  }

  var extractCheckpoint = function(containerId, callback){
    var checkpoint = req.body.checkpoint;
    var cmd = "tar xzvf /tmp/"+checkpoint+".tar.gz -C /dockercontainer/"+containerId+"/checkpoints/";

    extras.execute(cmd, function(stdout, error) {
      if (error !== null) {
        res.send({
          status : 0,
          description : error
        });  
        return;
      }
      callback();
    });
  }

  normalCreate(req,function(results){
    var containerId = results.containerId;
    // getContainerId(function(containerId){
      console.log("containerId:"+containerId);
      extractCheckpoint(containerId,function(){
        var cmd = "docker start --checkpoint="+req.body.checkpoint+" "+req.body.serviceName;
        console.log("Run:"+cmd)
        extras.execute(cmd, function(stdout, error) {
          if (error !== null) {
            res.send({
              status : 0,
              description : error
            });  
            return;
          }

          checkServiceIpExist(req.body.serviceName,function(results){
            res.send(results);
          })

        });
      })
    // })
  });

}

function normalCreate(req, startcallback) {
  //fn = undefine => docker run
  //fn = "create" => create;
  console.log(req.body);
  var lsEnv = req.body.env;
  var lsPorts = req.body.ports;
  var serviceName = req.body.serviceName;
  var network = req.body.network;
  var command = req.body.command;
  var DockerImage = req.body.DockerImage;


  command = command ? command : "";

  serviceName = serviceName ? serviceName : new Date().getTime();

  network = network ? " --network "+network : "";

  var ports = "";
  for (var e in lsPorts){
    ports+= " -p "+lsPorts[e];
  }

  var envs = "";
  for (var e in lsEnv){
    ports+= " -e "+lsEnv[e];
  }

  var cmd = "docker run -d --rm --name "+serviceName+network+ports+envs+" "+DockerImage+" "+command;

  console.log("Run:"+cmd);


  extras.execute(cmd, function(stdout) {
    var containerId = stdout.trim();
    startcallback({
      status : 1,
      serviceName : serviceName,
      containerId : containerId,
      description : "container started"
    }); 
  })
}


function normalStart(req, startcallback) {
  //fn = undefine => docker run
  //fn = "create" => create;
  console.log(req.body);
  var lsEnv = req.body.env;
  var lsPorts = req.body.ports;
  var serviceName = req.body.serviceName;
  var network = req.body.network;
  var command = req.body.command;
  var DockerImage = req.body.DockerImage;


  command = command ? command : "";

  serviceName = serviceName ? serviceName : new Date().getTime();

  network = network ? " --network "+network : "";

  var ports = "";
  for (var e in lsPorts){
    ports+= " -p "+lsPorts[e];
  }

  var envs = "";
  for (var e in lsEnv){
    ports+= " -e "+lsEnv[e];
  }

  var cmd = "docker run -d --rm --name "+serviceName+network+ports+envs+" "+DockerImage+" "+command;

  console.log("Run:"+cmd);


  extras.execute(cmd, function(stdout) {
      checkServiceIpExist(serviceName,startcallback)
  }, true);
}

function checkServiceIpExist(serviceName,startcallback){
  var maxRq = 100;
  checkRequest = function(rqcallback) {
    console.log("Check ip exist");
    if (maxRq == -1) {
      return;
    } else if (maxRq == 0) {
      // console.log("Maybe it has problem");
      startcallback({
        status : 0,
        description: "Try "+maxRq+" but not executed"
      });
    } else {
      var getIpCmd = "docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "+serviceName;
      extras.execute(getIpCmd, function(stdout) {
        myIp = stdout.trim();
        // myIp = serverIp;
        maxRq--;
        // console.log("Get ip:"+myIp+" "+myIp.length);
        //setMovie file
        if (myIp.length == 0) {
          rqcallback();
          return;
        } else {
          startcallback({
            status : 1,
            ip : myIp,
            serviceName : serviceName,
            description : "container started"
          });          
        }
      });
    }
  }

  callRequest = function(){
    timeout = setTimeout(function(){
      checkRequest(callRequest);
    },1000);
  }
  checkRequest(callRequest);
}

app.post('/stop', function (req, res) {
  
  /*
    Post {
      serviceName : <serviceName>
      containerId : <containerId>
    }
  */

  console.log(req.body);
  var serviceName = req.body.serviceName;
  var containerId = req.body.containerId;

  var cmd = "docker container rm " +serviceName+" --force";

  if (!serviceName) {
    cmd = "docker container rm " +containerId+" --force";
  }
  console.log("Run:"+cmd);

  extras.execute(cmd, function(stdout) {
    res.send({
      status : 1,
      description: "container stop"
    });   
  })
})

app.post('/migration', function (req, res) {
  
  /*
    Post {
      serviceName : <serviceName>,
      newIP : <newIP>,
      pathPost : <pathPost the zip file>
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

  var zipCheckpoint = function(checkpoint, callback){
    // cmd = "cd /tmp & tar -zcvf "+checkpoint+".tar.gz -P "+checkpoint;
    var cmd ="cd /tmp/ && tar -zcvf "+checkpoint+".tar.gz "+checkpoint;
    console.log("RUN:"+cmd);
    extras.execute(cmd, function(stdout,error) {
      console.log("zip checkpoint into file :"+checkpoint); 

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

  var sendCommitFile = function(checkpoint){
    var cmd = "scp /tmp/"+checkpoint+".tar.gz "+newIP+":/tmp";
    extras.execute(cmd, function(stdout,error) {
      console.log("copy to "+newIP); 

      if (error !== null) {
        res.send({
          status : 0,
          description : error
        });  
        return;
      }

      res.send({
        status : 1,
        fileName: fileName,
        serviceName : newServiceName
      });  
    })

  }

  var postCommitFile = function(checkpoint){
    var filename = "/tmp/"+checkpoint+".tar.gz";

    var rs = fs.createReadStream(filename);
    var ws = request.post(pathPost+"/"+checkpoint);

    ws.on('drain', function () {
      console.log('drain', new Date());
      rs.resume();
    });

    rs.on('end', function () {
      console.log('uploaded to ' + pathPost);
      res.send({
        status : 1,
        serviceName : serviceName,
        checkpoint : checkpoint
      });   
    });

    ws.on('error', function (err) {
      console.error('cannot send file to ' + pathPost + ': ' + err);
      res.send({
        status : 0,
        description : err
      });  
    });

    rs.pipe(ws);
  }

  makeCheckpoint(function(checkpoint){
    zipCheckpoint(checkpoint,function(checkpoint){
      if (newIP){
        sendCommitFile();
      } else {
        postCommitFile(checkpoint);
      }
    })
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
// registerToServiceManager();
  var containers = [];
  var getContainerCMD = function(callback) {
    // console.log("getContainers");
    var cmd = "docker container ls";
    extras.execute(cmd, function(stdout) {
      // console.log(stdout);
      // console.log("Finish get list containers");
      data = extras.splitString(stdout);
      var runningContainers = extras.parseContainers(data.fullData);
      // console.log(runningContainers);
      callback(runningContainers)
    });
  }
  var sendLsContainers = function() {
    console.log(containers);
    callback(containers);
  }

  var inspectEachContainer = function(index, runningContainers) {
    if (index >= runningContainers.length) {
      sendLsContainers();
      return;
    }
    var cmd = "docker inspect "+runningContainers[index].id;
    console.log("Run:"+cmd);
    extras.execute(cmd, function(stdout) {
      console.log(stdout);
      var inspectData = JSON.parse(stdout)[0];
      var lsPortData = inspectData["NetworkSettings"]["Ports"];
      var lsPorts = [];
      for (var p in lsPortData) {
        lsPorts.push(lsPortData[p][0]["HostPort"]+":"+p.split("/")[0]);
      }
      containers.push({
        "DockerImage" : inspectData["Config"]["Image"],
        "env" : inspectData["Config"]["Env"],
        "ports" : lsPorts,
        "containerId" : inspectData["Config"]["Hostname"],
        "fullId" : inspectData["Id"],
        "serviceName" : inspectData["Name"].split("/").pop()
      });
      inspectEachContainer(index+1, runningContainers);
    });
  }

  getContainerCMD(function(runningContainers){
    inspectEachContainer(0,runningContainers);
  });
}


app.get('/cleanall', function (req, res) {
  //localhost:3000/setNote/Italy
  var cmd = "docker rm $(docker container ls -aq) -f";
  console.log(cmd);
  extras.execute(cmd, function(stdout) {
    console.log(stdout);
    console.log("Finish stop_container");
    // logContainerState(servicename,option,"STOP","notes") ;
    cmd = "docker system prune --all --force --volumes"
    extras.execute(cmd, function(stdout) {
      console.log(stdout);
      console.log("Finish clean");
    });
  });
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

app.get('/test', function (req, res) {
  res.send("done");
  request.post('http://localhost:3000/start', {
    json: {
      DockerImage : "levanthanh3005/busyboxtest",
      serviceName : "looper"
    }
  }, (error, res, body) => {
    if (error) {
      console.error(error)
      return
    }
    console.log(`statusCode: ${res.statusCode}`)
    console.log(body)


    request.post('http://localhost:3000/migration', {
      json: {
        serviceName : "looper",
        pathPost : "http://10.7.136.107:3000/uploadcheckpoint"
      }
    }, (error, res, body) => {
        console.log("After copy");
        console.log(body);
        // request.post('http://10.7.20.89:3005/start', {
        //   json: {
        //     DockerImage : body.serviceName,
        //     serviceName : "looper",
        //     fileName : body.fileName
        //   }
        // }, (error, res, body) => {

          
          
        // })

    })


  })
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
      console.log("Register information")
    })
}

http.createServer(app).listen(port, function () {
  console.log('MEC app listening on port' + port);
  registerToServiceManager();
});
