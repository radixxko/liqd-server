'use strict';

const querystring = require('querystring');

const Request = module.exports = class Request
{
	constructor( request )
	{
		this._original_request = request;
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
