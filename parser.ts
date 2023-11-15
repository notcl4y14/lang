import { Token, TokenType, TokenTypeStr } from "./token";
import { Position } from "./position";
import { Error } from "./error";
import * as nodes from "./nodes";
import { either } from "./utils/general";

export class ParseResult {
	public error: Error;
	public node: nodes.Node;

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

	public success(node: nodes.Node) {
		this.node = node;
		return this;
	}

	public failure(pos: Position, details: string) {
		this.error = new Error(pos, details);
		return this;
	}
}

export class Parser {
	public filename : string;
	public tokens : Token[];
	public pos: number;

	public constructor(filename: string, tokens: Token[]) {
		this.filename = filename;
		this.tokens = tokens;
		this.pos = -1;

		this.yum();
	}

	// returns the token the parser is at
	public at(range: number = 0) {
		return this.tokens[this.pos + range];
	}

	// ------------------------------------------------------------------------------------------

	// this.at().match
	public atMatches(type: TokenType, value: any, at: Token = this.at()) {
		return at.match(type, value);
	}

	// this.at().pos
	public atPos(at: Token = this.at()) {
		return at.pos;
	}

	// this.at().type
	public atType(at: Token = this.at()) {
		return at.type;
	}

	// this.at().value
	public atValue(at: Token = this.at()) {
		return at.value;
	}

	// ------------------------------------------------------------------------------------------

	// moves to the next token :P
	public yum(delta: number = 1) {
		this.pos += delta;
		return this.at(-1);
	}

	// checks if the parser has not reached the end of file
	public notEof() {
		return this.atType() != TokenType.EOF;
	}

	// ------------------------------------------------------------------------------------------

	// parses the tokens, this is obvious
	// but i commented this anyways because it somehow
	// makes my code look cleaner imo
	public parse() {
		var res = new ParseResult();
		var program = res.register(new nodes.ProgramNode());

		while (this.notEof()) {
			var result = this.parseStmt();
			if (result.error) return result;

			program.body.push(result.node);
		}

		return res.success(program);
	}

	// --------------------------------------------
	// Miscellaneous
	// --------------------------------------------
	public parseArguments(
		separator: {type: TokenType, value: any} = {type: TokenType.Symbol, value: ","},
		closingToken: {type: TokenType, value: any} = {type: TokenType.Paren, value: ")"})
	{
		var res = new ParseResult();
		var args = [];

		while (this.notEof() && !this.atMatches(closingToken.type, closingToken.value)) {
			var value = res.register(this.parseExpr());
			if (res.error) return res;

			args.push(value);

			if (!this.atMatches(separator.type, separator.value) && !this.atMatches(closingToken.type, closingToken.value))
				return res.failure(this.atPos().right, `Expected '${separator.value}' or '${closingToken.value}'`);

			if (this.atMatches(closingToken.type, closingToken.value)) {
				this.yum();
				break;
			}
		}

		// if (this.atMatches(closingToken.type, closingToken.value))
			// this.yum();

		return res.register(args);
	}

	// --------------------------------------------
	// Statements
	// --------------------------------------------
	public parseStmt() {
		// VarDeclaration
		if (this.atType() == TokenType.Keyword && (this.atValue() == "var" || this.atValue() == "let")) {
			return this.parseVariableDeclaration();
		// IfStatement
		} else if (this.atMatches(TokenType.Keyword, "if")) {
			return this.parseIfStatement();
		// ForStatement
		} else if (this.atMatches(TokenType.Keyword, "for")) {
			return this.parseForStatement();
		// WhileStatement
		} else if (this.atMatches(TokenType.Keyword, "while")) {
			return this.parseWhileStatement();
		// ReturnStatement
		} else if (this.atMatches(TokenType.Keyword, "return")) {
			return this.parseReturnStatement();
		}

		return this.parseExpr();
	}

