let readline = require("readline-sync");
import { Environment } from "./interpreter";
import { run } from "./run";
import { either } from "./utils/general";

// var shell_running: boolean;
var shell_env: Environment;

let shell_loop = function() {
	var input: string;

	process.stdout.write("> ");
	input = readline.question();

	if (either(input, ".exit", ".quit", ".q")) {
		// shell_running = false;
		return;
	}

	var returnValue = run("<stdin>", input, [], shell_env);
	// console.log(`-> ${returnValue}`);
	process.stdout.write("-> ");
	console.log(returnValue);

	// if (shell_running) shell_loop();
	shell_loop();
}

let shell_run = function() {
	// shell_running = true;
	shell_env = new Environment();
	shell_loop();
}

export { shell_run };