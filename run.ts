import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Interpreter, Environment, RT_toString, FunctionRuntimeValue } from "./interpreter";
let utils = require("util");

export function run(filename: string, code: string, args: string[] = [], overrideEnv: Environment = new Environment()) {
	var showLexer = args.includes("--lexer");
	var showParser = args.includes("--parser");
	var showInterpreter = args.includes("--interpreter");

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

	var env = overrideEnv;

	var function_writeln;
	function_writeln = {
		type: "function",
		params: ["value"],
		body: null,
		env: null,
		call: (args: any[], env: Environment) => {
			var value = env.lookupVar("value");
			console.log(RT_toString(value));
			return {type: "undefined"};
		}
	} as FunctionRuntimeValue;

	env.declareVar("writeln", function_writeln);
	
	var interpreter = new Interpreter();
	var result = interpreter.visit(ast.node, env);

	if (result.error) {
		console.log(result.error.asString());
		return;
	}

	if (showInterpreter)
		console.log(result.value);

	return result.value;
}