	// VarDeclaration
	public parseVariableDeclaration() {
		var res = new ParseResult();

		// keyword
		var keyword = res.register(this.yum());

		// identifier
		if (this.atType() != TokenType.Ident)
			return res.failure(this.atPos().right, "Expected Identifier");

		var ident = res.register(this.yum());

		// TODO: support for variables that don't have a specified value yet
		if (!this.atMatches(TokenType.Symbol, "=")) {
			return res.failure(this.atPos().right, "Expected '='");
		}

		res.register(this.yum());

		// value
		var value = res.register(this.parseExpr());

		if (res.error)
			return res;

		var leftPos = keyword.pos.left;
		var rightPos = value.pos.right;

		return res.success(new nodes.VarDeclarationNode(ident, value).setPos(leftPos, rightPos));
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

		if (this.atMatches(TokenType.Keyword, "else")) {
			this.yum();

			if (this.atMatches(TokenType.Keyword, "if")) {
				alternate = res.register(this.parseIfStatement());
			} else {
				alternate = res.register(this.parseBlockStatement());
			}
		}

		var leftPos = keyword.pos.left;
		var rightPos = block.pos.right;

		return res.success(new nodes.IfStatementNode(condition, block, alternate).setPos(leftPos, rightPos));
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

		if (this.atMatches(TokenType.Paren, "("))
			this.yum();

		// init
		init = res.register(this.parseStmt());

		if (res.error)
			return res;

		if (!this.atMatches(TokenType.Symbol, ";"))
			return res.failure(this.atPos().right, "Expected ';'");

		this.yum();

		// test
		test = res.register(this.parseStmt());

		if (res.error)
			return res;

		if (!this.atMatches(TokenType.Symbol, ";"))
			return res.failure(this.atPos().right, "Expected ';'");

		this.yum();

		// update
		update = res.register(this.parseStmt());

		if (res.error)
			return res;

		if (this.atMatches(TokenType.Paren, ")"))
			this.yum();

		// block
		block = res.register(this.parseBlockStatement());

		var leftPos = keyword.pos.left;
		var rightPos = block.pos.right;

		return res.success(new nodes.ForStatementNode(init, test, update, block).setPos(leftPos, rightPos));
	}

	// WhileStatement
	public parseWhileStatement(): any {
		var res = new ParseResult();

		var	test,
			block;

		// keyword
		var keyword = res.register(this.yum());

		if (this.atMatches(TokenType.Paren, "("))
			this.yum();

		// test
		test = res.register(this.parseStmt());

		if (res.error)
			return res;

		if (this.atMatches(TokenType.Paren, ")"))
			this.yum();

		// block
		block = res.register(this.parseBlockStatement());

		var leftPos = keyword.pos.left;
		var rightPos = block.pos.right;

		return res.success((new nodes.WhileStatementNode(test, block).setPos(leftPos, rightPos)));
	}

	// ReturnStatement
	public parseReturnStatement() {
		var res = new ParseResult();
		var keyword = this.yum();
		var argument = res.register(this.parseExpr());
		if (res.error) return res;

		var leftPos = keyword.pos.left;
		var rightPos = argument.pos.right;

		return res.success(
			new nodes.ReturnStatementNode(argument)
				.setPos(leftPos, rightPos));
	}

	// BlockStatement
	public parseBlockStatement() {
		var res = new ParseResult();

		var body = [];

		// block
		if (!this.atMatches(TokenType.Brace, "{"))
			return res.failure(this.atPos().right, "Expected '{'");

		var leftBrace = this.yum();

		while (this.notEof() && !this.atMatches(TokenType.Brace, "}")) {
			body.push(res.register(this.parseStmt()));

			if (res.error)
				return res;
		}

		if (!this.atMatches(TokenType.Brace, "}"))
			return res.failure(this.atPos().right, "Expected '}'");

		var rightBrace = this.yum();

		var leftPos = leftBrace.pos.left;
		var rightPos = rightBrace.pos.right;

		return res.success(new nodes.BlockStatementNode(body).setPos(leftPos, rightPos));
	}

	// --------------------------------------------
	// Expressions
	// --------------------------------------------
	public parseExpr() {
		// FunctionDeclaration
		if (this.atMatches(TokenType.Keyword, "function")) {
			return this.parseFunctionDeclaration();
		}

		return this.parseLogicalExpr();
	}

	/**
	 * Why is function declaration node
	 * parsed as an expression?
	 * Well, I thought of how could you
	 * declare an anonymous function
	 * in the variable declaration statement
	 * like "let x = function() {}"
	 * when it searches for expressions?
	**/

