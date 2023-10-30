import { Token, TokenType, TokenTypeStr } from "./token";
import { Error } from "./error";
import {
	newNode,
	Node,
	NumericLiteralNode,
	StringLiteralNode,
	LiteralNode,
	BinaryExprNode } from "./nodes";
import { either } from "./utils/general";

// checks for ParseResult error
// let checkError = function(res: ParseResult) {
	// if (res.error)
		// return res;
// }

export class ParseResult {
	public error: Error;
	public node: Node;

	public constructor() {
		this.error = null;
		this.node = null;
	}

	public register(res: any) {
		if (res instanceof ParseResult) {
			if (res.error)
				this.error = res.error;

			return res.node;
		}

		return res;
	}

	public success(node: Node) {
		this.node = node;
		return this;
	}

	public failure(error: Error) {
		this.error = error;
		return this;
	}
}

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
		var res = this.parseExpr();

		if (!res.error && this.at().type != TokenType.EOF)
			return res.failure(new Error(res.node.pos, "An error that was called in the parse() function.\nI'm not sure what does it do yet"));

		return res;
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
		var res = new ParseResult();
		var operators = ["+", "-"];
		var left = res.register(this.parseMultiplicativeExpr());

		if (res.error)
				return res;

		while
			(this.notEof()
			&& this.at().type == TokenType.BinOp
			&& operators.includes(this.at().value)
		) {
			var operator = this.yum().value;
			var right = res.register(this.parseMultiplicativeExpr());

			if (res.error)
				return res;

			return res.success(newNode(
				new BinaryExprNode(left.node, operator, right.node),
				left.node.pos, right.node.pos));
		}

		return res.success(left);
	}

	// Multiplicative Expression
	public parseMultiplicativeExpr() {
		var res = new ParseResult();
		var operators = ["*", "/", "%"];
		var left = res.register(this.parseLiteral());

		while
			(this.notEof()
			&& this.at().type == TokenType.BinOp
			&& operators.includes(this.at().value)
		) {
			var operator = this.yum().value;
			var right = res.register(this.parseLiteral());

			if (res.error)
				return res;

			return newNode(
				new BinaryExprNode(left.node, operator, right.node),
				left.node.pos, right.node.pos);
		}

		return left;
	}

	// --------------------------------------------
	// Literals
	// --------------------------------------------
	public parseLiteral() {
		var res = new ParseResult();
		var token = res.register(this.yum());

		// NumericLiteral
		if (token.type == TokenType.Number) {
			return res.success(newNode(
				new NumericLiteralNode(token.value),
				token.pos.left, token.pos.right));

		// StringLiteral
		} else if (token.type == TokenType.String) {
			return res.success(newNode(
				new StringLiteralNode(token.value),
				token.pos.left, token.pos.right));

		// Identifier | Literals
		} else if (token.type == TokenType.Ident) {
			// Literal
			if (either(token.value, "undefined", "null", "true", "false")) {
				return res.success(newNode(
					new LiteralNode(token.value),
					token.pos.left, token.pos.right));
			}

			// Identifier
			return res.success(newNode(
				new NumericLiteralNode(token.value),
				token.pos.left, token.pos.right));
		}

		// return newNode(new LiteralNode("undefined"), token.pos.left, token.pos.right);
		// console.log(token);

		// return an error
		var value = token.value;

		// if a token value is (null | undefined) then take its type instead
		if (!value)
			value = TokenTypeStr[token.type];

		return res.failure(new Error(token.pos.left, `Unexpected token '${value}'`));
	}
}