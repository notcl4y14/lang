import { Token, TokenType, TokenTypeStr } from "./token";
import { Error } from "./error";
import {
	newNode,
	Node,
	NumericLiteralNode,
	IdentifierNode,
	StringLiteralNode,
	LiteralNode,
	VarDeclarationNode,
	VarAssignmentNode,
	UnaryExprNode,
	LogicalExprNode,
	BinaryExprNode } from "./nodes";
import { either } from "./utils/general";

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
		var res = new ParseResult();

		// VarDeclaration
		if (this.at().type == TokenType.Keyword && (this.at().value == "var" || this.at().value == "let")) {
			// keyword
			var keyword = res.register(this.yum());

			// identifier
			if (this.at().type != TokenType.Ident)
				return res.failure(new Error(this.at().pos.left, "Expected Identifier"));

			var ident = res.register(this.yum().value);

			// TODO: support for variables that don't have a specified value yet
			if (!this.at().match(TokenType.Symbol, "=")) {
				return res.failure(new Error(this.at().pos.left, "Expected '='"));
			}

			res.register(this.yum());

			// value
			var value = res.register(this.parseExpr());

			if (res.error)
				return res;

			return res.success(newNode(new VarDeclarationNode(ident, value), keyword.pos.left, keyword.pos.right));
		}

		return this.parseLogicalExpr();
	}

	// Logical Expression
	public parseLogicalExpr() {
		var res = new ParseResult();
		var left = res.register(this.parseCompExpr());

		if (res.error)
			return res;

		while (this.notEof() && this.at().type == TokenType.LogicalOp) {
			var operator = this.yum().value;
			var right = res.register(this.parseCompExpr());

			if (res.error)
				return res;

			return res.success(newNode(
				new LogicalExprNode(left, operator, right),
				left.pos, right.pos));
		}

		return res.success(left);
	}

	// Comparison Expression
	public parseCompExpr() {
		var res = new ParseResult();
		var left = res.register(this.parseAdditiveExpr());

		if (res.error)
			return res;

		while (this.notEof() && this.at().type == TokenType.CompOp) {
			var operator = this.yum().value;
			var right = res.register(this.parseAdditiveExpr());

			if (res.error)
				return res;

			return res.success(newNode(
				new BinaryExprNode(left, operator, right),
				left.pos, right.pos));
		}

		return res.success(left);
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
			&& this.at().type == TokenType.Operator
			&& operators.includes(this.at().value)
		) {
			var operator = this.yum().value;
			var right = res.register(this.parseMultiplicativeExpr());

			if (res.error)
				return res;

			return res.success(newNode(
				new BinaryExprNode(left, operator, right),
				left.pos, right.pos));
		}

		return res.success(left);
	}

	// Multiplicative Expression
	public parseMultiplicativeExpr() {
		var res = new ParseResult();
		var operators = ["*", "/", "%"];
		var left = res.register(this.parseLiteral());

		if (res.error)
			return res;

		while
			(this.notEof()
			&& this.at().type == TokenType.Operator
			&& operators.includes(this.at().value)
		) {
			var operator = this.yum().value;
			var right = res.register(this.parseLiteral());

			if (res.error)
				return res;

			return res.success(newNode(
				new BinaryExprNode(left, operator, right),
				left.pos, right.pos));
		}

		return res.success(left);
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

			// VarAssignment
			if (this.at().match(TokenType.Symbol, "=")) {
				res.register(this.yum());
				var value = res.register(this.parseExpr());

				if (res.error)
					return res;

				return res.success(newNode(new VarAssignmentNode(token.value, value), token.pos.left, token.pos.right));
			}

			// Identifier
			return res.success(newNode(
				new IdentifierNode(token.value),
				token.pos.left, token.pos.right));

		// ------------------------------------------------------------------------------------------

		// UnaryExpr
		} else if (token.match(TokenType.Operator, "-") || token.match(TokenType.Operator, "!")) {
			var node = res.register(this.parseLiteral());

			if (res.error)
				return res;

			return res.success(newNode(
				new UnaryExprNode(token.value, node),
				token.pos.left, token.pos.right));

		// Parenthesised expression
		} else if (token.match(TokenType.Paren, "(")) {
			var node = res.register(this.parseExpr());

			if (res.error)
				return res;

			if (this.at().match(TokenType.Paren, ")")) {
				res.register(this.yum());
				return res.success(node);
			}

			return res.failure(new Error(this.at().pos.left, "Expected ')'"));
		}

		// return an error
		var value = token.value;

		// if a token value is (null | undefined) then take its type instead
		if (!value)
			value = TokenTypeStr[token.type];

		return res.failure(new Error(token.pos.left, `Unexpected token '${value}'`));
	}
}