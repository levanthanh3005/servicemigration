var stopLoadingData = false;

function allowDrop(ev) {
  console.log("allowDrop");
  stopLoadingData = true;
  ev.preventDefault();
}

function drag(ev) {
  console.log("drag");
  stopLoadingData = true;
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
  console.log("drop");

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

  if (!newMEC) {
    console.log("Dont migrate");
    return;
  }

  var newMECIndex = newMEC.split("_")[1];
  var originalMECIndex = data.split("_")[1];

  if (newMECIndex == originalMECIndex) {
    console.log("Dont migrate");
    return;
  }

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
        stopLoadingData = false;

      },

      function fail(data, status) {
        console.log("fail");
        stopLoadingData = false;

      }
  );

  document.getElementById(data).id = "Service_"+newMECIndex+"_"+serviceIndex;
}

$(".titleHeader").click(function(){
    var controller = 
      '<div class="reboot">'+
      '  <a href="/reboot/-1">PLEASE PAY ATTENTION TO REBOOT SERVICE MANAGER</a>'+
      '</div>';
    $("#MECcontroller").html(controller);
})