'use strict';

const Request = require('./request');

module.exports = class Server
{
	constructor()
	{
		this.server = require('http').createServer( this._dispatch.bind(this) );
		this.router = [];
	}

	_dispatch( req, res )
	{
		const request = new Request( req );

		this._route( request, res );
	}

	_route( request, response, route_offset = 0 )
	{
		//TODO: mozno spravit aj polia pre jednotlive typy requestov nech sa rovno preskakuju nezmyselnosti
		//TODO: mali by sme nejako pozerat referencie na request, response ci sa nam nevytratili a ked hej ukoncit 503 Service Temporarily Unavailable

		for( let i = route_offset; i < this.router.length; ++i )
		{
			let route = this.router[i];

			if(( !route.method || route.method == request.method ) && request._match( route.uri, route.query ))
			{
				return this.router[i].middleware( request, response, this._next.bind( this, request, response, i ));
			}
		}

		response.end( 'Not found' ); //.status(404)
	}

	_next( request, response, route_offset )
	{
		this._route( new Request( request ), response, route_offset + 1 );
	}

	_registerRoute( method, route, middleware, options )
	{
		if( typeof route === 'function' )
		{
			options = middleware; middleware = route; route = '/';
		}

		let query = [];
		let uri = new RegExp(('^'+route.replace(/^\^+|\/+$/g,'')+'/').replace(/\/+/g,'/').replace(/:([^-\/]+)/g, ( url, parameter ) =>
		{
			query.push( parameter ); return '([^-/]+)';
		}));

		this.router.push({ method, uri, query, middleware, options });

		return this;
	}

	static( route, middleware, options )
	{

	}

	use( route, middleware, options ){ return this._registerRoute( undefined, route, middleware, options ); }
	get( route, middleware, options ){ return this._registerRoute( 'GET', route, middleware, options ); }
	post( route, middleware, options ){ return this._registerRoute( 'POST', route, middleware, options ); }

	listen( port )
	{
		this.server.listen( port );

		return this;
	}
}
