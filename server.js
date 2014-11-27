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

function parseUri(uri, handler) {
	var regexp = /\{[a-zA-Z_]\w*\}/g;
	handler.params = (uri.match(regexp) || []).map(function(param) {
		return param.slice(1, -1);
	});
	return uri.replace(regexp,'([\\w-]+)');
}

function httpMethod(method) {
	return function (uri, handler) {
		var uri = uriStack.join('') + uri;
		uri = parseUri(uri, handler);
		handlerMap[uri] = handlerMap[uri] || {};
		handlerMap[uri][method] = handler;
	}
}

function makeParameters(pNames, pValues) {
	var result = {};
	if(!pNames || !pValues) {
		return result
	}
	var i=0, len = Math.min(pNames.length, pValues.length);
	for(i; i<len; i++) {
		result[pNames[i]] = pValues[i];
	}
	return result;
}

function findMatch(uri) {
	var uriPatterns = Object.keys(handlerMap),
		i=0, len= uriPatterns.length,
		m, handlerObj, parameters, uriPattern;
	
	for(i; i<len; i++ ) {
		uriPattern = uriPatterns[i];
		m = uri.match(new RegExp('^' + uriPattern + '$'));
		//TODO: catch RegExp
		if(m) {
			handlerObj = handlerMap[uriPattern];
			return {
				handlerObj: handlerObj,
				paramValues: m.slice(1)
			}
		}

	}
}

var get = httpMethod('GET');
var post = httpMethod('POST');
var put = httpMethod('PUT');
var del = httpMethod('DELETE');


function rest(req, res, next) {
		var pathname = url.parse(req.url).pathname;
		var matchResult = findMatch(pathname);
		//TODO add method to findMatch arguments
		if(!matchResult) { return next(); }

		var handlerObj = matchResult.handlerObj;
		var handler = handlerObj[req.method]
		var result;
		if(!handler) { return next(); }

		req.pathParams = makeParameters(handler.params, matchResult.paramValues);
		result = handler(req);
		delete req.pathParams;
		res.writeHead(200,{'Content-Type':'application/json'});
		res.end(JSON.stringify(result));
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

	put('/{id}',function(req) {
		var id = req.pathParams.id;
		console.log('create',id);
		return {id:id};
	});

	del('/{name}/{type}', function(req) {
		return req.pathParams;
	});
});


/*****************************************************************/

var app = connect()
	.use(morgan())
	.use(rest);


http.createServer(app).listen(8080);	
