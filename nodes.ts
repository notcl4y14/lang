import { Position } from "./position";

// returns a node class with initialized pos
export function newNode(nodeClass: Node, leftPos: Position, rightPos?: Position) {
	nodeClass.pos = {
		left: leftPos,
		right: rightPos
	};

	// TODO: remove this
	if (!rightPos) {
		nodeClass.pos.right = leftPos;
	}

	return nodeClass;
}

export abstract class Node {
	public type: string = "";
	// let's just leave this any type alone
	// and not bring back a lot of errors :D
	public pos: any;
}

// --------------------------------------------
// Literals
// --------------------------------------------
export class NumericLiteralNode extends Node {
	public type: string = "NumericLiteral";
	public value: number;

	public constructor(value: number) {
		super();
		this.value = value;
	}
}

export class StringLiteralNode extends Node {
	public type: string = "StringLiteral";
	public value: string;

	public constructor(value: string) {
		super();
		this.value = value;
	}
}

export class LiteralNode extends Node {
	public type: string = "Literal";
	public value: string;

	public constructor(value: string) {
		super();
		this.value = value;
	}
}

// --------------------------------------------
// Expressions
// --------------------------------------------
export class BinaryExprNode extends Node {
	public type: string = "BinaryExpr";
	public left: Node;
	public operator: string;
	public right: Node;

	public constructor(left: Node, operator: string, right: Node) {
		super();
		this.left = left;
		this.operator = operator;
		this.right = right;
	}
}