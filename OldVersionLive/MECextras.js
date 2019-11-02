"use strict"; 
const extras = require('./extras');
const fs = require('fs');
const bodyParser = require('body-parser');
const request = require('request');
var path = require('path');

class MECextras {

	constructor(SMPath,org) {
		this.SMPath = SMPath;
		this.org = org;
	}

	startService(req,callback) {

// {
// 	"DockerImage" : "levanthanh3005/nodecasting:countdown",
// 	"serviceName" : "nodecasting",
// 	"ports" : ["5000:5000"],
// 	"env" : ["PAUSE=5000/pause","EXTERNALPORT=5000"]
// }

		console.log("Start service");
		console.log(req.body);
		console.log(req.body.checkpoint);

		if (req.body.checkpoint) {
			this.startWithCheckpoint(req,function(results){
			    // res.send(results);
			    // assignProxy(req.body);
			    callback(results);
			});
		} else {
			this.normalStart(req,function(results){
			    // res.send(results);
			    // assignProxy(req.body);
			    callback(results);
			}); 
		}
	}

	// assignProxy(serviceInfo) {
	//   request.post("http://"+SMPath+"/assignProxy", {
	//     json: {
	//         serviceInfo : serviceInfo
	//     }
	//   }, (error, res, body) => {
	//     if (error) {
	//       console.log("Error in assigning proxy");
	//       console.log(error);
	//       return;
	//     }
	//     console.log(body);
	//     console.log("Done with proxy")
	//   })
	// }

	startWithCheckpoint(req,startcallback) {
	  //Ref: https://www.criu.org/Docker
	  //docker create
	  //get container id
	  //unzip file from /tmp/checkpoint.tar.gz to 
	  //  /var/lib/docker/containers/<container-ID>/checkpoints/<checkpoint name>/
	  //docker start --checkpoint=<checkpoint name> container-name
	  console.log("Start with checkpoint");
	  var self = this;

	  var extractCheckpoint = function(containerId, callback){
	    var checkpoint = req.body.checkpoint;
	    var cmd = "tar xzvf /tmp/"+checkpoint+".tar.gz -C /dockercontainer/"+containerId+"/checkpoints/";
	    console.log("Run:"+cmd);
	    extras.execute(cmd, function(stdout, error) {
	      if (error !== null) {
	        startcallback({
	          status : 0,
	          description : error
	        });  
	        return;
	      }
	      callback();
	    });
	  }

	  self.normalCreate(req,function(results){
	    var containerId = results.containerId;
	    // getContainerId(function(containerId){
	      console.log("containerId:"+containerId);
	      extractCheckpoint(containerId,function(){
	        var cmd = "docker start --checkpoint="+req.body.checkpoint+" "+req.body.containerName;
	        console.log("Run:"+cmd)
	        extras.execute(cmd, function(stdout, error) {
	          if (error !== null) {
	            startcallback({
	              status : 0,
	              description : error
	            });  
	            return;
	          }

	          self.checkServiceIpExist(req.body.containerName,function(results){
	            startcallback(results);
	          })

	        });
	      })
	    // })
	  });

	}

	getContainerId(containerName, callback){
		var cmd = 'docker inspect --format="{{.Id}}" '+containerName;
		extras.execute(cmd, function(stdout, error) {
		  if (error !== null) {
		  	callback("")
		    return;
		  }
		  var containerId = stdout.trim();

		  callback(containerId);
		});
	}

	normalCreate(req, createcallback) {
	  //fn = undefine => docker run
	  //fn = "create" => create;
	  console.log(req.body);
	  var lsEnv = req.body.env;
	  var lsPorts = req.body.ports;
	  var containerName = req.body.containerName;
	  var network = req.body.network;
	  var command = req.body.command;
	  var DockerImage = req.body.DockerImage;




	  command = command ? command : "";

	  containerName = containerName ? containerName : new Date().getTime();

	  network = network ? " --network "+network : "";

	  var ports = "";
	  for (var e in lsPorts){
	    ports+= " -p "+lsPorts[e];
	  }

	  var envs = "";
	  for (var e in lsEnv){
	    ports+= " -e "+lsEnv[e];
	  }

	  var cmd = "docker create --name "+containerName+network+ports+envs+" "+DockerImage+" "+command;

	  console.log("Run:"+cmd);

	  getContainerId(containerName, function(containerId) {

	  	if (!containerId) {
		  extras.execute(cmd, function(stdout) {
		    var containerId = stdout.trim();
		    createcallback({
		      status : 1,
		      containerName : containerName,
		      containerId : containerId,
		      description : "container started"
		    }); 
		  })
		} else {
		    createcallback({
		      status : 1,
		      containerName : containerName,
		      containerId : containerId,
		      description : "container started"
		    }); 
		}
	  })
	}

