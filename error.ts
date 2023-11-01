import { Position } from "./position";

export class Error {
	public position: Position;
	public details: string;

	public constructor(position: Position, details: string) {
		this.position = position;
		this.details = details;
	}

	// returns an error as a string
	public asString() {
		var	filename = this.position.filename,
			line = this.position.line + 1,
			column = this.position.column + 1,
			details = this.details;

		return `${filename}:${line}:${column}: ${details}`;
	}
}