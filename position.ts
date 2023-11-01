// TODO: remove the using of filename in the position
export class Position {
	public filename: string;
	public index: number;
	public line: number;
	public column: number;

	public constructor(filename: string, index: number, line: number, column: number) {
		this.filename = filename;
		this.index = index;
		this.line = line;
		this.column = column;
	}

	// advances the index and the column
	// resets column and advances line when the char is "\n"
	public advance(char?: string, delta: number = 1) {
		this.index += delta;
		this.column += delta;

		if (char == "\n") {
			this.column = 0;
			this.line += 1;
		}

		return this;
	}

	// clones Position with the same properties
	public clone() {
		return new Position(this.filename, this.index, this.line, this.column);
	}
}