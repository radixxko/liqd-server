'use strict';

const querystring = require('querystring');

module.exports = class Request
{
	constructor( request )
	{
		this._request = request;
		this._sessions = {};
		this.url_query = {};

		let querystring_index = request.url.indexOf('?');

		if( querystring_index !== -1 )
		{
			try{ this.url_query = querystring.parse( request.url.substr( querystring_index + 1 ))}catch(e){}
		}

		this.query = Object.assign({}, this.url_query );
	}

	match( uri )
	{
		let capture = uri.match( this.url );

		if( capture )
		{
			this.query = Object.assign( capture, this.url_query );
		}

		return !!capture;
	}

	getHeader( name )
	{
		return this._request.headers[ name.toLowerCase() ];
	}

	get sessions()
	{
		return this._sessions;
	}

	get request()
	{
		return this._request;
	}

	get url()
	{
		return this._request.url;
	}

	get method()
	{
		return this._request.method;
	}

	get body()
	{
		return this._request.body;
	}

	get headers()
	{
		return this._request.headers;
	}
}
