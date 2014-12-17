var http = require('http'),
	url = require('url'),
	connect = require('connect'),
	morgan = require('morgan')
	bodyParse = require('body-parser'),
	rest = require('../rest.js');

var app = connect()
	.use(morgan())
	.use(bodyParse.json())
	.use('/rest',rest({logger: console}));


http.createServer(app).listen(8080);	
