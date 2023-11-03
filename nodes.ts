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

export class IdentifierNode extends Node {
	public type: string = "Identifier";
	public value: string;

	public constructor(value: string) {
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
export class VarDeclarationNode extends Node {
	public type: string = "VarDeclaration";
	public ident: string;
	public value: Node;

	public constructor(ident: string, value: Node) {
		super();
		this.ident = ident;
		this.value = value;
	}
}

export class VarAssignmentNode extends Node {
	public type: string = "VarAssignment";
	public ident: string;
	public value: Node;

	public constructor(ident: string, value: Node) {
		super();
		this.ident = ident;
		this.value = value;
	}
}

export class UnaryExprNode extends Node {
	public type: string = "UnaryExpr";
	public prefix: string;
	public node: Node;

	public constructor(prefix: string, node: Node) {
		super();
		this.prefix = prefix;
		this.node = node;
	}
}

export class LogicalExprNode extends Node {
	public type: string = "LogicalExpr";
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