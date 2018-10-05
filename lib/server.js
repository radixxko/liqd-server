'use strict';

const Options = require('liqd-options');
const EventEmitter = require('events');
const Request = require('./request');
const URIPattern = require('./helpers/uripattern');

module.exports = class Server extends EventEmitter
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

		this._server = require( this._options.tls ? 'https' : 'http' ).createServer( this._options.tls || undefined, this._dispatch.bind(this) );
		this._router = [];
		this._websocket_server = null;
		this._websocket_router = null;

		this._server.on( 'error', error => this.emit( 'error', error ));
	}

	_dispatch( request, response )
	{
		let chunks = [];

		request.on( 'data', chunk => chunks.push( chunk ));
		request.on( 'end', () =>
		{
			request.body = Buffer.concat( chunks ).toString('utf8');

			try{ request.body = JSON.parse(request.body); }catch(e){}

			this._route( new Request( request ), response );
		});
	}

	_route( request, response, route_offset = 0 )
	{
		//TODO: mozno spravit aj polia pre jednotlive typy requestov nech sa rovno preskakuju nezmyselnosti
		//TODO: mali by sme nejako pozerat referencie na request, response ci sa nam nevytratili a ked hej ukoncit 503 Service Temporarily Unavailable

		for( let i = route_offset; i < this._router.length; ++i )
		{
			let route = this._router[i];

			if(( !route.method || route.method == request.method ) && request.match( route.uri ))
			{
				return route.middleware( request, response, this._route.bind( this, request, response, i + 1 ));
			}
		}

		response.end( 'Not found' ); //.status(404)
	}

	_registerRoute( method, route, middleware, options )
	{
		if( typeof route === 'function' )
		{
			options = middleware; middleware = route; route = '/';
		}

		this._router.push({ method, uri: new URIPattern( route ), middleware, options });

		return this;
	}

	static( route, middleware, options )
	{

	}

	// TODO route Array

	use( route, middleware, options ){ return this._registerRoute( undefined, route, middleware, options ); }
	get( route, middleware, options ){ return this._registerRoute( 'GET', route, middleware, options ); }
	post( route, middleware, options ){ return this._registerRoute( 'POST', route, middleware, options ); }
	put( route, middleware, options ){ return this._registerRoute( 'PUT', route, middleware, options ); }
	patch( route, middleware, options ){ return this._registerRoute( 'PATCH', route, middleware, options ); }
	delete( route, middleware, options ){ return this._registerRoute( 'DELETE', route, middleware, options ); }

	_route_websocket_client( client, request, route_offset = 0 )
	{
		for( let i = route_offset; i < this._websocket_router.length; ++i )
		{
			let route = this._websocket_router[i];

			if( request.match( route.uri ))
			{
				return route.middleware( client, request, this._route_websocket_client.bind( this, client, request, i + 1 ));
			}
		}

		client.close();
	}

	ws( route, middleware, options )
	{
		if( typeof route === 'function' )
		{
			options = middleware; middleware = route; route = '/';
		}

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
							let uri = request.url.replace(/^\/|\/$/g,'').split('/');

							if( this._websocket_router.find( r => r.uri.match( uri ) ))
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
				this._route_websocket_client( client, new Request( request ));
			});

			this._websocket_server.on( 'error', error => this.emit( 'error', error ));
		}

		this._websocket_router.push({ uri: new URIPattern( route ), middleware, options });

		return this;
	}

	listen( port )
	{
		this._server.listen( port );

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
