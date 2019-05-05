'use strict';

const Options = require('liqd-options');
const EventEmitter = require('events');
const Request = require('./request');
const Response = require('./response');
const URIPattern = require('./helpers/uripattern');

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const isMethods = ( methods ) => ( typeof methods === 'string' && METHODS.includes( methods ) || ( Array.isArray( methods ) && !methods.filter( m => !METHODS.includes( m ))));
const isMiddlewares = ( middlewares ) => ( typeof middlewares === 'function' || ( Array.isArray( middlewares ) && middlewares.filter( m => typeof m === 'function' )));

/*

METHODS

checkout
copy
delete
get
head
lock
merge
mkactivity
mkcol
move
m-search
notify
options
patch
post
purge
put
report
search
subscribe
trace
unlock
unsubscribe

*/

const Server = module.exports = class Server extends EventEmitter
{
	constructor( options = {} )
	{
		super();

		this._options = Options( options,
		{
			tls		: { _required: false, _type: 'object' },
			frame	:
			{
				_expand	: true,

				mask	: { _type: 'boolean', _default: false },
				limit	: { _type: 'number', _default: 100 * 1024 * 1024, _convert: $ => Math.min( $, 100 * 1024 * 1024 )},
				compression	:
				{
					_default: false, _expand: true,

					treshold: { _type: 'number', _default: 1024 }
				}
			},
			client	:
			{
				_expand	: true,

				accept	: { _type: 'function' }
			}
		});

		this._router = [];
		this._routes = { GET: [], POST: [], PUT: [], PATCH: [], DELETE: [], WS: [] };
		this._sessions = {};
		this._server = require( this._options.tls ? 'https' : 'http' ).createServer( this._options.tls || undefined );
		this._websocket_server = null;

		this._server.on( 'request', ( request, response ) =>
		{
			let chunks = [];

			request.on( 'data', chunk => chunks.push( chunk ));
			request.on( 'end', () =>
			{
				request.body = Buffer.concat( chunks );

				try{ request.body = JSON.parse( request.body.toString('utf8')); }catch(e){}

				this._route( new Request( request ), new Response( response ), this._routes[ request.method ]);
			});
		});

		this._server.on( 'error', error => this.emit( 'error', error ));
	}

	static get Session()
	{
		return require('liqd-session');
	}

	_route( request, response, router, router_offset = 0, middleware_offset = 0 )
	{
		if( router )
		{
	  		for( ; router_offset < router.length; ++router_offset && ( middleware_offset = 0 ))
	  		{
	  			let rule = this._router[router[router_offset]];

	  			if( middleware_offset === 0 )
	  			{
	  				middleware_offset = rule.middlewares.length;

	  				for( let route of rule.routes )
	  				{
	  					if( request.match( route ))
	  					{
	  						middleware_offset = 0; break;
	  					}
	  				}
	  			}

	  			if( middleware_offset < rule.middlewares.length )
	  			{
	  				return rule.middlewares[middleware_offset]( request, response, ( next ) =>
	  				{
	  					this._route( request, response, router, next === 'route' ? router_offset + 1 : router_offset, next === 'route' ? 0 : middleware_offset + 1 );
	  				});
	  			}
	  		}
		}

		if( request.method === 'OPTIONS' )
		{
			response.writeHead( 200, 'OK',
			{
				'Allow': 'OPTIONS, GET, HEAD, POST',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Request-Method': 'POST',
				'Access-Control-Request-Headers': 'X-PINGOTHER, Content-Type'
			})
			.end();
		}
		else
		{
			if( response instanceof Response )
			{
				response.reply( 404, 'Not found' );
			}
			else
			{
				response.end ? response.end() : response.close();
			}
		}
	}

	_registerRoutes( methods, routes, middlewares, options )
	{
		if( isMiddlewares( routes )){[ routes, middlewares, options ] = [ '/', routes, middlewares ]}
		if( !Array.isArray( routes )){ routes = [ routes ]}
		if( !Array.isArray( middlewares )){ middlewares = [ middlewares ]}

		let router = this._router.length;
		this._router.push(
		{
			methods,
			routes: routes.map( route => new URIPattern( route )),
			middlewares,
			options
		});

		for( let method of methods )
		{
			this._routes[method].push( router );
		}

		return this;
	}

	/*static( route, middleware, options )
	{

	}*/

	get( routes, middlewares, options ){ return this._registerRoutes( ['GET'], routes, middlewares, options ); }
	post( routes, middlewares, options ){ return this._registerRoutes( ['POST'], routes, middlewares, options ); }
	put( routes, middlewares, options ){ return this._registerRoutes( ['PUT'], routes, middlewares, options ); }
	patch( routes, middlewares, options ){ return this._registerRoutes( ['PATCH'], routes, middlewares, options ); }
	delete( routes, middlewares, options ){ return this._registerRoutes( ['DELETE'], routes, middlewares, options ); }

	use( methods, routes, middlewares, options )
	{
		if( !isMethods( methods )){[ methods, routes, middlewares, options ] = [ METHODS, methods, routes, middlewares ]}
		else if( !Array.isArray( methods )){ methods = [ methods ]}

		return this._registerRoutes( methods, routes, middlewares, options );
	}

	session( methods, routes, name, options )
	{
		const Session = require('liqd-session');

		if( !isMethods( methods )){[ methods, routes, name, options ] = [ METHODS, methods, routes, name ]}
		else if( !Array.isArray( methods )){ methods = [ methods ]}

		if( typeof name !== 'string' ){[ routes, name, options ] = [ '/', routes, name ]}

		if( !this._sessions.hasOwnProperty( name ))
		{
			this._sessions[name] = new Server.Session( name, options );
		}

		return this._registerRoutes( methods, routes, ( req, res, next ) =>
		{
			if( !req.sessions.hasOwnProperty( name ))
			{
				( req.sessions[name] = this._sessions[name] ).start({ req, res }, next );
			}
			else{ next(); }
		});
	}

	ws( routes, middlewares, options )
	{
		if( isMiddlewares( routes )){[ routes, middlewares, options ] = [ '/', routes, middlewares ]}
		if( !Array.isArray( middlewares )){ middlewares = [ middlewares ]}

		middlewares = middlewares.map( m => ( request, client, next ) => m( client, request, next ));

		if( !this._websocket_server )
		{
			this._websocket_router = [];
			this._websocket_server = new (require('liqd-websocket')).Server(
			{
				server: this._server,
				frame: this._options.frame,
				client:
				{
					accept: async( request, socket ) =>
					{
						if( !this._options.client.accept || await this._options.client.accept( request, socket ))
						{
							let uri = request.url.replace(/\?.*$/,'').replace(/^\/|\/$/g,'').split('/');

							if( this._routes.WS.find( r => this._router[r].routes.find( r => r.match( uri ))))
							{
								return true;
							}
						}

						return false;
					}
				}
			});

			this._websocket_server.on( 'client', ( client, request ) =>
			{
				this._route( new Request( request ), client, this._routes.WS );
			});

			this._websocket_server.on( 'error', error => this.emit( 'error', error ));
		}

		return this._registerRoutes( ['WS'], routes, middlewares, options );
	}

	listen( port, callback )
	{
		this._server.listen( port, callback );

		return this;
	}

	close( callback )
	{
		return this._server.close( callback );
	}

	get server()
	{
		return this._server;
	}
}
