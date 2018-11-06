'use strict';

const Options = require('liqd-options');
const Readable = require('stream').Readable;

module.exports = class Response
{
	constructor( response )
	{
		this._response = response;
	}

	get response()
	{
		return this._response;
	}

	status( code )
	{
		this._response.statusCode = code;

		return this;
	}

	reply( code, data, type, callback )
	{
		if( typeof code !== 'number' ){[ code, data, type, callback ] = [ 200, code, data, type ]}
		if( typeof type === 'function' ){[ type, callback ] = [ undefined, type ]}
		if( !data ){ data = undefined; }

		//TODO check if response type is not set
		//TODO support for data isStream

		if( data && typeof data !== 'string' && !( data instanceof Buffer ) && !( data instanceof Readable ))
		{
			data = JSON.stringify( data );

			if( !type ){ type = 'application/json' }
		}

		if( !this._response.headersSent )
		{
			this._response.setHeader( 'Content-Type', type || 'text/plain' );
			this._response.writeHead( code );
		}

		if( data instanceof Readable )
		{
			data.pipe( this._response );

			if( callback ){ data.on( 'end', callback ); }
		}
		else
		{
			this._response.end( data, callback );
		}

		return this;
	}

	setHeader( name, value )
	{
		this._response.setHeader( name, value );

		return this;
	}

	writeHead( statusCode, statusMessage, headers )
	{
		this._response.writeHead( statusCode, statusMessage, headers );

		return this;
	}

	write( chunk, encoding, callback )
	{
		this._response.write( chunk, encoding, callback );

		return this;
	}

	end( data, encoding = undefined, callback = undefined )
	{
		this._response.end( data, encoding, callback );

		return this;
	}

	redirect( location, callback = undefined )
	{
		this._response.writeHead( 302, { 'Location' : location });
		this._response.end( callback );

		return this;
	}

	cookie( name, value, options = {})
	{
		if( !value )
		{
			value = '';
			options.expires = new Date(0);
		}

		options = Options( options,
		{
			domain	: { _type: 'string' },
			encode	: { _type: 'function', 	_default: encodeURIComponent },
			expires	: { _passes: $ => $ instanceof Date, _default: 0 },
			httpOnly: { _type: 'boolean',	_default: false },
			maxAge	: { _type: 'number' },
			path	: { _type: 'string', 	_default: '/' },
			secure	: { _type: 'boolean', 	_default: false },
			//signed	: { _type: 'boolean', 	_default: false },
			sameSite: { _type: ['boolean', 'string'], _default: false }
		});

		this._response.setHeader( 'Set-Cookie', name + '=' + options.encode( value ) +
			( options.maxAge 	? '; Max-Age=' + options.maxAge : '' ) +
			( options.domain 	? '; Domain=' + options.domain : '' ) +
			( options.path 		? '; Path=' + options.path : '' ) +
			( options.expires 	? '; Expires=' + options.expires.toUTCString() : '' ) +
			( options.httpOnly	? '; HttpOnly' : '' ) +
			( options.secure 	? '; Secure' : '' ) +
			( options.sameSite	? '; SameSite=' + ( options.sameSite === true ? 'Strict' : options.sameSite ) : '' )
		);

		return this;
	}

	set statusCode( code )
	{
		return this._response.statusCode = code;
	}

	set statusMessage( message )
	{
		return this._response.statusMessage = message;
	}

	get finished()
	{
		return this._response.finished;
	}
}
