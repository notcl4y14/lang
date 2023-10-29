export enum TokenType {
	BinOp,
	UnOp,
	Number,
	String,
	Ident,
	Keyword,

	Comment,
	EOF
}

export class Token {
	public type: TokenType;
	public value: any;

	public constructor(type: TokenType, value: any) {
		this.type = type;
		this.value = value;
	}

	// checks if the token's values match the given ones
	public match(type: TokenType, value: any): boolean {
		return this.type == type && this.value == value;
	}

	// returns token as a string [type: value]
	public asString(): string {
		return `[${this.type}: ${this.value}]`;
	}
}