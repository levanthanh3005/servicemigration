const express = require('express');
const extras = require('./extras');

const bodyParser = require('body-parser');
const request = require('request');

var port = process.env.PORT || 3000;

var externalPort = process.env.EXTERNALPORT || 3000;

var gobetween = process.env.GOBETWEEN;

var proxyPort = process.env.PROXYPORT;

const app = express()
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({ extended: true }));

var lsMEC = [];

app.get('/', function (req, res) {
  // res.render('index');
  res.redirect("/index");
})

app.get('/index', function (req, res) {
  //docker-machine ssh swarm-00 "docker stack ls"
  var machinename = "LOCAL";

  // console.log(lsMEC);

  var render = function(){
    res.render('machine', {
      lsMEC : lsMEC
    });
  }

  render();
})

app.post('/start', function (req, res) {
  // MECIndex: MECIndex,
  // service : content
  console.log(req.body);
  var MECIndex = parseInt(req.body.MECIndex);

  request.post('http://'+lsMEC[MECIndex].ip+':'+lsMEC[MECIndex].port+'/start', {
    json: req.body.service
  }, (error, respost, body) => {
      if (body.status == 1) {
        console.log("Start service");
        if (!lsMEC[MECIndex].lsService) {
          lsMEC[MECIndex].lsService = [];
        }
        lsMEC[MECIndex].lsService.push(req.body.service);
      }
      res.send(body);
  })

})

app.get('/getContainers', function (req, res) {
  // res.render('index');
  // console.log("getContainers");
  function retrieveContainerData(index){
    if (index >= lsMEC.length) {
      res.send(lsMEC);
      return;
    }

    request.get('http://'+lsMEC[index].ip+':'+lsMEC[index].port+'/getContainers', 
      function(err,httpResponse,body){
        // console.log(body);
        if (err){
          console.log("Error at:"+lsMEC[index].ip);
          lsMEC.splice(index, 1);
          retrieveContainerData(index);
          return;
        }

        lsMEC[index].lsService = JSON.parse(body);
        retrieveContainerData(index+1)
      })

    // request.get('http://'+lsMEC[index].ip+':'+lsMEC[index].port+'/getContainers', 
    //   function(err,httpResponse,body){
    //     // console.log(body);
    //     if (err){
    //       console.log("Error at:"+lsMEC[index].ip);
    //       lsMEC.splice(index, 1);
    //       retrieveContainerData(index);
    //       return;
    //     }

    //     lsMEC[index].lsService = JSON.parse(body);
    //     retrieveContainerData(index+1)
    //   })
  }
  retrieveContainerData(0);
})

app.post('/stop', function (req, res) {
  // MECIndex: MECIndex,
  // serviceIndex : serviceIndex
  console.log(req.body);
  var MECIndex = parseInt(req.body.MECIndex);
  var serviceIndex = parseInt(req.body.serviceIndex);


  request.post('http://'+lsMEC[MECIndex].ip+':'+lsMEC[MECIndex].port+'/stop', {
    json: {
      serviceName : lsMEC[MECIndex].lsService[serviceIndex].serviceName
    }
  }, (error, respost, body) => {
      if (body.status == 1) {
        console.log("Stop service");
        lsMEC[MECIndex].lsService.splice(serviceIndex, 1);
      }
      res.send(body);
  })

})

app.post('/MECregister', function (req, res) {
  var addr = req.connection.remoteAddress;
  addr = addr.split(":").pop();

  if (addr == "127.0.0.1" || addr == "0.0.0.0" || addr == "172.17.0.1") {
    addr = process.env.MYREALIP;
  }

  var node = {
    ip : addr,
    port : req.body.port,
    organization : req.body.org
  }
  lsMEC.push(node);
  res.send({
    status : 1,
    description : "uploaded"
    // gobetween : gobetween,
    // ip : addr
  })
  // console.log(req.connection);
  console.log("New node:"+addr);
})

app.post('/migration', function (req, res) {
  // serviceIndex: serviceIndex,
  // originalMECIndex : originalMECIndex,
  // newMECIndex
  console.log(req.body);

  serviceIndex = parseInt(req.body.serviceIndex);
  originalMECIndex = parseInt(req.body.originalMECIndex);
  newMECIndex = parseInt(req.body.newMECIndex);

  var lsEnv = lsMEC[originalMECIndex].lsService[serviceIndex].env;
  var pauseLink = "";
  for (e in lsEnv) {
    if (lsEnv[e].split("=")[0] == "PAUSE") {
      pauseLink = 'http://'+lsMEC[originalMECIndex].ip+':'+lsEnv[e].split("=")[1];
      break;
    }
  }

  var pauseRunningService = function(){
    request.get(pauseLink, 
      function(err,httpResponse,body){
        console.log("Stop current service:"+pauseLink);
        setTimeout(function(){//<======FIX IT
          startMigration();
        }, 1000); 
        // startMigration();
      })
  }

  var startMigration = function(){     
    request.post('http://'+lsMEC[originalMECIndex].ip+':'+lsMEC[originalMECIndex].port+'/migration', {
        json: {
          serviceName : lsMEC[originalMECIndex].lsService[serviceIndex].serviceName,
          pathPost : 'http://'+lsMEC[newMECIndex].ip+':'+lsMEC[newMECIndex].port+'/uploadcheckpoint'
        }
      }, (error, res, body) => {
          console.log("Copy done");
          console.log(body);
          var data = lsMEC[originalMECIndex].lsService[serviceIndex];
          data.checkpoint = body.checkpoint;
          request.post('http://'+lsMEC[newMECIndex].ip+':'+lsMEC[newMECIndex].port+'/start', {
            json: data
          }, (error, res, body) => {

            if (body  && body.status == 1) {

              doneMigration();
            } else {
              console.log("Error");
            }
            
          })

      })
  }

  var doneMigration = function() {
    if (!lsMEC[newMECIndex].lsService) {
      lsMEC[newMECIndex].lsService = [];
    }

    lsMEC[newMECIndex].lsService.push(lsMEC[originalMECIndex].lsService[serviceIndex]);

    lsMEC[originalMECIndex].lsService.splice(serviceIndex, 1);

    res.send({
      status : 1,
      description : "migrated"
    })
  }

  if (pauseLink) {
    pauseRunningService();
  } else {
    startMigration();
  }

})