	normalStart(req, startcallback) {
	  //fn = undefine => docker run
	  //fn = "create" => create;
	  console.log("Start as normal");
      console.log(req.body);
      var self = this;
	  var lsEnv = req.body.env;
	  var lsPorts = req.body.ports;
	  var containerName = req.body.containerName;
	  var network = req.body.network;
	  var command = req.body.command;
	  var DockerImage = req.body.DockerImage;


	  command = command ? command : "";

	  containerName = containerName ? containerName : new Date().getTime();

	  network = network ? " --network "+network : "";

	  var ports = "";
	  for (var e in lsPorts){
	    ports+= " -p "+lsPorts[e];
	  }

	  var envs = "";
	  for (var e in lsEnv){
	    ports+= " -e "+lsEnv[e];
	  }

	  var cmd = "docker run -i --rm --name "+containerName+network+ports+envs+" "+DockerImage+" "+command;

	  console.log("Run:"+cmd);


	  extras.execute(cmd, function(stdout) {
	      self.checkServiceIpExist(containerName,startcallback)
	  }, true);
	}

	checkServiceIpExist(containerName,startcallback){
	  var maxRq = 100;
	  var checkRequest = function(rqcallback) {
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
	      var getIpCmd = "docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "+containerName;
	      extras.execute(getIpCmd, function(stdout) {
	        var myIp = stdout.trim();
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
	            containerName : containerName,
	            description : "container started"
	          });          
	        }
	      });
	    }
	  }

	  var callRequest = function(){
	    setTimeout(function(){
	      checkRequest(callRequest);
	    },1000);
	  }
	  checkRequest(callRequest);
	}

	stopService(req,res) {
		console.log(req.body);
		var containerName = req.body.containerName;
		var containerId = req.body.containerId;

		var cmd = "docker container rm " +containerName+" --force";

		if (!containerName) {
		cmd = "docker container rm " +containerId+" --force";
		}
		console.log("Run:"+cmd);

		extras.execute(cmd, function(stdout) {
			res.send({
			  status : 1,
			  description: "container stop"
			});   
		})
	}

	migration(req, res) {
  
	  /*
	    Post {
	      containerName : <containerName>,
	      newIP : <newIP>,
	      pathPost : <pathPost the zip file>
	    }
	  */

	  console.log(req.body);
	  var containerName = req.body.containerName;
	  var newIP = req.body.newIP;
	  var pathPost = req.body.pathPost;

	  var checkpoint = "cp" + new Date().getTime();


	  var makeCheckpoint = function(callback) {
	    var cmd = "docker checkpoint create --checkpoint-dir /tmp "+containerName+" "+checkpoint;
	//     cmd = "docker checkpoint create --leave-running --checkpoint-dir /tmp "+containerName+" "+checkpoint;
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
	        containerName : newcontainerName
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
	        containerName : containerName,
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
	}

	uploadCheckpoint(req, res){
	  var checkpoint = path.basename(req.params.checkpoint);
	  //Ref: https://gist.github.com/alepez/9205394
	  var filename = path.resolve(__dirname, "/tmp/"+checkpoint+".tar.gz");

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
	}

	getContainers(req,res){
		getRunningContainers(function(containers){
			res.send(containers);
		})
	}

	getRunningContainers(callback){
	// registerToServiceManager();
	  var containers = [];
	  var getContainerCMD = function(callback) {
	    // console.log("getContainers");
	    var cmd = "docker container ls -a";
	    extras.execute(cmd, function(stdout) {
	      // console.log(stdout);
	      // console.log("Finish get list containers");
	      data = extras.splitString(stdout);
	      var runningContainers = extras.parseContainers(data.fullData);
	      // console.log(runningContainers);
	      callback(runningContainers)
	    }, false, true);
	  }
	  var sendLsContainers = function() {
	    // console.log(containers);
	    callback(containers);
	  }

	  var inspectEachContainer = function(index, runningContainers) {
	    if (index >= runningContainers.length) {
	      sendLsContainers();
	      return;
	    }
	    var cmd = "docker inspect "+runningContainers[index].id;
	    // console.log("Run:"+cmd);
	    extras.execute(cmd, function(stdout) {
	      // console.log(stdout);
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
	        "containerName" : inspectData["Name"].split("/").pop(),
	        "status" : inspectData["State"]["Status"]
	      });
	      inspectEachContainer(index+1, runningContainers);
	    }, false, true);
	  }

	  getContainerCMD(function(runningContainers){
	    inspectEachContainer(0,runningContainers);
	  });
	}

	registerToServiceManager(){
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
}

module.exports = MECextras;