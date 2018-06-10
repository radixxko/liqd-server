'use strict';

const fs = require('fs');
const util = require('util');
const async_hooks = require('async_hooks');

function LOG( str )
{
	fs.writeSync(1, str + '\n');
}

async_hooks.createHook(
{
	init( asyncId, type, triggerAsyncId )
	{
		LOG(`INIT  ${asyncId}, ${type}, ${triggerAsyncId}`);
	},

	before( asyncId )
	{
		LOG(`BEFORE  ${asyncId}`);
	}
})
.enable();

function tick()
{
	LOG( `tick eid ${async_hooks.executionAsyncId()} tid ${async_hooks.triggerAsyncId()}` );
}

function server()
{
	LOG( `server eid ${async_hooks.executionAsyncId()} tid ${async_hooks.triggerAsyncId()}` );

	setInterval( tick, 1000 );
}

setTimeout( server, 100 );
setTimeout( server, 300 );
