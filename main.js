var sio = require('socket.io')
  , http = require('http')
  , request = require('request')
  , os = require('os')
  ;
var http = require('http');
var httpProxy = require('http-proxy');
var exec = require('child_process').exec;

var proxy = httpProxy.createServer();

var TARGET;

var PROD = 'http://52.6.22.174:5000';
/*
http.createServer(function (req, res) {
  //
  // On each request, get the first location from the list...
  //
 // var target = { target: addresses.shift() };

  //
  // ...then proxy to the server whose 'turn' it is...
  //
 // console.log('balancing request to: ', target);
 
 TARGET = PROD;
  proxy.web(req, res, TARGET);

  //
  // ...and then the server you just used becomes the last item in the list.
  //
//addresses.push(target.target);
}).listen(8089);
*/
var app = http.createServer(function (req, res) {
	   
     // res.writeHead(200, { 'Content-Type': 'text/html' });
     // res.end();
	 TARGET = PROD;
	  proxy.web( req, res, {target: TARGET } );
    })
  , io = sio.listen(app);

function memoryLoad()
{
	//console.log( os.totalmem(), os.freemem() );
	var totalMem = os.totalmem() - os.freemem();
	var memPercent = ~~((totalMem/os.totalmem())* 100);
	console.log("Memory",memPercent);
	return memPercent;
	//return 0;
}

// Create function to get CPU information
function cpuTicksAcrossCores() 
{
  //Initialise sum of idle and time of cores and fetch CPU info
  var totalIdle = 0, totalTick = 0;
  var cpus = os.cpus();
 
  //Loop through CPU cores
  for(var i = 0, len = cpus.length; i < len; i++) 
  {
		//Select CPU core
		var cpu = cpus[i];
		//Total up the time in the cores tick
		for(type in cpu.times) 
		{
			totalTick += cpu.times[type];
		}     
		//Total up the idle time of the core
		totalIdle += cpu.times.idle;
  }
 
  //Return the average Idle and Tick times
  return {idle: totalIdle / cpus.length,  total: totalTick / cpus.length};
}

var startMeasure = cpuTicksAcrossCores();

function cpuAverage()
{
	var endMeasure = cpuTicksAcrossCores(); 
 
	//Calculate the difference in idle and total time between the measures
	var idleDifference = endMeasure.idle - startMeasure.idle;
	var totalDifference = endMeasure.total - startMeasure.total;
 
	//Calculate the average percentage CPU usage
	var loadDifference = (totalDifference - idleDifference) ;
	var percentLoad = ~~((loadDifference/totalDifference)*100);
	console.log("CPU Cycle",percentLoad);
	return percentLoad;
	
	//return 0;
}

function measureLatenancy(server)
{
	var options = 
	{
		url: 'http://localhost' + ":" + server.address().port,
	};
	var start = Date.now();
	request(options, function (error, res, body) 
	{
		var end = Date.now();
		
		server.latency = end-start;
		//console.log("latency:",server.latency);
	});
	
	return server.latency;
}

function calcuateColor()
{
	// latency scores of all nodes, mapped to colors.
	var nodes = nodeServers.map( measureLatenancy ).map( function(latency) 
	{
		var color = "#cccccc";
		if( !latency )
			return {color: color};
		if( latency > 8000 )
		{
			color = "#ff0000";
		}
		else if( latency > 4000 )
		{
			color = "#cc0000";
		}
		else if( latency > 2000 )
		{
			color = "#ffff00";
		}
		else if( latency > 1000 )
		{
			color = "#cccc00";
		}
		else if( latency > 100 )
		{
			color = "#0000cc";
		}
		else
		{
			color = "#00ff00";
		}
		//console.log( latency );
		return {color: color};
	});
	//console.log( nodes );
	return nodes;
}


/// CHILDREN nodes
var nodeServers = [];

///////////////
//// Broadcast heartbeat over websockets
//////////////
setInterval( function () 
{
	io.sockets.emit('heartbeat', 
	{ 
		//var cpu = cpuAverage();
		//var memory = memoryLoad();
        name: "Your Computer", canary:canary(cpuAverage(), memoryLoad()),
        nodes: calcuateColor()
		
		//if(cpu >=25)
		//	console.log("canary killed");
   });
}, 2000);
app.listen(3000);

/// NODE SERVERS

createServer(9000, function()
{
	// FAST
});
createServer(9001, function()
{
	// MED
	for( var i =0 ; i < 300; i++ )
	{
		i/2;
	}
});
createServer(9002, function()
{
	// SLOW	
	for( var i =0 ; i < 2000000000; i++ )
	{
		Math.sin(i) * Math.cos(i);
	}	
});

function createServer(port, fn)
{
	// Response to http requests.
	var server = http.createServer(function (req, res) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fn();
		
     res.end();
   }).listen(port);
	nodeServers.push( server );

	server.latency = undefined;
}

function canary(cpu, memoryLoad)
{
	//var cpu =  cpuAverage();
	//var memoryLoad = memoryLoad();
	
	if(cpu >= 95)
		//console.log("kill here");
		exec('forever stopall');
}