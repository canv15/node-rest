var http = require('http'),
	url = require('url'),
	connect = require('connect'),
	morgan = require('morgan')
	rest = require('../rest.js');

var app = connect()
	.use(morgan())
	.use(rest({logger: console}));


http.createServer(app).listen(8080);	
