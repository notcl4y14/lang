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

	public setPos(left: Position, right: Position) {
		this.pos = {
			left: left,
			right: right
		};

		return this;
	}
}

// --------------------------------------------
// Miscellaneous
// --------------------------------------------
export class ProgramNode extends Node {
	public type: string = "Program";
	public body: Node[];

	public constructor() {
		super();
		this.body = [];
	}
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
// Statements
// --------------------------------------------
export class IfStatementNode extends Node {
	public type: string = "IfStatement";
	public condition: Node;
	public block: BlockStatementNode;
	public alternate?: IfStatementNode | BlockStatementNode;

	public constructor(condition: Node, block: BlockStatementNode, alternate?: IfStatementNode | BlockStatementNode) {
		super();
		this.condition = condition;
		this.block = block;
		this.alternate = alternate;
	}
}

export class ForStatementNode extends Node {
	public type: string = "ForStatement";
	public init: Node;
	public test: Node;
	public update: Node;
	public block: BlockStatementNode;

	public constructor(init: Node, test: Node, update: Node, block: BlockStatementNode) {
		super();
		this.init = init;
		this.test = test;
		this.update = update;
		this.block = block;
	}
}

export class WhileStatementNode extends Node {
	public type: string = "WhileStatement";
	public test: Node;
	public block: BlockStatementNode;

	public constructor(test: Node, block: BlockStatementNode) {
		super();
		this.test = test;
		this.block = block;
	}
}

export class BlockStatementNode extends Node {
	public type: string = "BlockStatement";
	public body: Node[];

	public constructor(body: Node[] = []) {
		super();
		this.body = body;
	}
}

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

// --------------------------------------------
// Expressions
// --------------------------------------------
export class CallExprNode extends Node {
	public type: string = "CallExpr";
	public ident: IdentifierNode;
	public args: Node[];

	public constructor(ident: IdentifierNode, args: Node[]) {
		super();
		this.ident = ident;
		this.args = args;
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