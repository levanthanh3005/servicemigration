const express = require('express');
const extras = require('./extras');

const bodyParser = require('body-parser');
const request = require('request');

const app = express()
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// var restIP = process.env.RESTIP || "10.7.137.12";

var port = process.env.PORT || 3006;

listNode = []

function distance(lat1, lon1, lat2, lon2) {
    // console.log(lat1 +" "+lon1+" "+lat2+" "+lon2);
    // var x = (lat1 - lat2)*(lat1 - lat2) + (lon1 - lon2)*(lon1 - lon2);
    // console.log(">>>>"+x);
    return Math.sqrt((lat1 - lat2)*(lat1 - lat2) + (lon1 - lon2)*(lon1 - lon2));
}

app.get('/api/Node/:nodeName', function (req, res) {
  var nodeName = req.params.nodeName;
  if (listNode[nodeName]) {
    res.send(listNode[nodeName]);
  } else {
    res.send({
      error : "Node is not existed"
    });
  }
})

app.post('/api/RegisterNode', function (req, res) {
  console.log("RegisterNode");

  nodeName = req.body.ni;
  longtitue = req.body.longtitue;
  latitute = req.body.latitute;
  serverIp = req.body.ip;
  mecprovider = req.body.owner;

  RegisterNodeInBc(nodeName,latitute, longtitue, serverIp, mecprovider, function(check,body){
    if (!check) {
      res.send({
        error : body
      });
      console.log("Can not RegisterNodeInBc")
      return;
    }
    console.log("Done register in bc")
    console.log(req.body);
    node = req.body;
    if (listNode[node.ni]) {
      res.send({
        error : "node is existed"
      });
      return;
    }
    listNode[node.ni] = node;
    res.send({
        status : "done"
    });
    console.log("List of node");
    console.log(listNode);
  });
})

function angle(fromNode, toNode, carVector) {
  roadVector = {
    x : toNode.latitute - fromNode.latitute,
    y : toNode.longtitue - fromNode.longtitue
  }
  numerator = (roadVector.x * carVector.x + roadVector.y*carVector.y);
  denominator = Math.sqrt(roadVector.x*roadVector.x + roadVector.y*roadVector.y) * Math.sqrt(carVector.x*carVector.x + carVector.y*carVector.y)
  return Math.acos(numerator / denominator); 
}

function findNearestNeighbour(nodeName, thresholdDistance, x, y) {
  /*
    [ NODE_1: { '$class': 'org.container.RegisterNode',
    ni: 'NODE_1',
    latitute: '100',
    longtitue: '100',
    ip: '10.7.20.89',
    owner: 'resource:org.container.MECProvider#MECPROVIDER_1' },
  NODE_2: { '$class': 'org.container.RegisterNode',
    ni: 'NODE_2',
    latitute: '100',
    longtitue: '105',
    ip: '10.7.20.104',
    owner: 'resource:org.container.MECProvider#MECPROVIDER_1' } ]
    
    x,y = (100,100) (105,100) (lattitute, longtiute)
  */
  if (listNode[nodeName] == undefined) {
    return {
      error : "node is not existed"     
    };
  }
  lsRs = [];
  sma = 100000;
  chooseNeighbour = [];
  for (e in listNode) {
    if (e!=nodeName) {
      d = distance(listNode[e].latitute,listNode[e].longtitue,listNode[nodeName].latitute,listNode[nodeName].longtitue);
      if (d <= thresholdDistance) {
        theta = angle(listNode[nodeName],listNode[e],{x: x, y:y});
        if (sma > theta) {
          chooseNeighbour = listNode[e];
          sma = theta;
        }
      }
    }
  }
  console.log("sma:"+sma +"  "+ (sma * 180 / 3.14));
  console.log(chooseNeighbour);
  if (sma * 180 / 3.14 > 30) {
    chooseNeighbour = []
  }
  return chooseNeighbour;
}

function getNearestNode(posx,posy) {
  node = {}
  dist = 10000
  for (e in listNode) {
    d = distance(posx, posy, listNode[e].latitute, listNode[e].longtitue);
    if (dist > d) {
      dist = d;
      node = listNode[e];
    }
  }
  return node;
}

app.post('/carservice/:posx/:posy/stopcontainer', function (req, res) {
  node = getNearestNode(req.params.posx, req.params.posy)
  console.log("Request Stop container");
  //{ services: [ 'http://10.10.168.10:5000/getCurrentString' ] }
  console.log(req.body);
  request
  .post("http://"+node.ip+":3005/stopcontainer", {
    form:{
      services: req.body.services
    }
  },function(err,httpResponse,body){
    res.setHeader("Content-Type", "text/plain");
    res.send(body);
  });
})