app.get('/test', function (req, res) {
  request.post('http://localhost:3000/MECregister', {
    json: {
      organization : "org1"
    }
  }, (error, res, body) => {

  })
})

app.get('/test2', function (req, res) {
  lsMEC = [];
  for (var e=3;e<5;e++) {
    lsMEC.push({
      ip : "192.168.0."+e,
      port : 3000,
      org : "ORG"+e,
      lsService : [{
        DockerImage : "DockerImage-1-"+e,
        env : [{name : "name1", value: "value1"}],
        ports : [{pC : "3000", pH : "3000"}],
        network : "network",
        serviceName : "SN-1"+e
      },{
        DockerImage : "DockerImage-2-"+e,
        env : [{name : "name1", value: "value1"}],
        ports : [{pC : "3000", pH : "3000"}],
        network : "network",
        serviceName : "SN-2"+e
      }]
    });
  }

  res.redirect("/index");

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

app.get('/reboot/:MECIndex', function (req, res) {
  //localhost:3000/setNote/Italy

  MECIndex = parseInt(req.params.MECIndex);

  if (MECIndex == -1) {
    var cmd = "sudo reboot";
    console.log(cmd);
    extras.execute(cmd, function(stdout) {
      console.log(stdout);
      console.log("Reboot");
    });
  } else {

    request.get('http://'+lsMEC[MECIndex].ip+':'+lsMEC[MECIndex].port+'/reboot', 
      function(err,httpResponse,body){
        console.log("Reboot machine:"+lsMEC[MECIndex].ip);
      })
  }
})

var proxyServicePort = {};

app.post('/assignProxy', function(req,res){

  if (!gobetween) {
    res.send({
      status : 0,
      description : "no gobetween"
    })
    return;
  }

  var serviceInfo = req.body.serviceInfo;
  var machineIp = req.connection.remoteAddress;
  machineIp = machineIp.split(":").pop();


  var externalPort = "";
  for(e in serviceInfo.env) {
    if (serviceInfo.env[e].split("=")[0] == "EXTERNALPORT") {
      externalPort = serviceInfo.env[e].split("=")[1]
    }
  }
  if (!externalPort) {
    res.send({
      status : 0,
      description : "no external Port of service"
    })
    return;
  }

  var choosePort = proxyPort;
  if (proxyServicePort[serviceInfo.serviceName]){
    choosePort = proxyServicePort[serviceInfo.serviceName];
  }

  console.log("Assign to Proxy")
  request.delete("http://"+gobetween+"/servers/"+serviceInfo.serviceName, function(){
    
    request.post("http://"+gobetween+"/servers/"+serviceInfo.serviceName, {
        json: {
            "max_connections": 0,
            "client_idle_timeout": "0",
            "backend_idle_timeout": "0",
            "backend_connection_timeout": "0",
            "bind": "0.0.0.0:"+choosePort,
            "protocol": "tcp",
            "balance": "weight",
            "sni": null,
            "tls": null,
            "backends_tls": null,
            "udp": null,
            "access": null,
            "proxy_protocol": null,
            "discovery": {
                "kind": "static",
                "failpolicy": "keeplast",
                "interval": "0",
                "timeout": "0",
                "static_list": [
                    machineIp+":"+externalPort+" weight=40 priority=1"
                ]
            },
            "healthcheck": {
                "kind": "none",
                "interval": "0",
                "passes": 1,
                "fails": 1,
                "timeout": "0"
            }
        }
      }, (error, result, body) => {
        if (error) {
          console.log("Error in assigning proxy");
          res.send({
            status : 0,
            description : "Error in assigning proxy"
          })
          return;
        }

        res.send({
          status : 1,
          description : "Assigned port",
          port : choosePort
        })

        console.log(body);
        console.log("Done with proxy");

        if (choosePort == proxyPort) {
          proxyPort++;
        }
        proxyServicePort[serviceInfo.serviceName] = choosePort;
      })
  })
})


app.listen(port, function () {
  console.log('Service Manger app listening on port' + port);
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