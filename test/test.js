var rest = require('../rest')({mode:'test'}),
	createRes = require('./resHelper').createRes,
	assert = require('assert');

debugger;
describe('url match', function() {
	beforeEach(function() {
		rest.clear();
	});
	it('happy path', function() {
		get('/hello', function() {
			return {message:'hello'};
		});
		var res = createRes(),
			req = {
				url : '/hello',
				method: 'GET'
			};
		
		rest(req, res, function() { assert.fail('next should not be called'); });
		assert.equal(res.code, 200);
		assert.deepEqual(res.head, {'Content-Type':'application/json'});
		assert.deepEqual(res.body, JSON.stringify({message:'hello'}));
	});
});