// app.get('/carservice/:posx/:posy/startcontainer/:servicename/:option', function (req, res) {  
//   //http://10.7.20.89:3006/carservice/101/100/startcontainer/video/customer_1
//   node = getNearestNode(req.params.posx, req.params.posy)
//   console.log("Request to start container, forward request to:"+node.ip);
//   request("http://"+node.ip+":3005/startcontainer/"
//     +req.params.servicename+"/"+req.params.option, 
//       function (error, response, body) {
//         res.setHeader("Content-Type", "text/plain");
//         res.send(body);
//   });
// })
lsSV = [];

app.get('/carservice/:posx/:posy/startcontainer/:servicename/:option/:x/:y', function (req, res) {
  //http://10.7.20.89:3006/carservice/105/100/startcontainer/video/customer_1/2/0
  //http://localhost:3006/carservice/100/100/startcontainer/video/customer_1/2/0

  node = getNearestNode(req.params.posx, req.params.posy)
  console.log("Request to start container, forward request to:"+node.ip);
  servicename = req.params.servicename;
  option = req.params.option;
  x = req.params.x;
  y = req.params.y;
  
  nearestNeighbour = findNearestNeighbour(node.ni, 6, x, y);

  console.log("nearestNeighbour")
  console.log(nearestNeighbour);

  var back = function() {
    // nearestNeighbour = findNearestNeighbour(node.ni, 6, x, y);
    
    // console.log("nearestNeighbour")
    // console.log(nearestNeighbour);
    console.log("List services:");
    console.log(lsSV);
    if (nearestNeighbour.ni != undefined) {
      neighbourpath = "http://"+nearestNeighbour.ip+":3005/migpayment";

      request
        .post(neighbourpath, {
          form:{
            "servicename" : servicename,
            "account": option,
            "image": lsSV[option].path
          }
        },function(err,httpResponse,body){
          console.log("post to neighbour");
        });
    }
  }
  
  if (!lsSV[option]) {
    payService(servicename,option,function(checked, path){
      if (checked==true) {
        request
          .post('http://'+node.ip+':3005/startcontainer/', {
            form:{
              "servicename": servicename,
              "option": option,
              "path" : path
            }
          },function(err,httpResponse,body){
            res.setHeader("Content-Type", "text/plain");
            res.send(body);
          })
        
        lsSV[option] = {
          "servicename": servicename,
          "option": option,
          "path" : path
        }
        back();
      } else {
        res.setHeader("Content-Type", "text/plain");
        res.send("Something wrong:"+path);
        return;
      }
    })
  } else {
    request
    .post('http://'+node.ip+':3005/startcontainer/', {
      form:{
        "servicename": servicename,
        "option": option,
        "path" : lsSV[option].path
      }
    },function(err,httpResponse,body){
      res.setHeader("Content-Type", "text/plain");
      res.send(body);
    })
    back();
  }
})

///////REST CALLS
var stateMigrationList = []

function payService(servicename,account,callback){
  // stateMigrationList[servicename+"_"+account] = {
  //   servicename : servicename,
  //   account : account,
  //   image : image,
  // }
  // if (stateMigrationList[servicename+"_"+account]) {
  //   callback(true,stateMigrationList[servicename+"_"+account].image);
  //   return;
  // }
  // var timenow = new Date().getTime();
  // request
  // .post('http://'+restIP+':3003/api/LogService', {
  //   form:{
  //     "$class": "org.container.LogService",
  //     "node": "resource:org.container.Node#NODE_1",
  //     "sv": "resource:org.container.Service#"+servicename.toUpperCase(),
  //     "logType": "START_SERVICE",
  //     "customer": "resource:org.container.Customer#"+account.toUpperCase()
  //   }
  // },function(err,httpResponse,body){
  //   // resbody = JSON.parse(body);
  //   body = JSON.parse(body);
  //   console.log(body.customer);
  //   // console.log(resbody);
  //   // console.log(resbody.status + " " + resbody.path + " " + resbody.status == 200);
  //   if (body.error) {
  //     callback(false,body);
  //     return;
  //   } else {
  //     request
  //     .get('http://'+restIP+':3003/api/Service/'+servicename.toUpperCase(),
  //       function(err,httpResponse,body){
          // console.log("payService timespend: "+ (new Date().getTime() - timenow));
          // body = JSON.parse(body);
          var body = {
            // imagelink : "levanthanh3005/nodecasting:countdown"
            imagelink : "levanthanh3005/nodecasting:v0.2.countdown"
          }
          callback( true , body.imagelink);
        //   return;
  //     })
  //   }
  // })
  // .on('response', function(response) {
  //   console.log(response) // 200
  //   console.log(response.headers['content-type']) // 'image/png'
  //   callback();
  // })
}

