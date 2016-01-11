var express = require('express'),
	app = express();

var pairs = {};	

app.use(function(req,res,next){
	console.log('%s %s', req.method, req.url);
	next();
});

app.use('/static', express.static(__dirname + '/public'));

app.get(/^\/ctrl.*$/, function(req, res){
	res.sendfile(__dirname + '/public/ctrl.html');
});

app.get(/^\/.*$/, function(req,res){
	res.sendfile(__dirname + '/public/game.html');
});

var srv = app.listen(8080);
io = require("socket.io").listen(srv);
io.set('log level', 1); 

var gameIO = io.of('/game').on('connection', function(game){
	var seed = getSeed();
	game.emit('make QRcode', {seed: seed});
	var pair = pairs[seed] = {};
	pair['game'] = game;
});

function getSeed() {
	return ''+Math.floor(Math.random()*8999999999+1000000000);
	//return '123'
}

/*********************************************/

var ctrlIO = io.of('/ctrl').on('connection', function(ctrl){
	ctrl.on('link game', function(res){
		var seed = res.seed;
		var pair = pairs[seed];
		if(pair) {
			console.log('game linked');

			pair['ctrl'] = ctrl;
			var game = pair['game'];
			game.emit("start game");

			ctrl.on("forward", function(res){
				//console.log('get forward command!');
				game.emit("forward", {forward: res.forward});
			});
			ctrl.on("turn", function(res){
				//console.log("get turn command!");
				game.emit("turn", {al:res.al, beta:res.beta, gm:res.gm});
			});
		}
	});
});
console.log('app start 8080/');