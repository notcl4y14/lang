import { Lexer } from "./lexer";
import { Parser } from "./parser";

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

	if (showParser)
		console.log(ast);
}