var http = require('http')

function handler(request, response) {
	response.writeHead(200,{'content-Type': 'text/plain'});
	response.end('Hello world');
}

http.createServer(handler).listen(8080);
console.log('server start');
