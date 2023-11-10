let readline = require("readline-sync");
import { RT_toString, Environment } from "./interpreter";
import { run } from "./run";
import { either } from "./utils/general";

var shell_env: Environment;
var shell_lexer: boolean;
var shell_parser: boolean;
var shell_interpreter: boolean;

// Returns from a boolean a string with a value of either "ON" or "OFF"
let booleanToOnOff = function(bool: boolean) {
	return bool === true
		? "ON"
		: "OFF";
}

let shell_loop = function() {
	var input: string;

	process.stdout.write("> ");
	input = readline.question();

	if (either(input, ".exit", ".quit", ".q")) {
		return;

	} else if (input == ".lexer") {
		shell_lexer = !(shell_lexer);
		console.log(`Lexer output has been turned ${booleanToOnOff(shell_lexer)}`);

		return shell_loop();

	} else if (input == ".parser") {
		shell_parser = !(shell_parser);
		console.log(`Parser output has been turned ${booleanToOnOff(shell_parser)}`);

		return shell_loop();

	} else if (input == ".interpreter") {
		shell_interpreter = !(shell_interpreter);
		console.log(`Interpreter output has been turned ${booleanToOnOff(shell_interpreter)}`);

		return shell_loop();
	}

	var args = [];

	if (shell_lexer) args.push("--lexer");
	if (shell_parser) args.push("--parser");
	if (shell_interpreter) args.push("--interpreter");

	var returnValue = run("<stdin>", input, args, shell_env);
	// process.stdout.write("-> ");
	console.log(RT_toString(returnValue));

	shell_loop();
}

let shell_run = function() {
	shell_env = new Environment();
	shell_loop();
}

export { shell_run };