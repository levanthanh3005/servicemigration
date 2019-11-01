module.exports = {
	execute : function(command, callback, isOnlyRun) {
		var exec = require('child_process').exec;
		var spawn = require('child_process').spawn;
		var child;
		if (isOnlyRun == true) {
			// child = spawn(command.command, command.arg);
			// child.stdout.on('data', function(data) {   
			// 	callback();      
			// })
			child = exec(command);
			setTimeout(function(){
				callback();
			},1500)
		} else {
			child = exec(command,
			   function (error, stdout, stderr) {
			      console.log('stdout: ' + stdout);
			      console.log('stderr: ' + stderr);
			      if (error !== null) {
			          console.log('exec error: ' + error);
			      }
			      callback(stdout, error);
			   });
		}
	},
	splitString: function(str) {
		var arrLine = str.split("\n");
		var arrCell = [];
		var firstColData = [];
		for (var s in arrLine) {
			arrCell[s]  = arrLine[s].split(/(\s+)/);
			//arrCell[s]  = arrLine[s].split("\\t");
			if (s > 0 && arrCell[s][0]!='') {
				firstColData[s-1] = arrCell[s][0];
			}
		}
		//console.log(firstColData);
		return {
			fullData : arrCell,
			firstColData : firstColData
		}
	},
	parseSwarm: function(data) {
		var rs = []
		for (var s in data) {
			if (s == 0 || data[s][0] == '') continue;
			rs[s-1] = {
				name : data[s][0],
				active : data[s][2],
				driver : data[s][4],
				state : data[s][6],
				url : data[s][6] == "Stopped" ? "" : data[s][8],
				swarm : data[s][6] == "Stopped" ? "" : data[s][9],
				docker : data[s][6] == "Stopped" ? data[s][8] : data[s][10],
				errors : data[s][6] == "Stopped" ? "" : data[s][11],
			}
			console.log(rs[s-1]);
		}
		return rs;
	},
	parseServices: function(data) {
		var rs = []
		for (var s in data) {
			if (s == 0 || data[s][0] == '') continue;
			rs[s-1] = {
				id: data[s][0],
				name : data[s][2],
				mode : data[s][4],
				replicas : data[s][6],
				image : data[s][8],
				port : data[s][10],
			}
		}
		return rs;
	},
	parseStacks: function(data) {
		var rs = []
		for (var s in data) {
			if (s == 0 || data[s][0] == '') continue;
			rs[s-1] = {
				name : data[s][0],
				services : data[s][2],
				orchestrator : data[s][4],
			}
		}
		return rs;
	},
	parseContainers: function(data) {
		var rs = []
		for (var s in data) {
			if (s == 0 || data[s][0] == '') continue;
			rs[s-1] = {
				id : data[s][0],
				image : data[s][2]
			}
			//console.log(rs[s-1]);
		}
		return rs;
	}
}