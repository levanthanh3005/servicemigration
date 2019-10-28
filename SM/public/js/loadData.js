setInterval(function(){ 
  // console.log("Loading");
  if (!stopLoadingData) {
    $.get("/getContainers",function(data){
      // console.log(data);
      // $("#divid").load(" #divid");
      location.reload();
    });
  }
}, 3000);