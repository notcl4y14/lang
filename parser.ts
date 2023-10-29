import { Token, TokenType } from "./token";
import { either } from "./utils/general";

export class Parser {
	public filename : string;
	public tokens : Token[];

	public constructor(filename: string, tokens: Token[]) {
		this.filename = filename;
		this.tokens = tokens;
	}

	// returns the token the parser is at
	public at() {
		// TODO: remove this because it wouldn't be able to get the last yum()-ed token
		// return EOF if the token is undefined
		if (this.tokens[0] == undefined) {
			return this.tokens[this.tokens.length];
		}

		return this.tokens[0];
	}

	// yums the first token, moving to the next one :P
	public yum() {
		var token = this.tokens.shift();

		// TODO: the same TODO as the previous one
		// return EOF if the token is undefined
		if (!token) {
			return this.tokens[this.tokens.length];
		}

		return token;
	}

	// checks if the parser has not reached the end of file
	public notEof() {
		return this.at().type != TokenType.EOF;
	}

	// ------------------------------------------------------------------------------------------

	// parses the tokens, this is obvious
	// but i commented this anyways because it somehow
	// makes my code look cleaner imo
	public parse() {
		return this.parseExpr();
	}

	// --------------------------------------------
	// Expressions
	// --------------------------------------------
	public parseExpr() {
		return this.parseAdditiveExpr();
	}

	// TODO: fix additive and mult expressions being ignored when using them again like 1 + 2 + 3 and 2 * 3 / 4
	// Additive Expression
	public parseAdditiveExpr() {
		var operators = ["+", "-"];
		var left = this.parseMultiplicativeExpr();

		while
			(this.notEof()
			&& this.at().type == TokenType.BinOp
			&& operators.includes(this.at().value)
		) {
			var operator = this.yum().value;
			var right = this.parseMultiplicativeExpr();

			return {
				type: "BinaryExpr",
				left, operator, right
			}
		}

		return left;
	}

	// Multiplicative Expression
	public parseMultiplicativeExpr() {
		var operators = ["*", "/", "%"];
		var left = this.parseLiteral();

		while
			(this.notEof()
			&& this.at().type == TokenType.BinOp
			&& operators.includes(this.at().value)
		) {
			var operator = this.yum();
			var right = this.parseLiteral();

			return {
				type: "BinaryExpr",
				left, operator, right
			}
		}

		return left;
	}

	// --------------------------------------------
	// Literals
	// --------------------------------------------
	public parseLiteral() {
		var token = this.yum();

		// NumericLiteral
		if (token.type == TokenType.Number) {
			return {
				type: "NumericLiteral",
				value: token.value
			}

		// StringLiteral
		} else if (token.type == TokenType.String) {
			return {
				type: "StringLiteral",
				value: token.value
			}

		// Identifier | Literals
		} else if (token.type == TokenType.Ident) {
			// Literal
			if (either(token.value, "undefined", "null", "true", "false")) {
				return {
					type: "Literal",
					value: token.value
				}
			}

			// Identifier
			return {
				type: "Identifier",
				value: token.value
			}
		}

		return this.tokens[this.tokens.length];
	}
}