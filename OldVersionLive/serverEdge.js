const express = require('express');
const extras = require('./extras');

const bodyParser = require('body-parser');
const request = require('request');

const app = express()
app.use(bodyParser.json());

const composerLocalPath = "./DockerComposeList";
const composerMachinePath = "/home/docker/";
const composerFilePath = "DockerComposeList";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

var LinkList = {}
var port = process.env.PORT || 3006;
var nodeName = process.env.NODENAME || "ITALY";
var notePosition = "Controller in "+nodeName +" at port "+port;

var orchestrator = process.env.ORCHESTRATOR

var edgeIp = process.env.EDGEIP || "10.7.137.12";
var restIP = process.env.RESTIP || "10.7.137.12";
var cleanThreshold = process.env.CLEANTHRESHOLD || -1;
var neighbour = process.env.NEIGHBOUR || "";

var longtitue = process.env.LONGTITUTE
var latitute = process.env.LATITUTE
var mecprovider = process.env.MECPROVIDER
const thresholdDistance = 6;


const MECextras = require('./MECextras');

mecExtras = new MECextras("","")

app.get('/', function (req, res) {
  // res.render('index');
  res.redirect("/index");
})

app.post('/stopcontainer', function (req, res) {
  
  res.send("done");

  console.log(req.body);
  lsSV = req.body.services;
  var index = 0;
  
  stopSV = function() {
    if (index < lsSV.length && LinkList[lsSV[index]]!= undefined) {
      containername = LinkList[lsSV[index]].name;
      servicename =  LinkList[lsSV[index]].servicename;
      option = LinkList[lsSV[index]].option;

      var cmd = "docker container rm " +containername+" --force";
      console.log(cmd);
      extras.execute(cmd, function(stdout) {
        console.log(stdout);
        console.log("Finish stop_container "+containername);
        // logContainerState(servicename,option,"STOP","notes") ;
        // stopServiceInBd(servicename,option,function(){
          delete LinkList[lsSV[index]];
          index++;
          stopSV();
        // })
      });
    } else {
      console.log("stop done");
      if (cleanThreshold > -1) {
        checkDiskSpace(function(free,total,percent){
          if (percent >80) {
            var cmd = "docker system prune --all -f";
            extras.execute(cmd, function(stdout) {
              console.log(stdout);
              console.log("Clean system");
            });
          }
        });
      }
    }
  }
  var indexs = 0;
  askForStop = function() {
    if (LinkList[lsSV[indexs]] == undefined && indexs < lsSV.length) {
      indexs++;
      askForStop();
    } else 
    if (indexs < lsSV.length) {
      path = LinkList[lsSV[indexs]].originalPath+"stop";

      request(path, function (error, response, body) {
        console.log(body);
        console.log("Request stopping container "+path);
        indexs++;
        askForStop();
      });
    } else {
      setTimeout(function(){
        console.log("askForStop done");
        stopSV();
      }, 5000);
    }
  }
  askForStop();
})

app.post('/startcontainer/', function (req, res) {
  startService(req, res);
})


