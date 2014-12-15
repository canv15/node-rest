var mockRes = require('./resHelper').mockResponse,
	mockUNext = require('./resHelper').mockUNext,
	mockNext = require('./resHelper').mockNext,
	mockLogger = require('./resHelper').mockLogger,
	rest = require('../rest')({mode:'test',logger: mockLogger}),
	assert = require('assert');

debugger;
describe('logger test', function() {
	beforeEach(function() {
		rest.clear();
		mockLogger.clear();
	});

	it('logger info, when register resource', function() {
		resource('/rest',function(){
			get('/hello', function() {
				return {message:'hello'};
			});
		});

		assert.equal(mockLogger.lastInfo,'register resource /rest/hello GET');
	});

	it('logger info, when register resource which url contain placeholder', function() {
		resource('/rest',function(){
			get('/{id}', function() {
				return {message:'hello'};
			});
		});

		assert.equal(mockLogger.lastInfo,'register resource /rest/{id} GET');
	});

	it('logger warn, when register same with duplicate HTTP Method', function(){
		resource('/rest', function() {
			get('/hello',function() {console.log();});
			get('/hello',function() {});
		});

		assert.equal(mockLogger.lastInfo,'register resource /rest/hello GET');
		assert.equal(mockLogger.lastWarn, 'function () {console.log();} will be overrided by function () {} when register resource /rest/hello GET');
	});

	it('logger info, when http request match resource defination', function() {
		resource('/rest', function(){
			get(function() {});
		});

		var res = mockRes(),
			req = {
				url: '/rest',
				method: 'GET'
			};
		rest(req, res, mockUNext);
		assert.equal(mockLogger.lastInfo, 'http request GET /rest was catched by resource /rest GET');
	});

	it('logger info, when http request match resource defination with placeholder', function() {
		resource('/rest', function(){
			get('/{id}', function() {});
		});

		var res = mockRes(),
			req = {
				url: '/rest/123456',
				method: 'GET'
			};
		rest(req, res, mockUNext);
		assert.equal(mockLogger.lastInfo, 'http request GET /rest/123456 was catched by resource /rest/{id} GET');
	});
});

