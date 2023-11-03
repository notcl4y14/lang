import { Error } from "./error";
import {
	newNode,
	Node,
	NumericLiteralNode,
	IdentifierNode,
	StringLiteralNode,
	LiteralNode,
	VarDeclarationNode,
	VarAssignmentNode,
	UnaryExprNode,
	LogicalExprNode,
	BinaryExprNode } from "./nodes";

export class Environment {
	public variables: any;
	public parent?: Environment;

	public constructor(parent?: Environment) {
		this.variables = {};
		this.parent = parent;
	}

	public declareVar(name: string, value: any) {
		if (this.lookupVar(name)) {
			return;
		}

		this.variables[name] = value;
		return this.lookupVar(name);
	}

	public setVar(name: string, value: any) {
		if (!this.lookupVar(name)) {
			return;
		}

		this.variables[name] = value;
		return this.lookupVar(name);
	}

	public lookupVar(name: string) {
		if (!this.variables[name]) {
			return;
		}

		return this.variables[name];
	}
}

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
	public visit(node: Node, env: Environment) {

		if (node.type == "NumericLiteral") {
			return this.visit_NumericLiteral(node as NumericLiteralNode);
		} else if (node.type == "Identifier") {
			return this.visit_Identifier(node as IdentifierNode, env);
		} else if (node.type == "Literal") {
			return this.visit_Literal(node as LiteralNode, env);
		} else if (node.type == "VarDeclaration") {
			return this.visit_VarDeclaration(node as VarDeclarationNode, env);
		} else if (node.type == "VarAssignment") {
			return this.visit_VarAssignment(node as VarAssignmentNode, env);
		} else if (node.type == "UnaryExpr") {
			return this.visit_UnaryExpr(node as UnaryExprNode, env);
		} else if (node.type == "LogicalExpr") {
			return this.visit_LogicalExpr(node as LogicalExprNode, env);
		} else if (node.type == "BinaryExpr") {
			return this.visit_BinaryExpr(node as BinaryExprNode, env);
		}

		return this.no_visit(node);
	}

	public toBoolean(value: any) {
		return (
				!(value.type == "undefined"
				|| value.type == "null"
				|| (value.type === "boolean" && value.value == false)));
	}

	public no_visit(node: Node) {
		return new RuntimeResult().failure(
			new Error(node.pos.left, `This AST node has not been setup for interpretation yet: ${node.type}`));
	}

	public visit_NumericLiteral(node: NumericLiteralNode) {
		return new RuntimeResult().success({type: "number", value: node.value});
	}

	public visit_Identifier(node: IdentifierNode, env: Environment) {
		var res = new RuntimeResult();
		var variable: any = this.visit(env.lookupVar(node.value), env);

		if (!variable)
			return res.success({type: "undefined"});

		return res.success(variable);
	}

	public visit_Literal(node: LiteralNode, env: Environment) {
		var res = new RuntimeResult();

		if (["true", "false"].includes(node.value)) {
			var value = node.value == "true" ? true : false;
			return res.success({type: "boolean", value: value});
		}

		return res.success({type: node.value});
	}

	public visit_VarDeclaration(node: VarDeclarationNode, env: Environment) {
		var res = new RuntimeResult();
		var variable: any = this.visit(env.declareVar(node.ident, node.value), env);

		if (!variable)
			return res.failure(new Error(node.pos.left, `Cannot redeclare variable '${node.ident}'`));

		return res.success(variable);
	}

	public visit_VarAssignment(node: VarAssignmentNode, env: Environment) {
		var res = new RuntimeResult();
		var variable: any = this.visit(env.setVar(node.ident, node.value), env);

		if (!variable)
			return res.failure(new Error(node.pos.left, `Cannot assign an undeclared variable '${node.ident}'`));

		return res.success(variable);
	}

	public visit_UnaryExpr(node: UnaryExprNode, env: Environment) {
		var res = new RuntimeResult();
		var value: any = res.register(this.visit(node.node, env));

		if (res.error)
			return res;

		if (node.prefix == "-") {
			value.value = value.value * -1;
		}

		return res.success(value);
	}

	public visit_LogicalExpr(node: LogicalExprNode, env: Environment) {
		var res = new RuntimeResult();
		var left: any = res.register(this.visit(node.left, env));
		if (res.error)
			return res;

		var right: any = res.register(this.visit(node.right, env));
		if (res.error)
			return res;

		var operator = node.operator;
		var result;

		if (operator == "&&") {
			result = this.toBoolean(left) && this.toBoolean(right);
		} else if (operator == "||") {
			result = this.toBoolean(left) || this.toBoolean(right);
		}

		return res.success({type: "boolean", value: result});
	}

	public visit_BinaryExpr(node: BinaryExprNode, env: Environment) {
		var res = new RuntimeResult();
		var left: any = res.register(this.visit(node.left, env));
		if (res.error)
			return res;

		var right: any = res.register(this.visit(node.right, env));
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

		if (["<", ">", "<=", ">="].includes(node.operator)) {

			if (left.type != "number" || right.type != "number") {
				// var _node = left.type != "number"
					// ? left
					// : right;

				return res.failure(new Error(node.pos.left.pos.left, "Cannot compare non-number value"));
			}
		}

		if (operator == "<") {
			result = left.value < right.value;
		} else if (operator == ">") {
			result = left.value > right.value;
		} else if (operator == "<=") {
			result = left.value <= right.value;
		} else if (operator == ">=") {
			result = left.value >= right.value;
		} else if (operator == "!=") {
			result = left.value != right.value;
		} else if (operator == "==") {
			result = left.value == right.value && left.type == right.type;
		}

		if (result == true || result == false)
			return res.success({type: "boolean", value: result});

		return res.success({type: "number", value: result});
	}
}