function startService(req, res) {
  var servicename = req.body.servicename
  var option = req.body.option
  var name = servicename +"_"+ new Date().getTime();
  var timeout;

   
  if (servicename == "video") {
    // imagename = "levanthanh3005/nodecasting:v0.1"
    imagename = req.body.path;
    //check image exist
    timespendPulling = 0;
    // pullImage(imagename, function(timespendPulling) {
    //   console.log("timespend for pulling:"+timespendPulling);
      // var timenow142 = new Date().getTime();
      // runContainer(req, res, servicename, imagename, name, function(){
      //   var timespendToStartContainer = new Date().getTime() - timenow142;
      //   console.log("For "+name+" timespend pull:"+timespendPulling+ " timespend start container:"+timespendToStartContainer);
      //   var logs = "{'pull':'"+timespendPulling+"' , 'start':'"+timespendToStartContainer+"'}"
      //   // logContainerState(servicename,option,"START",logs);
      // });
    // })
    //run container
    req.body = {
      "DockerImage" : imagename,
      "serviceName" : "nodecasting",
      "ports" : ["5000:5000"],
      "env" : ["PAUSE=5000/stop","EXTERNALPORT=5000"]
    }
    mecExtras.startService(req,function(results){
      // status : 1,
      // ip : myIp,
      // containerName : containerName,
      // description : "container started"

      data = "http://"+edgeIp+":5000/getCurrentString";
      console.log("send link:"+data);
      LinkList[data] = {
        name : "nodecasting",
        originalPath : "http://"+results.ip+":5000/",
        servicename : servicename,
        option: option
      };
      // res.status(200).send(data);
      try{
        res.setHeader("Content-Type", "text/plain");
        //res.set('Content-Type', 'text/plain');
        res.send(data);
        // response.end();
      }catch(e) {
        console.log("sth wrong");
      }


    })
  }
}
function runContainer(req, res, servicename, imagename, name, maincallback) {
  var option = req.body.option

  // var cmd = "docker run -i --rm --name "+name+" -p "+port+":5000 --network bridge --volume=\"$HOME/Documents:/home/Documents:rw\" nodecasting"
  var cmd = "docker run -i --rm --name "+name+" --network bridge -p 5000:5000 " + imagename;
  // var cmd = "docker run -i --rm --name "+name+" --network bridge -p 5000:5000 --volume=\"/tmp:/home/Documents:rw\" " + imagename;

  console.log(cmd);
  var timeout;

  extras.execute(cmd, function(stdout) {
    console.log("Finish start "+imagename);
    
    maxRq = 100;
    checkRequest = function(callback) {
      console.log("Check ip exist");
      if (maxRq == -1) {
        return;
      } else if (maxRq == 0) {
        console.log("Maybe it has problem");
        res.setHeader("Content-Type", "text/html");
        res.send("NONONONO");
      } else {
        var getIpCmd = "docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "+name;
        extras.execute(getIpCmd, function(stdout) 
        {
          myIp = stdout.trim();
          // myIp = serverIp;
          maxRq--;
          console.log("Get ip:"+myIp+" "+myIp.length);
          //setMovie file
          if (myIp.length == 0) {
            // setTimeout(function(){
            //   checkRequest();
            //   return;
            // },1000);
            callback();
            return;
          }
          setHostMovie = "http://"+myIp+":5000/setHost?filename="+option+".mp4";
          // setHostMovie = "http://localhost:"+port+"/setHost?"+option;
          console.log(setHostMovie);

          request(setHostMovie, function (error, response, body) {
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            console.log('body:', body); // Print the HTML for the Google homepage.
            if (body == undefined) {
              // setTimeout(function(){
              //   checkRequest();
              //   return;
              // },1000);
              callback();
              return;
            } else {

              data = "http://"+edgeIp+":5000/getCurrentString";
              console.log("send link:"+data);
              LinkList[data] = {
                name : name,
                originalPath : "http://"+myIp+":5000/",
                servicename : servicename,
                option: option
              };
              // res.status(200).send(data);
              try{
                res.setHeader("Content-Type", "text/plain");
                //res.set('Content-Type', 'text/plain');
                res.send(data);
                // response.end();
              }catch(e) {
                console.log("sth wrong");
              }
              maincallback();
              maxRq = -1;
              clearTimeout(timeout);
            }
          });
        });
      }
    }
    
    callRequest = function(){
      timeout = setTimeout(function(){
        checkRequest(callRequest);
      },1000);
    }
    checkRequest(callRequest);
  }, true);
};

function checkImageExits(imagename,callback) {
  var cmd = "docker inspect --type=image " + imagename;
  extras.execute(cmd, function(stdout) {
    // console.log(">"+stdout.trim()+"<");
    if (stdout.trim() == "[]") {
      callback(false);
    } else {
      callback(true);
    }
  });
}

