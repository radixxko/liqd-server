module.exports = class URIPattern
{
	constructor( pattern )
	{
		this._parts = pattern.replace(/^\/|\/$/g,'').split('/').map( part =>
		{
			let captures = [], re = part
				.replace( /:[A-Za-z0-9_]+/g, ( m, i ) => m + ( part.length === i + m.length || part[i+m.length+1] !== '(' ? '(.+)' : '' ))
				.replace( /(:([A-Za-z0-9_]+)){0,1}(?<!\\)\(/g, ( m, _, c ) => { captures.push(c); return '('; } );

			captures = captures.map(( c, i ) => c && { name: c, index: i + 1 }).filter( Boolean );

			return { captures, re: new RegExp( '^'+re+'$' ) };
		});
	}

	match( uri )
	{
		if( typeof uri === 'string' ){ uri = uri.replace(/^\/|\/$/g,'').split('/'); }

		if( uri.length >= this._parts.length )
		{
			let captures = {}, match;

			for( let i = 0; i < this._parts.length; ++i )
			{
				if( !( match = uri[i].match( this._parts[i].re ) )){ return false; }

				for( let capture of this._parts[i].captures )
				{
					captures[ capture.name ] = decodeURIComponent( match[ capture.index ] || '' );
				}
			}

			return captures;
		}

		return false;
	}
}
