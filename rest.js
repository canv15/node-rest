var url = require('url'),
	fs = require('fs'),
	util = require('util'),
	PATH = require('path'),
	extend = require('extend');
/*
*******************************************************
	global variables defination
*******************************************************
*/
var handlerMap = {};
var uriStack = [];
var config;
var logger;

/*
*******************************************************
	global regester function
*******************************************************
*/
resource = function (uri, handlerDefine) {
	uriStack.push(uri);
	handlerDefine();
	uriStack.pop();
}

httpMethod = function (method) {
	return function (uri, handler) {
		if(typeof uri === 'function') {
			handler = uri;
			uri = '';
		}

		if(typeof uri !== 'string') {
			throw new Error('uri must be a string rather than ' + typeof uri + ', uri:' + util.inspect(uri));
		}

		if(typeof handler !== 'function') {
			throw new Error('handler must be a function rather than ' + typeof handler + ', handler:' + util.inspect(handler));
		}
		var uri = uriStack.join('') + uri,
			pattern,
			handlerObj = parse(uri, handler);

		logger.info(['register resource',uri,method].join(' '));
		pattern = handlerObj.regexp.toString();
		handlerMap[pattern] = handlerMap[pattern] ||  handlerObj;

		if(handlerMap[pattern].handlers[method]) {
			logger.warn([handlerMap[pattern].handlers[method].toString(),
				'will be overrided by',
				handler.toString(),
				'when register resource',
				uri,
				method
			].join(' '));
		};
		handler.method = method;
		handlerMap[pattern].handlers[method] = handler;
	}
}

get = httpMethod('GET');
post = httpMethod('POST');
put = httpMethod('PUT');
del = httpMethod('DELETE');


/*
*******************************************************
	implement
*******************************************************
*/

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
		uri: uri,
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
	
	result =  function() {
		return handler.apply(undefined, args);
	};
	result.origin = handler;
	return result;
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
				logger.info(['http request',
						req.method,
						req.url,
						'was catched by resource',
						handlerObj.uri,
						req.method
					].join(' '));
				req.pathParams = makeParameters(handlerObj.params, m.slice(1));
				return bindingArguments(handler,req,res);
			}
		}

	}
}


function rest(req, res, next) {
	if(config.mode === 'dev') {
		init();
	}

	var result,jsonResult,
		handler = findMatch(req, res);

	
	if(!handler) { return next(); }

	try {
		result = handler(req);

		delete req.pathParams;

		if (result) {
			res.writeHead(200,{'Content-Type':'application/json'});
			try {
				jsonResult = JSON.stringify(result);
			} catch(e) {
				logger.error(['result of resouce handler can not be stringifed to JSON.','handler:',handler.origin.toString(),'result:',util.inspect(result)].join(' '));
				throw {
					code: 500,
					msg: 'result can not be format to JSON'
				};
			}
			res.end(jsonResult);
		} else {
			res.writeHead(204);
			res.end();
		}
	} catch (e) {
		if(typeof e.code === 'number' && e.msg) {
			res.writeHead(e.code,{'Content-Type':'application/json'});
			res.end(JSON.stringify(e.msg));
		} else {
			res.writeHead(500,{'Content-Type':'application/json'});
			res.end(JSON.stringify(e));
		}
	}
}


function loadResource(path) {
	var s = fs.statSync(path);
	var absPath = PATH.resolve(process.cwd() + '/' + path);
	if (s.isFile() && PATH.extname(path) === '.js') {
		try {
			delete require.cache[absPath];
			require(absPath);
			logger.info(['load resouce file:',absPath].join(' '));
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

function init() {
	clearCache();
	loadResource(config.resourceLocation);
}


var DEFAULT_CONFIG = { 
	mode: 'dev',
	resourceLocation : './resource',
	logger: {
		info: function() {},
		warn: function() {},
		error: function() {}
	}
};


/*
* config === string, just represents resource location
* config === null, the resource default value is resource
* config == obj, module work as config
*/
module.exports = function(cfg) {
	if(typeof cfg === 'string') {
		cfg = { resourceLocation: cfg};
	} 

	config = extend(true,DEFAULT_CONFIG, cfg);
	
	if(config.mode === 'product') {
		init();
	}

	if(typeof config.logger === 'function') {
		logger = config.logger.call(undefined);
	} else {
		logger = config.logger;
	}

	rest.clear = clearCache;
	return rest
}