function pullImage(imagename, callback) {
  var timenow = new Date().getTime();
  checkImageExits(imagename, function(isExisted) {
    if (isExisted) {
      var timespend =  new Date().getTime() - timenow;
      callback(timespend);
    } else {
      var cmd = "docker pull " + imagename;
      extras.execute(cmd, function(stdout) {
        console.log("Pulled");
        // console.log(stdout);
        var timespend =  new Date().getTime() - timenow;
        callback(timespend);
      });
    }
  });
};

app.get('/machine/:action/:object', function (req, res) {
  var action = req.params.action;
  var object = req.params.object;
  var afterAction = function() {
     res.redirect("/index");
  }
  console.log(">"+action+"<");
  if (action == "stop_container") {
    var cmd = "docker container rm " +object+" --force";
    console.log(cmd);
    extras.execute(cmd, function(stdout) {
      console.log(stdout);
      console.log("Finish stop_container "+object);
      afterAction();
    });
  }
})

app.get('/logs/:type/:name/:id', function (req, res) {
  name  = req.params.name;
  id  = req.params.id;
  type  = req.params.type;

  var cmd = "docker "+type+" logs --details "+id+"";
  console.log(cmd);
  extras.execute(cmd, function(stdout,error) {
    console.log(stdout);
    console.log(error);
    lsLine = stdout.split("\n");

    console.log("Finish get detail logs");
    res.render('showInfor', {
      title: name + "(" + "Local" + ")", 
      lsContent: lsLine,
      content: ""
    })
  });
})

getIP = function(name, callback){
  var getIpCmd = "docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "+name;
  extras.execute(getIpCmd, function(stdout) {
    myIp = stdout.trim();
    callback(myIp);
  })
}

app.get('/index', function (req, res) {
  //docker-machine ssh swarm-00 "docker stack ls"
  var machinename = "LOCAL";
  var runningContainers = [];
  var afterAction = function() {
    console.log("afterAction");
    notePosition = "Controller in "+nodeName +" at port "+port;
    notePosition+= "\n Latitute:"+latitute;
    notePosition+= "\n Longtitue:"+longtitue;
    notePosition+= "\n MECProvider:"+mecprovider;

    res.render('machine', {
      runningContainers : runningContainers,
      LinkList : LinkList,
      notePosition : notePosition
    });
  }
  var getRunningContainers = function(callback) {
    console.log("getContainers");
    var cmd = "docker container ls";
    extras.execute(cmd, function(stdout) {
      console.log(stdout);
      // console.log("Finish get list containers");
      data = extras.splitString(stdout);
      runningContainers = extras.parseContainers(data.fullData);
      console.log(runningContainers);
      var index = 0;
      reqIp = function() {
        if (index == runningContainers.length) {
          callback();
          return;
        }
        getIP(runningContainers[index].id,function(ip) {
          runningContainers[index].ip = ip;
          index++;
          reqIp();
        })
      }
      reqIp();
    });
  };

  //getRunningServices(getContainers(afterAction()));
  // getAvailableServices(getRunningServices(afterAction()));
    getRunningContainers(function(){
          afterAction();
    });
})

function logContainerState(servicename,account,state,notes){
  console.log("Log into db:"+servicename+ " "+ account+ " "+ state+ " "+ notes);
}

function checkDiskSpace(callback) {
  var disk = require('diskusage');

  // get disk usage. Takes mount point as first parameter
  disk.check('/', function(err, info) {
      console.log("Disk free:"+info.free);
      console.log("Disk Total:"+info.total);
      console.log("Disk free percent:"+info.free*100/info.total);
      callback(info.free, info.total, info.free*100/info.total);
  });
}

function createContainer(servicename, account, callback) {

  var name = servicename +"_"+ new Date().getTime();
  var imagename = stateMigrationList[servicename+"_"+account].image;
  var cmd = "docker create --name "+name+" --network bridge -p 5000:5000 " + imagename;

  extras.execute(cmd, function(stdout) {
    // console.log("Pulled");
    // console.log(stdout);
    var containerId = stdout.trim();
    stateMigrationList[servicename+"_"+account].containerId = containerId;
    stateMigrationList[servicename+"_"+account].containername = name;
    callback();
  });

};

