var url = require('url');
var fs = require('fs');
var PATH = require('path');

var handlerMap = {};
var uriStack = [];
var RESOURCE_LOCATION = './resource';

/*
* gloabl regester function
*/
resource = function (uri, handlerDefine) {
	uriStack.push(uri);
	handlerDefine();
	uriStack.pop();
}

function httpMethod (method) {
	return function (uri, handler) {
		var uri = uriStack.join('') + uri,
			pattern,
			handlerObj = parse(uri, handler);
		pattern = handlerObj.regexp.toString();
		handlerMap[pattern] = handlerMap[pattern] ||  handlerObj;
		handlerMap[pattern].handlers[method] = handler;
	}
}

get = httpMethod('GET');
post = httpMethod('POST');
put = httpMethod('PUT');
del = httpMethod('DELETE');


function parse(uri, handler) {
	var regexp = /\{[a-zA-Z_]\w*\}/g, //it will match patten: /asdf/{xxx}/{yyy}/sdfs
		handlerStr = handler.toString(),
		begin = handlerStr.indexOf('(') + 1,
		end = handlerStr.indexOf(')');

	handler.args = handlerStr.slice(begin,end).split(',').map(function(arg){
		return arg.trim();
	});
	return {
		params: (uri.match(regexp) || []).map(function(param) {
			return param.slice(1, -1);
		}),
		regexp : new RegExp('^' + uri.replace(regexp,'([\\w-]+)') + '$'),
		handlers : {}
	};
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

function bindingArguments(handler, req, res ) {
	var argNames = handler.args,
		args = [];

	argNames.forEach(function(name) {
		if(name === 'httpRequest') {
			args.push(req);
		} else if (name === 'httpResponse') {
			args.push(res);
		} else if (req.pathParams[name]) {
			args.push(req.pathParams[name]);
		} else {
			args.push(undefined);
		}
	});
	
	return function() {
		return handler.apply(undefined, args);
	}
}

function findMatch(req, res) {
	var pathname = url.parse(req.url).pathname,
		m, handlerObj, pattern;

	for(pattern in handlerMap) {
		handlerObj = handlerMap[pattern];
		m = pathname.match(handlerObj.regexp);
		if(m) {
			handler = handlerObj.handlers[req.method];
			if(handler) {
				req.pathParams = makeParameters(handlerObj.params, m.slice(1));
				return bindingArguments(handler,req,res);
			}
		}

	}
}


function rest(req, res, next) {
	init(RESOURCE_LOCATION);

	var result,
		handler = findMatch(req, res);

	
	if(!handler) { return next(); }

	result = handler(req);
	delete req.pathParams;
	res.writeHead(200,{'Content-Type':'application/json'});
	res.end(JSON.stringify(result));
}


function loadResource(path) {
	var s = fs.statSync(path);
	var absPath = PATH.resolve(process.cwd() + '/' + path);
	if (s.isFile() && PATH.extname(path) === '.js') {
		try {
			// reload resource module
			delete require.cache[absPath];
			require(path);
		} catch(e) {
			console.log(e);
		}
	} else if (s.isDirectory()){
		var files = fs.readdirSync(path);
		files.forEach(function(filename){
			loadResource(path + '/' + filename);
		});
	}
}

function clearCache() {
	handlerMap = {};
	uriStack = [];
}

function init(path) {
	clearCache();
	loadResource(path);
}


module.exports = function(resource) {
	if(resource) {
		RESOURCE_LOCATION = resource;
	}
	return rest
}