	// FunctionDeclaration
	public parseFunctionDeclaration() {
		var res = new ParseResult();

		var name: string;
		var params: nodes.IdentifierNode[] = [];
		var block: nodes.BlockStatementNode;

		// keyword
		var keyword = this.yum();

		// Anonymous function : function() {}
		if (this.atMatches(TokenType.Paren, "(")) {
			this.yum();
			
			params = res.register(this.parseArguments());
			if (res.error) return res;

		// Non-anonymous function : function x() {}
		} else {
			// name = res.register(this.parseExpr());
			// if (res.error) return res;
			name = this.yum().value;

			if (!this.atMatches(TokenType.Paren, "("))
				return res.failure(this.atPos().right, "Expected '('");

			this.yum();

			params = res.register(this.parseArguments());
			if (res.error) return res;
		}

		// block
		block = res.register(this.parseBlockStatement());
		if (res.error) return res;

		var leftPos = keyword.pos.left;
		var rightPos = block.pos.right;

		return res.success(
			new nodes.FunctionDeclarationNode(name, params, block)
				.setPos(leftPos, rightPos))
	}

	// Logical Expression
	public parseLogicalExpr() {
		var res = new ParseResult();
		var left = res.register(this.parseCompExpr());

		if (res.error)
			return res;

		while (this.notEof() && this.atType() == TokenType.LogicalOp) {
			var operator = this.yum().value;
			var right = res.register(this.parseCompExpr());

			if (res.error)
				return res;

			var leftPos = left.pos;
			var rightPos = right.pos;

			return res.success(
				new nodes.LogicalExprNode(left, operator, right)
					.setPos(leftPos, rightPos));
		}

		return res.success(left);
	}

	// Comparison Expression
	public parseCompExpr() {
		var res = new ParseResult();
		var left = res.register(this.parseObjectExpr());

		if (res.error)
			return res;

		while (this.notEof() && this.atType() == TokenType.CompOp) {
			var operator = this.yum().value;
			var right = res.register(this.parseObjectExpr());

			if (res.error)
				return res;

			var leftPos = left.pos;
			var rightPos = right.pos;

			return res.success(
				new nodes.BinaryExprNode(left, operator, right)
					.setPos(leftPos, rightPos));
		}

		return res.success(left);
	}


	// Object Literal
	public parseObjectExpr() {
		if (!this.atMatches(TokenType.Brace, "{")) {
			return this.parseAdditiveExpr();
		}

		var res = new ParseResult();
		var leftBrace = this.yum();

		var properties = new Map();

		while (this.notEof() && !this.atMatches(TokenType.Brace, "}")) {
			var key, value;

			key = res.register(this.parseExpr());
			if (res.error) return res;

			if (key.type !== "Identifier" && key.type !== "StringLiteral")
				return res.failure(key.pos.left, "Expected identifier or string");

			// { key }
			if (this.atMatches(TokenType.Symbol, ",") || this.atMatches(TokenType.Brace, "}")) {
				if (this.atMatches(TokenType.Symbol, ","))
					this.yum();

				properties.set(key.value, null);
				continue;
			}

			// { key: value }
			if (!this.atMatches(TokenType.Symbol, ":"))
				return res.failure(this.atPos().right, "Expected ':', ',' or '}'");

			this.yum();

			value = res.register(this.parseExpr());
			if (res.error) return res;

			properties.set(key.value, value);

			if (!this.atMatches(TokenType.Symbol, ",") && !this.atMatches(TokenType.Brace, "}"))
				return res.failure(this.atPos().right, "Expected ',' or '}'");

			if (this.atMatches(TokenType.Symbol, ","))
				this.yum();
		}

		if (!this.atMatches(TokenType.Brace, "}"))
			return res.failure(this.atPos().right, "Expected '}'");

		var rightBrace = this.yum();

		var leftPos = leftBrace.pos.left;
		var rightPos = rightBrace.pos.right;

		return res.success(
			new nodes.ObjectLiteralNode(properties)
				.setPos(leftPos, rightPos));
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
			&& this.atType() == TokenType.Operator
			&& operators.includes(this.atValue())
		) {
			var operator = this.yum().value;
			var right = res.register(this.parseMultiplicativeExpr());

			if (res.error)
				return res;

			var leftPos = left.pos;
			var rightPos = right.pos;

			return res.success(
				new nodes.BinaryExprNode(left, operator, right)
					.setPos(leftPos, rightPos));
		}

