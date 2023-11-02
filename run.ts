import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Interpreter, Environment } from "./interpreter";
let utils = require("util");

export function run(filename: string, code: string, args: string[]) {
	var showLexer = args.includes("--lexer");
	var showParser = args.includes("--parser");

	// -------------------------------------------------------------------
	var lexer = new Lexer(filename, code);
	var tokens = lexer.tokenize();

	if (showLexer)
		console.log(tokens);

	var parser = new Parser(filename, tokens);
	var ast = parser.parse();

	if (ast.error) {
		console.log(ast.error.asString());
		return;
	}

	if (showParser)
		console.log(utils.inspect(ast.node, {showHidden: false, depth: null, colors: true}));

	var env = new Environment();
	var interpreter = new Interpreter();
	var result = interpreter.visit(ast.node, env);

	if (result.error) {
		console.log(result.error.asString());
		return;
	}

	console.log(result.value);
}