var stateMigrationList = []

app.post('/migpayment', function (req, res) {
  
  res.send("done");

  console.log(req.body);
  lsSV = req.body.services;

  var servicename = req.body.servicename;
  var account = req.body.account;
  var image = req.body.image;

  stateMigrationList[servicename+"_"+account] = {
    servicename : servicename,
    account : account,
    image : image,
  }

  pullImage(image, function(timespendPulling) {
    stateMigrationList[servicename+"_"+account].pulling = true;
    console.log("timespend for pulling:"+timespendPulling);
    createContainer(servicename, account,function(){
      console.log("Done create container");
    })
  });

})

function angle(toNode, carVector) {
  roadVector = {
    x : toNode.latitute - latitute,
    y : toNode.longtitue - longtitue
  }
  numerator = (roadVector.x * carVector.x + roadVector.y*carVector.y);
  denominator = Math.sqrt(roadVector.x*roadVector.x + roadVector.y*roadVector.y) * Math.sqrt(carVector.x*carVector.x + carVector.y*carVector.y)
  return Math.acos(numerator / denominator); 
}

app.get('/cardirection/:x/:y', function (req, res) {
  // http://localhost:3005/cardirection/2/0
  FindNeighbour(function(listNeighbour){
    console.log("Find nearest neighbour:");
    // console.log(listNeighbour);
    sma = 360;
    chooseNeighbour = {}
    for (e in listNeighbour) {
      theta = angle(listNeighbour[e],{x: req.params.x, y:req.params.y});
      if (sma > theta) {
        chooseNeighbour = listNeighbour[e];
        sma = theta;
      }
    }
    console.log(sma * 180 / 3.14);
    if (sma * 180 / 3.14 < 30) {
      neighbour = chooseNeighbour.ip;
      res.setHeader("Content-Type", "text/plain");
      //res.set('Content-Type', 'text/plain');
      res.send(neighbour); 
    } else {
      neighbour = undefined;
      res.setHeader("Content-Type", "text/plain");
      //res.set('Content-Type', 'text/plain');
      res.send("No neighbour"); 
    }
  });
});


app.post('/gossip', function (req, res) {
  res.send("done");
  console.log("New neighbour");
  console.log(req.body);
  isExisted = false;
  for (e in listNeighbour) {
    if (listNeighbour[e].node == req.body.node) {
      listNeighbour[e] = req.body;
      isExisted = true;
    }
  }
  if (!isExisted) {
    listNeighbour.push(req.body);
  }
})

//REST CALLS
// function payService(servicename,account,callback){
//   if (restIP == undefined) {
//     callback(true, "levanthanh3005/nodecastingtimestamp:v0.1");
//     return;
//   }
//   // stateMigrationList[servicename+"_"+account] = {
//   //   servicename : servicename,
//   //   account : account,
//   //   image : image,
//   // }
//   if (stateMigrationList[servicename+"_"+account]) {
//     callback(true,stateMigrationList[servicename+"_"+account].image);
//     return;
//   }
//   var timenow = new Date().getTime();
//   request
//   .post('http://'+restIP+':3003/api/LogService', {
//     form:{
//       "$class": "org.container.LogService",
//       "node": "resource:org.container.Node#NODE_1",
//       "sv": "resource:org.container.Service#"+servicename.toUpperCase(),
//       "logType": "START_SERVICE",
//       "customer": "resource:org.container.Customer#"+account.toUpperCase()
//     }
//   },function(err,httpResponse,body){
//     // resbody = JSON.parse(body);
//     body = JSON.parse(body);
//     console.log(body.customer);
//     // console.log(resbody);
//     // console.log(resbody.status + " " + resbody.path + " " + resbody.status == 200);
//     if (body.error) {
//       callback(false,body);
//       return;
//     } else {
//       request
//       .get('http://'+restIP+':3003/api/Service/'+servicename.toUpperCase(),
//         function(err,httpResponse,body){
//           console.log("payService timespend: "+ (new Date().getTime() - timenow));
//           body = JSON.parse(body);
//           callback( true , body.imagelink);
//           return;
//       })
//     }
//   })
//   // .on('response', function(response) {
//   //   console.log(response) // 200
//   //   console.log(response.headers['content-type']) // 'image/png'
//   //   callback();
//   // })
// }

