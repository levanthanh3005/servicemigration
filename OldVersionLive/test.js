const request = require('request');


function startContainer1(callback){
	request.get("http://10.7.20.89:3006/carservice/100/100/startcontainer/video/countdown/0/2",
		function(err,httpResponse,body){
			console.log(body);
			callback(body);
		})
}

function startContainer2(callback){
	request.get("http://10.7.20.89:3006/carservice/100/105/startcontainer/video/countdown/0/2",
		function(err,httpResponse,body){
			console.log(body);
			callback(body);
		})
}

function stopContainer(callback){
	request.post("http://10.7.20.89:3006/carservice/103/100/stopcontainer", {
		form:{
		  services: [ 'http://10.7.20.89:5000/getCurrentString' ]
		}
	},function(err,httpResponse,body){
		callback();
	});
}

startContainer1(function(link){
	console.log("startcontainer1"+link);

	function afterStart1(){
		console.log("afterStart1");
		stopContainer(function(){

			console.log("stopContainer");

			startContainer2(function(link){
				console.log("startcontainer2"+link);

				function afterStart2(){
					console.log("Finish");
				}

				var numOfReq = 5;
				function watchVideo2(link,index){
					console.log("watchVideo2 :"+index);

					if (index >= numOfReq) {
						afterStart2();
						return;
					}
					setTimeout(function(){
						request.get(link,
							function(err,httpResponse,body){
								console.log(body);
								watchVideo2(link,index+1);
							})
					},5000);

				}

				watchVideo2(link,0);


			})

		})
	}

	var numOfReq = 5;
	function watchVideo1(link,index){
		console.log("watchVideo1 :"+index);
		if (index >= numOfReq) {
			afterStart1();
			return;
		}
		setTimeout(function(){
			request.get(link,
			function(err,httpResponse,body){
				console.log(body);
				watchVideo1(link,index+1);
			})
		},5000);
		
	}
	watchVideo1(link,0);
})