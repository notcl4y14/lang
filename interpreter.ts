import { Error } from "./error";
import {
	newNode,
	Node,
	NumericLiteralNode,
	StringLiteralNode,
	LiteralNode,
	UnaryExprNode,
	BinaryExprNode } from "./nodes";

export class RuntimeResult {
	public value: any;
	public error: Error;

	public constructor() {
		this.value = null;
		this.error = null;
	}

	public register(res: any) {
		if (res.error) {
			this.error = res.error;
		}

		return res.value;
	}

	public success(value: any) {
		this.value = value;
		return this;
	}

	public failure(error: Error) {
		this.error = error;
		return this;
	}
}

export class Interpreter {
	public visit(node: Node) {
		/*var funcName = `visit_${node.type}`;
		var func = this["no_visit"];

		if (eval(`this.${funcName}`)) {
			func = eval(`this.${funcName}`);
		}

		return func(node);*/

		if (node.type == "NumericLiteral") {
			return this.visit_NumericLiteral(node as NumericLiteralNode);
		} else if (node.type == "BinaryExpr") {
			return this.visit_BinaryExpr(node as BinaryExprNode);
		} else if (node.type == "UnaryExpr") {
			return this.visit_UnaryExpr(node as UnaryExprNode);
		}

		return this.no_visit(node);
	}

	public no_visit(node: Node) {
		return new RuntimeResult().failure(
			new Error(node.pos, `This AST node has not been setup for interpretation yet: ${node.type}`));
	}

	public visit_NumericLiteral(node: NumericLiteralNode) {
		return new RuntimeResult().success({type: "number", value: node.value});
	}

	public visit_UnaryExpr(node: UnaryExprNode) {
		var res = new RuntimeResult();
		var value: any = res.register(this.visit(node.node));

		if (res.error)
			return res;

		if (node.prefix == "-") {
			value.value = value.value * -1;
		}

		return res.success(value);
	}

	public visit_BinaryExpr(node: BinaryExprNode) {
		var res = new RuntimeResult();
		var left: any = res.register(this.visit(node.left));
		if (res.error)
			return res;

		var right: any = res.register(this.visit(node.right));
		if (res.error)
			return res;

		var operator = node.operator;

		var result;

		if (operator == "+") {
			result = left.value + right.value;
		} else if (operator == "-") {
			result = left.value - right.value;
		} else if (operator == "*") {
			result = left.value * right.value;
		} else if (operator == "/") {
			if (right.value == 0)
				return res.failure(new Error(node.right.pos.left, "Cannot divide by 0"));

			result = left.value / right.value;
		} else if (operator == "%") {
			result = left.value % right.value;
		}

		return res.success({type: "number", value: result});
	}
}