		return res.success(left);
	}

	// Multiplicative Expression
	public parseMultiplicativeExpr() {
		var res = new ParseResult();
		var operators = ["*", "/", "%"];
		var left = res.register(this.parseCallExpr());

		if (res.error)
			return res;

		while
			(this.notEof()
			&& this.atType() == TokenType.Operator
			&& operators.includes(this.atValue())
		) {
			var operator = this.yum().value;
			var right = res.register(this.parseCallExpr());

			if (res.error)
				return res;

			var leftPos = left.pos;
			var rightPos = right.pos;

			return res.success(
				new nodes.BinaryExprNode(left, operator, right)
					.setPos(leftPos, rightPos));
		}

		return res.success(left);
	}

	// TODO: Make support for member expressions
	// Call Expression
	public parseCallExpr() {
		var res = new ParseResult();
		var ident = res.register(this.parseLiteral());

		if (res.error)
			return res;

		if (this.atMatches(TokenType.Paren, "(")) {
			this.yum();
			var args = res.register(this.parseArguments());

			if (res.error)
				return res;

			var leftPos = ident.pos.left;
			var rightPos = this.atPos().left;

			return res.success(
				new nodes.CallExprNode(ident, args)
					.setPos(leftPos, rightPos));
		}

		return res.success(ident);
	}

	// --------------------------------------------
	// Literals
	// --------------------------------------------
	public parseLiteral() {
		var res = new ParseResult();
		var token = this.yum();

		var leftPos = token.pos.left;
		var rightPos = token.pos.right;

		// NumericLiteral
		if (token.type == TokenType.Number) {
			return res.success(
				new nodes.NumericLiteralNode(token.value)
					.setPos(leftPos, rightPos));

		// StringLiteral
		} else if (token.type == TokenType.String) {
			return res.success(
				new nodes.StringLiteralNode(token.value)
					.setPos(leftPos, rightPos));

		// Identifier | Literals
		} else if (token.type == TokenType.Ident) {
			// Literal
			if (either(token.value, "undefined", "null", "true", "false")) {
				return res.success(
					new nodes.LiteralNode(token.value)
						.setPos(leftPos, rightPos));
			}

			// VarAssignment
			if (this.atMatches(TokenType.Symbol, "=")) {
				res.register(this.yum());
				var value = res.register(this.parseExpr());
				if (res.error) return res;

				rightPos = value.pos.right;

				return res.success(
					new nodes.VarAssignmentNode(token, value)
						.setPos(leftPos, rightPos));
			}

			// Identifier
			return res.success(
				new nodes.IdentifierNode(token.value)
					.setPos(leftPos, rightPos));

		// ArrayLiteral
		} else if (token.match(TokenType.Bracket, "[")) {
			var values: any[] = [];

			while (this.notEof() && !this.atMatches(TokenType.Bracket, "]")) {
				var value = res.register(this.parseExpr());
				if (res.error) return res;

				values.push(value);

				if (!this.atMatches(TokenType.Symbol, ",")
					&& !this.atMatches(TokenType.Bracket, "]")
				)
					return res.failure(this.atPos().right, `Expected ',' or ']'`);

				this.yum();

				if (this.atMatches(TokenType.Bracket, "]")) {
					break;
				}
			}

			if (this.atMatches(TokenType.Bracket, "]"))
				this.yum();

			rightPos = this.atPos().right;

			return res.success(
				new nodes.ArrayLiteralNode(values)
					.setPos(leftPos, rightPos));

		// ------------------------------------------------------------------------------------------

		// UnaryExpr
		} else if (token.match(TokenType.Operator, "-") || token.match(TokenType.Operator, "!")) {
			var node = res.register(this.parseLiteral());

			if (res.error)
				return res;

			return res.success(
				new nodes.UnaryExprNode(token.value, node)
					.setPos(leftPos, rightPos));

		// Parenthesised expression
		} else if (token.match(TokenType.Paren, "(")) {
			var node = res.register(this.parseExpr());

			if (res.error)
				return res;

			if (this.atMatches(TokenType.Paren, ")")) {
				res.register(this.yum());
				return res.success(node);
			}

			return res.failure(this.atPos().right, "Expected ')'");
		}

		// return an error
		var value = token.value;

		// if a token value is (null | undefined) then take its type instead
		if (!value)
			value = TokenTypeStr[token.type];

		return res.failure(rightPos, `Unexpected token '${value}'`);
	}
}