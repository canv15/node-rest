resource('/abcd',function() {

	get('/xyz',function(httpRequest) {
		console.log('hi, I am get');
		return {message:'I am xyz',url: httpRequest.url};
	});

	post('/zzz', function() {
		console.log('I am zzz');
		return {message:'I am zzz'};
	});

	put('/{id}',function(id) {
		console.log('create',id);
		return {id:id};
	});

	del('/{name}/{type}', function(name, httpResponse, type) {
		return {
			name: name,
			type: type,
			res: typeof httpResponse
		}
	});
});
