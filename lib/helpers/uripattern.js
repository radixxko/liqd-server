module.exports = class URIPattern
{
	constructor( pattern )
	{
		if( pattern instanceof RegExp )
		{
			this._match = pattern;
		}
		else
		{
			this._match = pattern.replace(/^\/|\/$/g,'').split('/').filter( Boolean ).map( part =>
			{
				let captures = [], re = part
					.replace( /:[A-Za-z0-9_]+/g, ( m, i ) => m + ( part.length === i + m.length || part[i+m.length] !== '(' ? '(.+)' : ''  ))
					.replace( /(:([A-Za-z0-9_]+)){0,1}(?<!\\)\(/g, ( m, _, c ) => { captures.push(c); return '('; } );

				captures = captures.map(( c, i ) => c && { name: c, index: i + 1 }).filter( Boolean );

				return { captures, re: new RegExp( '^'+re+'$' ) };
			});
		}
	}

	match( uri )
	{
		if( this._match instanceof RegExp )
		{
			if( typeof uri === 'string' ){ uri = '/' + uri.replace(/^\/|\/$/g,''); }
			else{ uri = '/'+uri.join('/'); }

			return this._match.test( uri ) ? {} : false;
		}
		else
		{
			if( typeof uri === 'string' ){ uri = uri.replace(/^\/|\/$/g,'').split('/'); }

			if( uri.length >= this._match.length )
			{
				let captures = {}, match;

				for( let i = 0; i < this._match.length; ++i )
				{
					if( !( match = uri[i].match( this._match[i].re ) )){ return false; }

					for( let capture of this._match[i].captures )
					{
						captures[ capture.name ] = decodeURIComponent( match[ capture.index ] || '' );
					}
				}

				return captures;
			}
		}

		return false;
	}
}
