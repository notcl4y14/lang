import { Position } from "./position";

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

export var TokenTypeStr: string[] = [
	"Binary Operator",
	"Unary Operator",
	"Number",
	"String",
	"Identifier",
	"Keyword",

	"Comment",
	"EOF"
]

export class Token {
	public type: TokenType;
	public value: any;
	public pos: any;

	public constructor(type: TokenType, value: any, posLeft: Position, posRight?: Position) {
		this.type = type;
		this.value = value;
		this.pos = {
			left: posLeft,
			right: posRight
		}

		if (!posRight) {
			this.pos.right = posLeft;
		}
	}

	// checks if the token's type and value match the given ones
	public match(type: TokenType, value: any): boolean {
		return this.type == type && this.value == value;
	}

	// returns token as a string [type: value]
	public asString(): string {
		return `[${this.type}: ${this.value}]`;
	}
}