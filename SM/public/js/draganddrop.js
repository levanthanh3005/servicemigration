function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  var data = ev.dataTransfer.getData("text");
  var newMEC;
  if (ev.target.className == "MEC") {
    ev.target.appendChild(document.getElementById(data));
    newMEC = ev.target.id;
  } 
  if (ev.target.className == "Service" || ev.target.className == "MECIp")  {
    ev.target.parentNode.appendChild(document.getElementById(data));
    newMEC = ev.target.parentNode.id;
  }
  console.log(newMEC);
  var newMECIndex = newMEC.split("_")[1];
  var originalMECIndex = data.split("_")[1];
  var serviceIndex = data.split("_")[2];
  console.log()
  console.log("Move "+data+" from MEC_"+ originalMECIndex+ " to MEC_"+newMECIndex);

  $.post('/migration', {
          serviceIndex: serviceIndex,
          originalMECIndex : originalMECIndex,
          newMECIndex
      }
  )
  .then(
      function success(name) {
        console.log("done");
      },

      function fail(data, status) {
        console.log("fail");
      }
  );

  document.getElementById(data).id = "Service_"+newMECIndex+"_"+serviceIndex;
}