// function stopServiceInBd(servicename,account,callback){
//   // console.log("Log into db:"+servicename+ " "+ account+ " "+ state+ " "+ notes);
//   request
//   .post('http://'+restIP+':3003/api/LogService', {
//     form:{
//       "$class": "org.container.LogService",
//       "node": "resource:org.container.Node#NODE_1",
//       "sv": "resource:org.container.Service#"+servicename.toUpperCase(),
//       "logType": "STOP_SERVICE",
//       "customer": "resource:org.container.Customer#"+account.toUpperCase()
//     }
//   },function(err,httpResponse,body){
//     console.log("Done stop container");
//     callback();
//   })
// }

function CheckNodeExistInOrchestrator(callback){
  // console.log("Log into db:"+servicename+ " "+ account+ " "+ state+ " "+ notes);
  request
  .get('http://'+orchestrator+':3006/api/Node/'+nodeName,
    function(err,response){
      console.log("CheckNodeExist:"+nodeName);
      // console.log(response);
      body = JSON.parse(response.body);
      if (body["error"]) {
        callback(false, "");
      } else {
        callback(true, body);
      }
  })
}

function CheckNodeExist(callback){
  // console.log("Log into db:"+servicename+ " "+ account+ " "+ state+ " "+ notes);
  request
  .get('http://'+restIP+':3003/api/Node/'+nodeName,
    function(err,response){
      console.log("CheckNodeExist:"+nodeName);
      // console.log(response);
      body = JSON.parse(response.body);
      if (body["error"]) {
        callback(false, "");
      } else {
        callback(true, body);
      }
  })
}

function RegisterNodeInOrchestrator(callback){
  // console.log("Log into db:"+servicename+ " "+ account+ " "+ state+ " "+ notes);
  CheckNodeExistInOrchestrator(function(exist, response) {
    if (exist) {
      callback(true, response);
    } else {
      request
      .post('http://'+orchestrator+':3006/api/RegisterNode', {
        form:{
          "$class": "org.container.RegisterNode",
          "ni" : nodeName,
          "latitute": latitute,
          "longtitue": longtitue,
          "ip": edgeIp,
          "owner": "resource:org.container.MECProvider#"+mecprovider
        }
      },function(err,httpResponse,body){
        console.log("Done RegisterNodeInOrchestrator");
        callback(true, JSON.parse(body));
      })
    }
  })
}

//END REST CALLS


app.listen(port, function () {
    console.log('Example app listening on port' + port + ' in '+nodeName+'!');
    RegisterNodeInOrchestrator(function(check,body){
      console.log(check);
      console.log(body);
    })
});


//ClEAN:
//docker rm -v $(docker ps --filter status=exited -q 2>/dev/null) 2>/dev/null
//docker rmi $(docker images --filter dangling=true -q 2>/dev/null) 2>/dev/null
//docker rmi $(docker images -q)
//docker rm $(docker ps -a -q)
//docker volume rm $(docker volume ls  -q)
////////////////////NOTE
//PROXY
//sometimes, proxy can not accept the route, but please rerun stack create... again 
//to update the service, it will update the proxy, the problem come from when we ping
//proxy, but the container has not run yet, the proxy will not accept it, but after that
//we update it again, it will accept because the container exits
//PROMOTHEUS
//Some example are quite clear now, just an issue that if we would like to store any
//promotheous indices, please use: 
//REQUEST_LATENCY = Histogram('http_server_resp_time', 'Request latency',['app_name', 'method', 'endpoint', 'http_status'])
//#funciton name = real funcition - "bucket", for example: http_server_resp_time = http_server_resp_time_bucket - bucket 