var fs = require('fs');

module.exports = {
	execute : function(command, callback, isOnlyRun, detach) {
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
			   		if (!detach) {
						console.log('stdout: ' + stdout);
						console.log('stderr: ' + stderr);
					}
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
				pid : data[s][1],
				status: data[s][2],
				bundle : data[s][3],
				created: data[s][4],
				owner: data[s][5]
			}
			//console.log(rs[s-1]);
		}
		return rs;
	},
	convertToJson: function(path,data,callback){
		var configJson = {"ociVersion":"1.0.1-dev","process":{"terminal":true,"user":{"uid":0,"gid":0},"args":["sh"],"env":["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin","TERM=xterm"],"cwd":"/","capabilities":{"bounding":["CAP_AUDIT_WRITE","CAP_KILL","CAP_NET_BIND_SERVICE"],"effective":["CAP_AUDIT_WRITE","CAP_KILL","CAP_NET_BIND_SERVICE"],"inheritable":["CAP_AUDIT_WRITE","CAP_KILL","CAP_NET_BIND_SERVICE"],"permitted":["CAP_AUDIT_WRITE","CAP_KILL","CAP_NET_BIND_SERVICE"],"ambient":["CAP_AUDIT_WRITE","CAP_KILL","CAP_NET_BIND_SERVICE"]},"rlimits":[{"type":"RLIMIT_NOFILE","hard":1024,"soft":1024}],"noNewPrivileges":true},"root":{"path":"rootfs","readonly":true},"hostname":"runc","mounts":[{"destination":"/proc","type":"proc","source":"proc"},{"destination":"/dev","type":"tmpfs","source":"tmpfs","options":["nosuid","strictatime","mode=755","size=65536k"]},{"destination":"/dev/pts","type":"devpts","source":"devpts","options":["nosuid","noexec","newinstance","ptmxmode=0666","mode=0620","gid=5"]},{"destination":"/dev/shm","type":"tmpfs","source":"shm","options":["nosuid","noexec","nodev","mode=1777","size=65536k"]},{"destination":"/dev/mqueue","type":"mqueue","source":"mqueue","options":["nosuid","noexec","nodev"]},{"destination":"/sys","type":"sysfs","source":"sysfs","options":["nosuid","noexec","nodev","ro"]},{"destination":"/sys/fs/cgroup","type":"cgroup","source":"cgroup","options":["nosuid","noexec","nodev","relatime","ro"]}],"linux":{"resources":{"devices":[{"allow":false,"access":"rwm"}]},"namespaces":[{"type":"pid"},{"type":"network"},{"type":"ipc"},{"type":"uts"},{"type":"mount"}],"maskedPaths":["/proc/kcore","/proc/latency_stats","/proc/timer_list","/proc/timer_stats","/proc/sched_debug","/sys/firmware","/proc/scsi"],"readonlyPaths":["/proc/asound","/proc/bus","/proc/fs","/proc/irq","/proc/sys","/proc/sysrq-trigger"]}};
		configJson["process"]["terminal"] = false;
		// console.log(data["env"])

		configJson["process"]["env"] = configJson["process"]["env"].concat(data["env"]);
		// console.log(data[env]);
		
		configJson["process"]["cwd"] = data["workdir"];
		configJson["process"]["args"] = data["args"];
		configJson["linux"]["namespaces"]=[{"type":"pid"},{"type":"ipc"},{"type":"uts"},{"type":"mount"}];
		// console.log(configJson["process"]["env"])
		// var fs = require('fs');
		configJson = JSON.stringify(configJson);
		fs.writeFile(path+'/config.json', configJson, 'utf8', function(){
			callback();
		});

	}
}