const request = require('request');

var PushPath = process.env.PUSHPATH || "localhost";

function pushNotification(){
  console.log("Sending");

  var today = new Date();
  var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date+' '+time;
  var timestamp = today.getTime();

  console.log(PushPath);
  
  request.post(PushPath, {
      json: {
        dateTime : dateTime,
        timestamp : timestamp
      }
    }, (error, res, body) => {
      if (error) {
        console.log("Fail to push");
        waitToSend();
        return;
      }
      console.log("Sent")
      waitToSend();
    })
}

function waitToSend(){
    setInterval(function(){ 
      pushNotification();
    }, 2000);
}

pushNotification();