import { Position } from "./position";
import { Error } from "./error";
import * as nodes from "./nodes";

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

	public setVar(name: string, value: any): any {
		if (!this.lookupVar(name)) {
			if (this.parent) {
				return this.parent.setVar(name, value);
			}

			return;
		}

		this.variables[name] = value;
		return this.lookupVar(name);
	}

	public lookupVar(name: string): any {
		if (!this.variables[name]) {
			if (this.parent) {
				return this.parent.lookupVar(name);
			}

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
		if (res instanceof RuntimeResult) {
			if (res.error) {
				this.error = res.error;
			}

			return res.value;
		}

		return res;
	}

	public success(value: any) {
		this.value = value;
		return this;
	}

	// public failure(error: Error) {
		// this.error = error;
		// return this;
	// }

	public failure(pos: Position, details: string) {
		this.error = new Error(pos, details);
		return this;
	}
}

export interface RuntimeValue {
	type: string;
	value: any;
}

export interface FunctionRuntimeValue {
	type: string;
	params: any[],
	body: nodes.Node[];
	call: Function;
	env: Environment;
}

export class Interpreter {
	public visit(node: nodes.Node, env: Environment): any {

		if (node.type == "Program") {
			return this.visit_Program(node as nodes.ProgramNode, env);
		} else if (node.type == "NumericLiteral") {
			return this.visit_NumericLiteral(node as nodes.NumericLiteralNode);
		} else if (node.type == "StringLiteral") {
			return this.visit_StringLiteral(node as nodes.StringLiteralNode);
		} else if (node.type == "Identifier") {
			return this.visit_Identifier(node as nodes.IdentifierNode, env);
		} else if (node.type == "Literal") {
			return this.visit_Literal(node as nodes.LiteralNode, env);
		} else if (node.type == "IfStatement") {
			return this.visit_IfStatement(node as nodes.IfStatementNode, env);
		} else if (node.type == "ForStatement") {
			return this.visit_ForStatement(node as nodes.ForStatementNode, env);
		} else if (node.type == "WhileStatement") {
			return this.visit_WhileStatement(node as nodes.WhileStatementNode, env);
		} else if (node.type == "BlockStatement") {
			return this.visit_BlockStatement(node as nodes.BlockStatementNode, env);
		} else if (node.type == "VarDeclaration") {
			return this.visit_VarDeclaration(node as nodes.VarDeclarationNode, env);
		} else if (node.type == "FunctionDeclaration") {
			return this.visit_FunctionDeclaration(node as nodes.FunctionDeclarationNode, env);
		} else if (node.type == "CallExpr") {
			return this.visit_CallExpr(node as nodes.CallExprNode, env);
		} else if (node.type == "VarAssignment") {
			return this.visit_VarAssignment(node as nodes.VarAssignmentNode, env);
		} else if (node.type == "UnaryExpr") {
			return this.visit_UnaryExpr(node as nodes.UnaryExprNode, env);
		} else if (node.type == "LogicalExpr") {
			return this.visit_LogicalExpr(node as nodes.LogicalExprNode, env);
		} else if (node.type == "BinaryExpr") {
			return this.visit_BinaryExpr(node as nodes.BinaryExprNode, env);
		}

		return this.no_visit(node);
	}

	// ------------------------------------------------------------------------------------------

	public toBoolean(value: any) {
		if (!value) return;

		return (
				!(value.type == "undefined"
				|| value.type == "null"
				|| (value.type === "boolean" && value.value == false)));
	}

	// ------------------------------------------------------------------------------------------

	public value(type: string, value: any = undefined) {
		var rtValue = {type, value} as RuntimeValue;

		// if (value)
			// rtValue.value = value;

		return rtValue;
	}

	public value_undefined() {
		return this.value("undefined");
	}

	public value_null() {
		return this.value("null");
	}

	public value_number(value: number) {
		return this.value("number", value);
	}

	public value_string(value: string) {
		return this.value("string", value);
	}

	public value_boolean(value: boolean) {
		return this.value("boolean", value);
	}

	// public value_function(block: nodes.BlockStatementNode, call: Function) {
		// return {type: "function", block, call} as FunctionRuntimeValue;
	// }

	// ------------------------------------------------------------------------------------------

	public no_visit(node: nodes.Node) {
		return new RuntimeResult().failure(
			node.pos.left, `This AST node has not been setup for interpretation yet: ${node.type}`);
	}

	public visit_Program(node: nodes.ProgramNode, env: Environment) {
		var res = new RuntimeResult();
		var value;

		for (var i = 0; i < node.body.length; i += 1) {
			value = res.register(this.visit(node.body[i], env));

			if (res.error)
				return res;
		}

		return res.success(value);
	}

	public visit_NumericLiteral(node: nodes.NumericLiteralNode) {
		var res = new RuntimeResult();
		return res.success(this.value_number(node.value));
	}

	public visit_StringLiteral(node: nodes.StringLiteralNode) {
		var res = new RuntimeResult();
		return res.success(this.value_string(node.value));
	}

	public visit_Identifier(node: nodes.IdentifierNode, env: Environment) {
		var res = new RuntimeResult();
		var variable = env.lookupVar(node.value);

		if (node.value == "lol")
			console.log("lol");

		if (!variable)
			return res.success(this.value_undefined());

		// var resultVar = res.register(this.visit(variable, env));

		return res.success(variable);
	}

	public visit_Literal(node: nodes.LiteralNode, env: Environment) {
		var res = new RuntimeResult();

		if (["true", "false"].includes(node.value)) {
			var value = node.value == "true" ? true : false;
			return res.success(this.value_boolean(value));
		}

		return res.success(this.value(String(value)));
	}

