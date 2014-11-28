var url = require('url');

var handlerMap = {};

var uriStack = [];

function resource(uri, handlerDefine) {
	uriStack.push(uri);
	handlerDefine();
	uriStack.pop();
}

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

function httpMethod(method) {
	return function (uri, handler) {
		var uri = uriStack.join('') + uri,
			pattern,
			parseResult = parse(uri, handler);
		pattern = parseResult.regexp.toString();
		handlerMap[pattern] = handlerMap[pattern] ||  parseResult;
		handlerMap[pattern].handlers[method] = handler;
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

function bindingArguments(handler, req, res, pathParams) {
	var argNames = handler.args,
		args = [];

	argNames.forEach(function(name) {
		if(name === 'httpRequest') {
			args.push(req);
		} else if (name === 'httpResponse') {
			args.push(res);
		} else if (pathParams[name]) {
			args.push(pathParams[name]);
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
		m, handlerObj, pattern,
		pathParam; 

	for(pattern in handlerMap) {
		handlerObj = handlerMap[pattern];
		m = pathname.match(handlerObj.regexp);
		if(m) {
			handler = handlerObj.handlers[req.method];
			if(handler) {
				pathParams = makeParameters(handlerObj.params, m.slice(1));
				return bindingArguments(handler,req,res,pathParams);
			}
		}

	}
}

var get = httpMethod('GET');
var post = httpMethod('POST');
var put = httpMethod('PUT');
var del = httpMethod('DELETE');


function rest(req, res, next) {
		var result,
			handler = findMatch(req, res);

		if(!handler) { return next(); }

		result = handler(req);
		delete req.pathParams;
		res.writeHead(200,{'Content-Type':'application/json'});
		res.end(JSON.stringify(result));
}

/*****************************************************************/

resource('/abcd',function() {
	get('/xyz',function(httpRequest) {
		console.log('hi, I am get');
		return {message:'I am xyz',url: httpRequest.url};
	});

	post('/zzz', function() {
		console.log('I am zzz');
		return {message:'I am zzz'};
	});

	put('/{id}',function(id) {
		console.log('create',id);
		return {id:id};
	});

	del('/{name}/{type}', function(name, httpResponse, type) {
		return {
			name: name,
			type: type,
			res: typeof httpResponse
		}
	});
});

module.exports = function() {
	return rest
}
