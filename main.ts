let fs = require("fs");
import { run } from "./run";
import { shell_run } from "./shell";

var validArgs:string[] = [
	"--lexer",
	"--parser",
	"--interpreter"
];

let main = function():void {
	process.argv.splice(0, 2);
	let args = process.argv;
	let inputArgs: string[] = [];

	var filename: string = "";
	// console.log(args);

	// iterate through arguments
	for (var i:number = 0; i < args.length; i += 1) {
		var arg = args[i];

		// check if an argument starts with "-"
		if (arg[0] == "-") {
			// check if an argument is valid
			// otherwise, return an error :P
			if (!validArgs.includes(arg)) {
				console.log(`Undefined argument ${arg}`);
				return;
			}

			inputArgs.push(arg);
			continue;
		}

		// check if the filename is already specified
		if (filename) {
			console.log("Filename already specified!");
			return;
		}

		// set the filename
		filename = arg;
	}

	// check if filename isn't specified
	if (!filename) {
		// console.log("Please specify a filename!");

		// Start shell
		shell_run();
		return;
	}

	fs.readFile(filename, "utf-8", (error: any, code: string) => {
		// file doesn't exist
		if (error) {
			console.log(`${filename} doesn't exist!`);
			return;
		}

		run(filename, code, inputArgs);
	})
}

main();