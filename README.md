node-restify
============

A middleware of connect/express to support RESTFul style API service.


## Installation

This package is available on 'npm' as: `node-restify`

``` sh
npm install node-restify
```

## Usage

1 Import and be used as middleware of connect/express in server.js or app.js

```
var http = require('http'),
	url = require('url'),
	connect = require('connect'),
	rest = require('node-restify');

var app = connect()
	.use(rest()));

http.createServer(app).listen(8080);

```

2 Make directory 'resources'

```
$ mkdir resource

$ ls -l
total 12
drwxr-xr-x 6 vagrant vagrant 4096 Dec 21 01:10 node_modules
drwxrwxr-x 3 vagrant vagrant 4096 Dec 21 01:08 resources
-rw-rw-r-- 1 vagrant vagrant  322 Dec 21 01:17 server.js
```

3 Put or create resource file(s) into directory 'resources'.

```
$ cd resources
$ touch test-rs.js
$ ls
test-rs.js
```
A resource file is just a normal js file, you can name it as any name you like, it looks like below:

```
//define resource url
resource('/foo',function() {


	/*
	* Define resource uri pattern, http method and handler.
	* The arguments of handler can be any number variables, which names are as same as parameters defined in uri pattern or query parameter or other scopes.
	* The values of arguments are auto binded by node-restify at runtime.
	*/

	get('/bar/{type}/{id}',function(id, type) {

		/*
		* do your things, 
		* and return an any object which will be transform to JSON string to as content of response
		*/

		return {
			message:'I am node-restify, I cam get binding params from anywhere!',
			type: type, 
			id: id
		};
	});

	// others methods....
});
```
Done! 

Examples can be found in directory 'example' in node modules.
Test cases can be found in directory 'test' node moudles.



### API
#### rest([resource|config]):
Register node-restify as a middleware use default or special config.

arguments:
	resource: string, the location of resources dir, the default value is 'resources'
	config: config object, see below.

You can use it as : 
```
	use('/foo',rest())
```
or
```
	use('/foo',rest('./resources')
```
or
```
	use('/foo',rest(config))
```


#### config
A config object, which control the behaviour of node-restify, the default config object like this:
```
{ 
	mode: 'dev',
	resourceLocation : './resources',
	bindingSeq: ['pathParams','query'],
	logger: {
		info: function() {},
		warn: function() {},
		error: function() {}
	}
}
```
mode: string, You can change mode from dev to product in your product env. 'dev' will reload all of resource every time received a request, while 'product' will only load resouces at one time when server is start.

resourceLocation: string, which tell node-restify where to load resource definations. default value './resources'.
bindingSeq: array of string, used to tell node-restify which scope to binding parameter to arguments of handler at runtime. The default value ['pathParams','query'], it means arguments will be binded from path parameter at first, if not found, then query parameter. A argument will be binded only once. You can change order or add your scope in this list if you use other middlewares,for example like 'cookie-parser'...
logger: logger object, any object which just have info, warn, error method, or a factory function which will retrun logger object,you can just put logger: console in your dev env.

#### resource(url, definationFunctiopn)
define resource for special url
arguments:
	url: the url, like '/abc/xyz'
	definationFunctiopn : define function, see Usage.

#### get([url],handler)
define a handler, it will catch request which matched url define, and http method is 'GET"
arguments
	uri : optional, like '/foo/bar', the uri can contain path parameter, which like '/foo/bar/{type}/{id}', type and id are path paramethers, thet will be catched and be binded to arguments of hander
	handler: function, which do real things to process request. The arguments of handler will be binded values when request received. undefined be will be set to arguments if nothing found from pre-defined scope list. The result of handler should be normal object which can be transform to a JSON string. 200 will be as response http code. 204 will be as http return code if no resource/undefine returned from handler


#### post([url],handler)
For http method 'POST',others see get([url',handler)

#### put([url],handler)
For http method 'PUT',others see get([url',handler)

#### del([url],handler)
For http method 'DELETE';,others see get([url',handler)

##License
`node-restify` is licensed under the [MIT License][mit-license-url].


