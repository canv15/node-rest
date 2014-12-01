exports.createRes = function (){
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
