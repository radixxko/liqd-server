'use strict';

var inits = [];

const Websocket = require('liqd-websocket');

const Server = require('../lib/server');

const server = new Server();

const session = new Server.Session( 'advertisement', { storage: { directory: __dirname + '/sessions' }});

server.use( 'GET',
[
	( req, res, next ) =>
	{
		console.log('middleware 1');

		next();
	},
	( req, res, next ) =>
	{
		console.log('middleware 2');

		next('route');
	},
	( req, res, next ) =>
	{
		console.log('middleware 3');

		next();
	}
]);

server.use( /^.*\.txt$/, ( req, res, next ) =>
{
	console.log('REGEXP match');

	next();
});

server.session( 'GET', '/:test', 'device', { storage: { directory: __dirname + '/sessions' }});
server.session( 'device', { storage: { directory: __dirname + '/sessions' }});

server.use( ( req, res, next ) =>
{
	session.start( { req, res }, () =>
	{
		console.log( 'Request: ' + req.url );
		console.log( req.headers );
		console.log({ cookie: req.getHeader('Cookie') });

		res.cookie( 'janko', 'hrachon' );

		req.sessions.device.set( 'key', 'value' );

		console.log( { sessions: req.sessions });

		next();
	});
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
.get( '/', async( req, res, next ) =>
{
	console.log( 'Hash is ' + await session.get( 'hash' ));
	session.set( 'hash', 'test' );
	console.log( '/', req.query, LIQD_FLOW.scope() );

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
})
.ws( '/client', ( client, req, next ) =>
{
	console.log('client');
})
.ws( '/token', ( client, req, next ) =>
{
	console.log('token');

	client.on( 'message', message =>
	{
		console.log( 'Server received', message );
	});
})
.ws( '/:type', ( client, req, next ) =>
{
	console.log('first', req.query );

	client.on( 'message', message =>
	{
		console.log( 'Server received', message );
	});
})
.ws( '/', ( client, req, next ) =>
{
	console.log('second');

	client.on( 'message', message =>
	{
		console.log( 'Server received', message );
	});
});;/**/

server.listen(8080);

let client = new Websocket.Client('ws://localhost:8080/test');

client.on( 'open', () =>
{
	client.send( 'Hello' );
});

client.on( 'close', () =>
{
	console.log('Client CLOSED');
});

client.on( 'error', ( error ) =>
{
	console.log('Client ERROR', error);
});
