'use strict';

var inits = [];

const Server = require('../lib/server');

const server = new Server();

server.use( ( req, res, next ) =>
{
	console.log( 'Request: ' + req.url );

	next();
})
.get( '/.*-p:id(\\d+)', ( req, res, next ) =>
{
	console.log( '/', req.query );

	let html =
	`<!DOCTYPE html>
	<html>
		<head>
		</head>
		<body>
			Product ${JSON.stringify(req.query)}<br />
			<input type="button" onclick="location.href='/'" value="Detail" />
		</body>
	</html>`

	res.end( html );
})
.get( '/:janko/:hrasko-:marienka', ( req, res, next ) =>
{
	console.log( '/:janko/:hrasko-:marienka', req.query );

	let html =
	`<!DOCTYPE html>
	<html>
		<head>
		</head>
		<body>
			Hello ${JSON.stringify(req.query)}<br />
			<input type="button" onclick="location.href='/'" value="Detail" />
		</body>
	</html>`

	res.end( html );
})
.get( '/', ( req, res, next ) =>
{
	console.log( '/', req.query );

	let html =
	`<!DOCTYPE html>
	<html>
		<head>
		</head>
		<body>
			Index<br />
			<input type="button" onclick="location.href='/janko/hrasko-marienka'" value="Detail" />
		</body>
	</html>`

	res.end( html );
});

server.listen(8080);
