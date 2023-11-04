import { Token, TokenType, TokenTypeStr } from "./token";
import { Error } from "./error";
import {
	newNode,
	Node,
	ProgramNode,
	NumericLiteralNode,
	IdentifierNode,
	StringLiteralNode,
	LiteralNode,
	IfStatementNode,
	ForStatementNode,
	WhileStatementNode,
	BlockStatementNode,
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
		var res = new ParseResult();
		var program = res.register(new ProgramNode());

		while (this.notEof()) {
			var _res = this.parseStmt();

			// if (!_res.error && this.at().type != TokenType.EOF)
				// return _res.failure(new Error(_res.node.pos, "An error that was called in the parse() function.\nI'm not sure what does it do yet"));
			if (_res.error)
				return _res;

			program.body.push(_res.node);
		}

		return res.success(program);
	}

	// --------------------------------------------
	// Statements
	// --------------------------------------------
	public parseStmt() {
		// VarDeclaration
		if (this.at().type == TokenType.Keyword && (this.at().value == "var" || this.at().value == "let")) {
			return this.parseVariableDeclaration();
		// IfStatement
		} else if (this.at().match(TokenType.Keyword, "if")) {
			return this.parseIfStatement();
		// ForStatement
		} else if (this.at().match(TokenType.Keyword, "for")) {
			return this.parseForStatement();
		// WhileStatement
		} else if (this.at().match(TokenType.Keyword, "while")) {
			return this.parseWhileStatement();
		}

		return this.parseExpr();
	}

	// VarDeclaration
	public parseVariableDeclaration() {
		var res = new ParseResult();

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

		return res.success(newNode(new VarDeclarationNode(ident, value), keyword.pos.left, value.pos.right));
	}

	// IfStatement
	public parseIfStatement(): any {
		var res = new ParseResult();

		var	condition,
			block,
			alternate;

		// keyword
		var keyword = res.register(this.yum());

		// condition
		condition = res.register(this.parseStmt());

		if (res.error)
			return res;

		// block
		block = res.register(this.parseBlockStatement());

		if (this.at().match(TokenType.Keyword, "else")) {
			this.yum();

			if (this.at().match(TokenType.Keyword, "if")) {
				alternate = res.register(this.parseIfStatement());
			} else {
				alternate = res.register(this.parseBlockStatement());
			}
		}

		return res.success(newNode(new IfStatementNode(condition, block, alternate), keyword.pos.left, block.pos.right));
	}

	// ForStatement
	public parseForStatement(): any {
		var res = new ParseResult();

		var	init,
			test,
			update,
			block;

		// keyword
		var keyword = res.register(this.yum());

		if (this.at().match(TokenType.Paren, "("))
			this.yum();

		// init
		init = res.register(this.parseStmt());

		if (res.error)
			return res;

		if (!this.at().match(TokenType.Symbol, ";"))
			return res.failure(new Error(this.at().pos.left, "Expected ';'"));

		this.yum();

		// if (init.type != "VarDeclaration")
			// return res.failure(new Error(init.pos.left, "Expected variable declaration"));

		// test
		test = res.register(this.parseStmt());

		if (res.error)
			return res;

		if (!this.at().match(TokenType.Symbol, ";"))
			return res.failure(new Error(this.at().pos.left, "Expected ';'"));

		this.yum();

		// update
		update = res.register(this.parseStmt());

		if (res.error)
			return res;

		if (this.at().match(TokenType.Paren, ")"))
			this.yum();

		// block
		block = res.register(this.parseBlockStatement());

		return res.success(newNode(new ForStatementNode(init, test, update, block), keyword.pos.left, block.pos.right));
	}

	// WhileStatement
	public parseWhileStatement(): any {
		var res = new ParseResult();

		var	test,
			block;

		// keyword
		var keyword = res.register(this.yum());

		if (this.at().match(TokenType.Paren, "("))
			this.yum();

		// test
		test = res.register(this.parseStmt());

		if (res.error)
			return res;

		if (this.at().match(TokenType.Paren, ")"))
			this.yum();

		// block
		block = res.register(this.parseBlockStatement());

		return res.success(newNode(new WhileStatementNode(test, block), keyword.pos.left, block.pos.right));
	}

	// BlockStatement
	public parseBlockStatement() {
		var res = new ParseResult();

		var body = [];

		// block
		if (!this.at().match(TokenType.Brace, "{"))
			return res.failure(new Error(this.at().pos.left, "Expected '{'"));

		var leftBrace = this.yum();

		while (this.notEof() && !this.at().match(TokenType.Brace, "}")) {
			body.push(res.register(this.parseStmt()));

			if (res.error)
				return res;
		}

		if (!this.at().match(TokenType.Brace, "}"))
			return res.failure(new Error(this.at().pos.left, "Expected '}'"));

		var rightBrace = this.yum();

		return res.success(newNode(new BlockStatementNode(body), leftBrace.pos.left, rightBrace.pos.right));
	}

	// --------------------------------------------
	// Expressions
	// --------------------------------------------
	public parseExpr() {
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