const express = require('express');

const bodyParser = require('body-parser');
const request = require('request');

function testGet(){
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
}

function testPost2(){
  console.log("Test post")
  request.delete("http://10.7.20.89:6003/servers/sample", function(){
    console.log("Delete");
  })
}   

function assignProxy(){
  console.log("Test post")
  request.delete("http://10.7.20.89:6003/servers/sample", function(){
    
    request.post("http://10.7.20.89:6003/servers/sample", {
        json: {
            "max_connections": 0,
            "client_idle_timeout": "0",
            "backend_idle_timeout": "0",
            "backend_connection_timeout": "0",
            "bind": "0.0.0.0:3000",
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
                    "10.7.20.104:3000 weight=40 priority=1"
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
      }, (error, res, body) => {
        if (error) {
          console.log("Fail ");
          return;
        }
        console.log(body);
        console.log("Done>>>")
      })
  })
}
testPost2();
// testPost();

