import { Token, TokenType } from "./token";
import { Position } from "./position";
let strings = require("./strings.json");

export class Lexer {
	public filename : string;
	public code : string;
	public pos : Position;

	public constructor(filename: string, code: string) {
		this.filename = filename;
		this.code = code;
		this.pos = new Position(filename, -1, 0, -1);

		this.yum();
	}

	// returns the character lexer is at
	public at(range: number = 1): string {
		return this.code.substr(this.pos.index, range);
	}

	// moves to the next character
	public yum(delta: number = 1): void {
		this.pos.advance(this.at(), delta);
	}

	// checks if lexer has not reached the end of file
	public notEof(): boolean {
		return this.pos.index < this.code.length;
	}

	// ------------------------------------------------------------------------------------------

	// makes an array of tokens from the code
	public tokenize(): Token[] {
		var tokens: Token[] = [];

		while (this.notEof()) {
			// Comment
			if (this.at(2) == "//") {
				tokens.push( this.makeComment() );
			// Multiline comments
			} else if (this.at(2) == "/*") {
				tokens.push( this.makeMultilineComment() );
			// Logical Operator
			} else if (strings.logical_op.includes(this.at(2))) {
				tokens.push( new Token(TokenType.LogicalOp, this.at(2), this.pos.clone()) );
				this.yum();
				
			// Comparison Operator
			} else if (strings.comparison_op[1].includes(this.at(2))) {
				tokens.push( new Token(TokenType.CompOp, this.at(2), this.pos.clone()) );
				this.yum();

			} else if (strings.comparison_op[0].includes(this.at())) {
				tokens.push( new Token(TokenType.CompOp, this.at(), this.pos.clone()) );
			
			// Operator
			} else if (strings.op.includes(this.at())) {
				tokens.push( new Token(TokenType.Operator, this.at(), this.pos.clone()) );
			// Symbol
			} else if (strings.symbols.includes(this.at())) {
				tokens.push( new Token(TokenType.Symbol, this.at(), this.pos.clone()) );
            // Paren
			} else if (strings.paren.includes(this.at())) {
				tokens.push( new Token(TokenType.Paren, this.at(), this.pos.clone()) );
            // Brackets
			} else if (strings.brackets.includes(this.at())) {
				tokens.push( new Token(TokenType.Bracket, this.at(), this.pos.clone()) );
            // Braces
			} else if (strings.braces.includes(this.at())) {
				tokens.push( new Token(TokenType.Brace, this.at(), this.pos.clone()) );
			// Number
			} else if (strings.digits.includes(this.at())) {
				tokens.push( this.makeNumber() );
			// String
			} else if (strings.quotes.includes(this.at())) {
				tokens.push( this.makeString() );
			// Ident
			} else if (strings.ident.includes(this.at())) {
				tokens.push( this.makeIdent() );
			}

			this.yum();
		}

		tokens.push( new Token(TokenType.EOF, null, this.pos.clone()) );

		return tokens;
	}

	// makes the comment token
	public makeComment(): Token {
		var posLeft = this.pos.clone();
		var str = "";

		// skip "//"
		this.yum(2);

		// while the character isn't \r\n
		while (this.notEof() && this.at(2) != "\r\n") {
			str += this.at();
			this.yum();
		}

		return new Token(TokenType.Comment, str, posLeft, this.pos.clone());
	}

	// makes the multiline comment token
	public makeMultilineComment(): Token {
		var posLeft = this.pos.clone();
		var str = "";

		// skip "/*"
		this.yum(2);

		// while the character isn't */
		while (this.notEof() && this.at(2) != "*/") {
			str += this.at();
			this.yum();
		}

		return new Token(TokenType.Comment, str, posLeft, this.pos.clone());
	}

	// makes the number token
	public makeNumber(): Token {
		var posLeft = this.pos.clone();
		var numStr = "";
		var float = false;

		// while the character is a digits or a dot
		while (this.notEof() && ( strings.digits.includes(this.at()) || this.at() == "." )) {
			// if a character is a dot
			if (this.at() == ".") {
				if (float) break;
				numStr += ".";
				float = true;
			// if a character is a digit
			} else {
				numStr += this.at();
			}

			this.yum();
		}

		// move back to the previous character
		this.yum(-1);

		// parse a number via parseFloat() if the number is float
		if (float)
			return new Token(TokenType.Number, parseFloat(numStr), posLeft, this.pos.clone());

		// otherwise parseInt() :P
		return new Token(TokenType.Number, parseInt(numStr), posLeft, this.pos.clone());
	}

	// makes the string token
	public makeString(): Token {
		var posLeft = this.pos.clone();
		var quote = this.at();
		var str = "";

		// skip the quote
		this.yum();

		// while the character is not the same quote as the one
		// at the beginning of the string
		while (this.notEof() && this.at() != quote) {
			str += this.at();
			this.yum();
		}

		return new Token(TokenType.String, str, posLeft, this.pos.clone());
	}

	// makes the identifier token
	public makeIdent(): Token {
		var posLeft = this.pos.clone();
		var ident = "";

		// while the character matches a-z, A-Z, _ or 1234567890
		while (this.notEof() && ( strings.ident.includes(this.at()) || strings.digits.includes(this.at()) )) {
			ident += this.at();
			this.yum();
		}

		// move back to the previous character
		this.yum(-1);

		// return a keyword token if the identifier is a keyword
		if (strings.keywords.includes(ident))
			return new Token(TokenType.Keyword, ident, posLeft, this.pos.clone());

		// otherwise return an identifier token :P
		return new Token(TokenType.Ident, ident, posLeft, this.pos.clone());
	}
}