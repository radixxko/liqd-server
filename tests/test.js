'use strict';

var inits = [];

const Server = require('../lib/server');
const async_hooks = require('async_hooks');
async_hooks.createHook({ init( asyncId, type, triggerAsyncId ) { if( type != 'TickObject' ){ inits.push(`Inited  ${asyncId}, ${type}, ${triggerAsyncId}`); } } }).enable();

const server = new Server();

server.use( ( req, res, next ) =>
{
	console.log( 'Request: ' + req.url );
	console.log(`server.use eid ${async_hooks.executionAsyncId()} tid ${async_hooks.triggerAsyncId()}`);

	next();
})

.get( '/:janko/:hrasko-:marienka', ( req, res, next ) =>
{
	console.log( req.query );
	console.log(`server.get eid ${async_hooks.executionAsyncId()} tid ${async_hooks.triggerAsyncId()}`);

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
	console.log(`server.get eid ${async_hooks.executionAsyncId()} tid ${async_hooks.triggerAsyncId()}`);
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

function ayncHook()
{
	console.log(`ayncHook eid ${async_hooks.executionAsyncId()} tid ${async_hooks.triggerAsyncId()}`);
}

setInterval( ayncHook, 1000 );

setInterval( () =>
{
	if( inits.length )
	{
		let init;

		console.log(inits.join('\n'));
	}
}, 100);

server.listen(8080);