function stopServiceInBc(servicename,account,callback){
  // console.log("Log into db:"+servicename+ " "+ account+ " "+ state+ " "+ notes);
  request
  .post('http://'+restIP+':3003/api/LogService', {
    form:{
      "$class": "org.container.LogService",
      "node": "resource:org.container.Node#NODE_1",
      "sv": "resource:org.container.Service#"+servicename.toUpperCase(),
      "logType": "STOP_SERVICE",
      "customer": "resource:org.container.Customer#"+account.toUpperCase()
    }
  },function(err,httpResponse,body){
    console.log("Done stop container");
    callback();
  })
}

function chargeAccountInBc(account,value,callback){
  // console.log("Log into db:"+servicename+ " "+ account+ " "+ state+ " "+ notes);
  request
  .post('http://'+restIP+':3003/api/ChargeAccount', {
    form:{
      "$class": "org.container.ChargeAccount",
      "valuePayment": value,
      "customer": "resource:org.container.Customer#"+account.toUpperCase()
    }
  },function(err,httpResponse,body){
    callback(body);
  })
}

function CheckNodeExistInBc(nodeName, callback){
  // console.log("Log into db:"+servicename+ " "+ account+ " "+ state+ " "+ notes);
  request
  .get('http://'+restIP+':3003/api/Node/'+nodeName,
    function(err,response){
      console.log("CheckNodeExist:"+nodeName);
      body = JSON.parse(response.body);
      console.log(body);
      if (body["error"]) {
        callback(false, "");
      } else {
        callback(true, body);
      }
  })
}

function RegisterNodeInBc(nodeName,latitute, longtitue, serverIp, mecprovider, callback){
  // console.log("Log into db:"+servicename+ " "+ account+ " "+ state+ " "+ notes);
//   CheckNodeExistInBc(nodeName, function(exist, response) {
//     if (exist) {
//       console.log("Exist in BC");
//       callback(true, response);
//     } else {
// // {
// //   "$class": "org.container.RegisterNode",
// //   "ni":"NODE_1",
// //   "latitute": 0,
// //   "longtitue": 0,
// //   "owner": "resource:org.container.MECProvider#MECPROVIDER_1"
// // }
//     console.log("Register new node");
//       request
//       .post('http://'+restIP+':3003/api/RegisterNode', {
//         form:{
//           "$class": "org.container.RegisterNode",
//           "ni" : nodeName,
//           "latitute": latitute,
//           "longtitue": longtitue,
//           "ip": serverIp,
//           "owner": "resource:org.container.MECProvider#"+mecprovider
//         }
//       },function(err,httpResponse,body){
//         console.log(body);
//         callback(true, JSON.parse(body));
//       })
//     }
//   })

  callback(true, {
          "$class": "org.container.RegisterNode",
          "ni" : nodeName,
          "latitute": latitute,
          "longtitue": longtitue,
          "ip": serverIp,
          "owner": "resource:org.container.MECProvider#"+mecprovider
  });
}
//END REST CALLS

function testFindNearestNeighbour(){
  listNode = {
    "NODE_1" : { '$class': 'org.container.RegisterNode',
    ni: 'NODE_1',
    latitute: '100',
    longtitue: '100',
    ip: '10.7.20.89',
    owner: 'resource:org.container.MECProvider#MECPROVIDER_1' },
  "NODE_2": { '$class': 'org.container.RegisterNode',
    ni: 'NODE_2',
    latitute: '100',
    longtitue: '105',
    ip: '10.7.20.104',
    owner: 'resource:org.container.MECProvider#MECPROVIDER_1' } };


  node = getNearestNode(100, 100);
  console.log(node);
  console.log("Request to start container, forward request to:"+node.ip);

  x = 0;
  y = 2;
  
  nearestNeighbour = findNearestNeighbour(node.ni, 6, x, y);
  console.log(nearestNeighbour);
}

app.listen(port, function () {
  console.log('Orchestrator app listening on port' + port + '!');
//   testFindNearestNeighbour();
});