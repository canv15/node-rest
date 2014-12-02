var assert  = require('assert');

exports.mockResponse = function (){
	return {
		code: undefined,
		head: undefined,
		body: undefined,
		writeHead : function(code, head) {
			this.code = code;	
			this.head = head;
		},
		end : function(body) {
			this.body = body;
		}
	};
};

exports.mockUNext = function() {
	assert.fail('next should not be called');
}

var mockNext = function() {
	mockNext.result = function() {
		mockNext.result = function() {return false;}
		return true;
	}
}
mockNext.result = function() {return false;}

exports.mockNext = mockNext;
