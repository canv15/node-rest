var rest = require('./rest');

var res = {
	writeHead : function() {
	},
	end : function(content) {
		console.log(content);
	}
}

var req = {
	url : '/abcd/xyz',
	method: 'GET'
}

var handler = rest('./resource');

var next = function() {
	console.log('next....');
}

handler(req,res, next);

var req = {
	url : '/abcd/xyz',
	method: 'PUT'
}
handler(req,res, next);

var req = {
	url : '/abcd/zzz',
	method: 'POST'
}
handler(req,res, next);

var req = {
	url : '/abcd/xyz/shenyu',
	method: 'DELETE'
}
handler(req,res, next);

var req = {
	url : '/hello',
	method: 'GET'
}
handler(req,res, next);
