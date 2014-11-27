var http = require('http'),
	url = require('url'),
	connect = require('connect'),
	morgan = require('morgan');

var handlerMap = {};

var uriStack = [];

function resource(uri, handlerDefine) {
	uriStack.push(uri);
	handlerDefine();
	uriStack.pop();
}

function httpMethod(method) {
	return function (uri, handler) {
		var url = uriStack.join('') + uri;
		handlerMap[url] = handlerMap[url] || {};
		handlerMap[url][method] = handler;
	}
}

var get = httpMethod('GET');
var post = httpMethod('POST');
var put = httpMethod('PUT');
var del = httpMethod('DELETE');


function rest(req, res, next) {
		var pathname = url.parse(req.url).pathname;
		var handlerObj = handlerMap[pathname] || {};
		var handler = handlerObj[req.method]
		var result;
		if(handler) {
			result = handler(req);
			res.writeHead(200,{'Content-Type':'application/json'});
			res.end(JSON.stringify(result));
		} else {
			next();
		}
}

/*****************************************************************/

resource('/abcd',function(req) {
	get('/xyz',function(req) {
		console.log('hi, I am get');
		return {message:'I am xyz'};
	});

	post('/zzz', function(req) {
		console.log('I am zzz');
		return {message:'I am zzz'};
	});
});


/*****************************************************************/

var app = connect()
	.use(morgan())
	.use(rest);


http.createServer(app).listen(8080);	
