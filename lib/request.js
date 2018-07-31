'use strict';

const querystring = require('querystring');

const Request = module.exports = class Request
{
	constructor( request )
	{
		if( request instanceof Request )
		{
			this._original_request = request._original_request;
			this.url_query = request.url_query;
		}
		else
		{
			this._original_request = request;
			this.url_query = {};

			let querystring_index = request.url.indexOf('?');

			if( querystring_index !== -1 )
			{
				try{ this.url_query = querystring.parse( request.url.substr( querystring_index + 1 ))}catch(e){}
			}
		}

		this.query = Object.assign({}, this.url_query );
	}

	_match( uri, query )
	{
		let match = (this.url.replace(/\?.*$/,'')+'/').match( uri );

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

	get body()
	{
		return this._original_request.body;
	}
}
