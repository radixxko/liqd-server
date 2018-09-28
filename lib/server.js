'use strict';

const Request = require('./request');
const URIPattern = require('./helpers/uripattern');

module.exports = class Server
{
	constructor()
	{
		this.server = require('http').createServer( this._dispatch.bind(this) );
		this.router = [];
	}

	_dispatch( req, res )
	{
		let chunks = [];

		req.on( 'data', chunk => chunks.push( chunk ));
		req.on( 'end', () =>
		{
			req.body = Buffer.concat( chunks ).toString('utf8');

			try{ req.body = JSON.parse(req.body); }catch(e){}

			const request = new Request( req );

			this._route( request, res );
		});
	}

	_route( request, response, route_offset = 0 )
	{
		//TODO: mozno spravit aj polia pre jednotlive typy requestov nech sa rovno preskakuju nezmyselnosti
		//TODO: mali by sme nejako pozerat referencie na request, response ci sa nam nevytratili a ked hej ukoncit 503 Service Temporarily Unavailable

		for( let i = route_offset; i < this.router.length; ++i )
		{
			let route = this.router[i];

			if(( !route.method || route.method == request.method ) && request.match( route.uri ))
			{
				return this.router[i].middleware( request, response, this._route.bind( this, request, response, i + 1 ));
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

		this.router.push({ method, uri: new URIPattern( route ), middleware, options });

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

	listen( port )
	{
		this.server.listen( port );

		return this;
	}
}
