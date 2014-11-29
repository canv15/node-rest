resource('/hello', function(){
	get('', function() {
		console.log('sdfsdfdsf');
		return {info: 'This is hello message'};
	});
});