	public visit_IfStatement(node: nodes.IfStatementNode, env: Environment) {
		var res = new RuntimeResult();
		var isCondTrue = this.toBoolean(res.register(this.visit(node.condition, env)));
		if (res.error) return res;

		var value;

		if (isCondTrue) {
			value = res.register(this.visit(node.block, env));
			if (res.error) return res;

		} else if (node.alternate) {
			value = res.register(this.visit(node.alternate, env));
			if (res.error) return res;
		}

		return res.success(value);
	}

	public visit_ForStatement(node: nodes.ForStatementNode, env: Environment) {
		var res = new RuntimeResult();
		var subEnv = new Environment(env);
		var initVar = res.register(this.visit(node.init, subEnv));
		if (res.error) return res;

		var isTestTrue = this.toBoolean(res.register(this.visit(node.test, subEnv)));
		if (res.error) return res;

		var update = node.update;
		var value;

		while (isTestTrue) {
			// console.log("Executing a block...");
			value = res.register(this.visit(node.block, subEnv));
			if (res.error) return res;

			// console.log("Updating the value...");
			res.register(this.visit(update, subEnv));
			if (res.error) return res;

			// console.log("Updating the test value...");
			isTestTrue = this.toBoolean(res.register(this.visit(node.test, subEnv)));
			if (res.error) return res;
		}

		return res.success(value);
	}

	public visit_WhileStatement(node: nodes.WhileStatementNode, env: Environment) {
		var res = new RuntimeResult();

		var isTestTrue = this.toBoolean(res.register(this.visit(node.test, env)));
		if (res.error) return res;

		var value;

		while (isTestTrue) {
			value = res.register(this.visit(node.block, env));
			if (res.error) return res;

			isTestTrue = this.toBoolean(res.register(this.visit(node.test, env)));
			if (res.error) return res;
		}

		return res.success(value);
	}

	// TODO: make block statements have a local scope
	public visit_BlockStatement(node: nodes.BlockStatementNode, env: Environment) {
		var res = new RuntimeResult();
		// var subEnv = new Environment(env);
		var value;

		for (var i = 0; i < node.body.length; i += 1) {
			value = res.register(this.visit(node.body[i], env));

			if (res.error)
				return res;
		}

		return res.success(value);
	}

	public visit_VarDeclaration(node: nodes.VarDeclarationNode, env: Environment) {
		var res = new RuntimeResult();
		var variable = env.declareVar(node.ident, res.register(this.visit(node.value, env)));

		if (!variable)
			return res.failure(node.pos.left, `Cannot redeclare variable '${node.ident}'`);

		return res.success(variable);
	}

	public visit_FunctionDeclaration(node: nodes.FunctionDeclarationNode, env: Environment) {
		var res = new RuntimeResult();

		var name = node.name;
		var params = node.params.map((node) => node.value);
		var body = node.block.body;
		var anonymous = node.anonymous;

		var interpreter = this;

		var functionVal = {
			type: "function",
			params,
			body,
			env: null,
			call: function(args: any[], env: Environment) {
				var value;

				for (var i = 0; i < body.length; i += 1) {
					value = res.register(interpreter.visit(body[i], env));
					if (res.error) return res;
				}

				this.env = env;

				return res.success(value);
			}
		} as FunctionRuntimeValue;

		if (anonymous)
			return functionVal;

		return env.declareVar(name, functionVal);
	}

	// TODO: optimize this
	public visit_CallExpr(node: nodes.CallExprNode, env: Environment) {
		var res = new RuntimeResult();
		var func = res.register(this.visit(node.ident, env));
		if (res.error) return res;

		if (func.type != "function")
			return res.failure(node.pos.left, "Cannot call non-function value");

		var args = [];

		for (var _node of node.args) {
			var value = res.register(this.visit(_node, env));
			if (res.error) return res;

			args.push(value);
		}

		var _env = new Environment(env);

		for (var i = 0; i < func.params.length; i += 1) {
			_env.declareVar(func.params[i].value, args[i]);
		}

		var value = res.register(func.call(args, _env));
		if (res.error) return res;

		return res.success(value);
	}

	public visit_VarAssignment(node: nodes.VarAssignmentNode, env: Environment) {
		var res = new RuntimeResult();
		var variable: any = env.setVar(
			node.ident,
			res.register(
				this.visit(node.value, env)
			));

		if (!variable)
			return res.failure(node.pos.left, `Cannot assign an undeclared variable '${node.ident}'`);

		return res.success(variable);
	}

	public visit_UnaryExpr(node: nodes.UnaryExprNode, env: Environment) {
		var res = new RuntimeResult();
		var value: any = res.register(this.visit(node.node, env));

		if (res.error)
			return res;

		if (node.prefix == "-") {
			value.value = value.value * -1;
		}

		return res.success(value);
	}

	public visit_LogicalExpr(node: nodes.LogicalExprNode, env: Environment) {
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

		return res.success(this.value_boolean(result));
	}

	public visit_BinaryExpr(node: nodes.BinaryExprNode, env: Environment) {
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
				return res.failure(node.right.pos.left, "Cannot divide by 0");

			result = left.value / right.value;
		} else if (operator == "%") {
			result = left.value % right.value;
		}

		if (["<", ">", "<=", ">="].includes(node.operator)) {

			if (left.type != "number" || right.type != "number") {
				// var _node = left.type != "number"
					// ? left
					// : right;

				// console.log(left);
				return res.failure(node.left.pos.left, "Cannot compare non-number value " + left.type + ", " + right.type);
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

		if (result === true || result === false)
			return res.success(this.value_boolean(result));

		return res.success(this.value_number(result));
	}
}