const express = require('express');
const extras = require('../extras');

const bodyParser = require('body-parser');
const request = require('request');

var port = process.env.PORT || 3000;

const app = express()
app.use(bodyParser.json());

var MECIp = "find that";

app.use(bodyParser.urlencoded({ extended: true }));


app.post('/start', function (req, res) {
  
  /*
    Post {
      DockerImage : <DockerImage>,
      env : [{name :<>, value: <>}],
      ports : [{pC :<>, pH : <>}],
      network : network,
      serviceName : optional
      checkpoint : checkpoint name (in case of load)
    }
  */

  if (req.body.checkpoint) {
    startWithCheckpoint(req,res);
  } else {
    normalStart(req,"run",function(results){
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
          code : 0,
          description : error
        });  
        return;
      }
      var containerId = stdout.trim();

      callback(containerId);
    });
  }

  var extractCheckpoint = function(containerId, callback){
    var checkpoint = req.checkpoint;
    var cmd = "tar -xf file_name.tar -C /var/lib/docker/containers/"+containerId+"/checkpoints/";

    extras.execute(cmd, function(stdout, error) {
      if (error !== null) {
        res.send({
          code : 0,
          description : error
        });  
        return;
      }
      callback();
    });
  }

  normalStart(req,"create",function(){
    getContainerId(function(containerId){
      extractCheckpoint(function(){
        var cmd = "docker start --checkpoint="+req.body.checkpoint+" "+req.body.serviceName;
        extras.execute(cmd, function(stdout, error) {
          if (error !== null) {
            res.send({
              code : 0,
              description : error
            });  
            return;
          }

          res.send({
            code : 1,
            description : "Service "+req.body.serviceName+" start at "+req.body.checkpoint;
          });  

        });
      })
    })
  });

}

function normalStart(req, fn, startcallback) {
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
    ports+= " -p "+lsPorts[e].pC+":"+lsPorts[e].pH;
  }

  var cmd = "docker "+fn+" -i --rm --name "+serviceName+network+ports+" "+DockerImage+" "+command;

  console.log("Run:"+cmd);


  extras.execute(cmd, function(stdout) {
    maxRq = 100;
    checkRequest = function(rqcallback) {
      console.log("Check ip exist");
      if (maxRq == -1) {
        return;
      } else if (maxRq == 0) {
        // console.log("Maybe it has problem");
        startcallback({
          code : 0,
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
              code : 1,
              ip : myIp,
              description: "container started"
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
    }, true);
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
      code : 1,
      description: "container stop"
    });   
  })
})

app.post('/internalmigration', function (req, res) {
  
  /*
    Post {
      serviceName : <serviceName>,
      newIP : <newIP>
    }
  */

  console.log(req.body);
  var serviceName = req.body.serviceName;
  var newIP = req.body.newIP;

  var checkpoint = "cp" + new Date().getTime();


  var makeCheckpoint = function(callback) {
    cmd = "docker checkpoint create --checkpoint-dir /tmp "+serviceName+" "+checkpoint;

    extras.execute(cmd, function(stdout,error) {
      console.log("checkpoint "+checkpoint); 

      if (error !== null) {
        res.send({
          code : 0,
          description : error
        });  
        return;
      }

      callback(checkpoint);

    })
  }

  var zipCheckpoint = function(checkpoint){
    cmd = "tar -zcvf /tmp/"+checkpoint+".tar.gz /tmp/"+checkpoint;

    extras.execute(cmd, function(stdout,error) {
      console.log("zip checkpoint into file :"+checkpoint); 

      if (error !== null) {
        res.send({
          code : 0,
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
          code : 0,
          description : error
        });  
        return;
      }

      res.send({
        code : 1,
        fileName: fileName,
        serviceName : newServiceName
      });  
    })

  }

  makeCheckpoint(function(checkpoint){
    zipCheckpoint(function(checkpoint){
      sendCommitFile();
    })
  });
})

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
      DockerImage : "busyboxtest",
      serviceName : "looper"
    }
  }, (error, res, body) => {
    if (error) {
      console.error(error)
      return
    }
    console.log(`statusCode: ${res.statusCode}`)
    console.log(body)


    request.post('http://localhost:3000/internalmigration', {
      json: {
        serviceName : "looper",
        newIP : "vanle@10.7.20.89"
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

app.listen(port, function () {
  console.log('MEC app listening on port' + port);
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