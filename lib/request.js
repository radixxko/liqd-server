'use strict';

const Request = module.exports = class Request
{
	constructor( request )
	{
		if( request instanceof Request )
		{
			this._original_request = request._original_request;
		}
		else
		{
			this._original_request = request;
		}

		this.query = {};
	}

	_match( uri, query )
	{
		let match = (this.url+'/').match( uri );

		if( match && query && query.length ){ for( let i = 0; i < query.length; ++i )
		{
			this.query[ query[i] ] = decodeURIComponent( match[i+1] );
		}}

		return ( match !== null );
	}

	get url()
	{
		return this._original_request.url;
	}

	get method()
	{
		return this._original_request.method;
	}
}
