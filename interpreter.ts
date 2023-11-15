import { Position } from "./position";
import { Error } from "./error";
import { Colors } from "./colors";
import * as nodes from "./nodes";
let utils = require("util");

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

// ------------------------------------------------------------------------------------------

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

// ------------------------------------------------------------------------------------------

export interface RuntimeValue {
	type: string;
	value: any;
}

export interface ArrayRuntimeValue {
	type: string;
	values: any[];
}

export interface ObjectRuntimeValue {
	type: string;
	properties: Map<string, any>;
}

export interface FunctionRuntimeValue {
	type: string;
	params: any[],
	body: nodes.Node[];
	call: Function;
	env: Environment;
}

// ------------------------------------------------------------------------------------------

export function RT_toBoolean(value: any) {
	if (!value) return;

	return (
			!(value.type == "undefined"
			|| value.type == "null"
			|| (value.type === "boolean" && value.value == false)));
}

export function RT_toString(rtValue: any) {
	if (!rtValue) return Colors.FgGray + RT_value_undefined().type + Colors.Reset;

	var value;

	if (rtValue.type == "string")
		value = Colors.FgGreen + '"' + rtValue.value + '"' + Colors.Reset;

	else if (rtValue.type == "number" || rtValue.type == "boolean")
		value = Colors.FgYellow + rtValue.value + Colors.Reset;

	else if (rtValue.type == "undefined")
		value = Colors.FgGray + rtValue.value + Colors.Reset;

	else if (rtValue.type == "null")
		value = Colors.FgWhite + rtValue.value + Colors.Reset

	else if (rtValue.type == "array")
		value = rtValue.values;

	else if (rtValue.type == "object")
		value = utils.inspect(rtValue.properties, {showHidden: false, depth: null, colors: true});

	return String(value);
}

// ------------------------------------------------------------------------------------------

export function RT_value(type: string, value: any = undefined) {
	var rtValue = {type, value} as RuntimeValue;
	return rtValue;
}

export function RT_value_undefined() {
	return RT_value("undefined");
}

export function RT_value_null() {
	return RT_value("null");
}

export function RT_value_number(value: number) {
	return RT_value("number", value);
}

export function RT_value_string(value: string) {
	return RT_value("string", value);
}

export function RT_value_boolean(value: boolean) {
	return RT_value("boolean", value);
}

export function RT_value_array(values: any[]) {
	return {type: "array", values} as ArrayRuntimeValue;
}

export function RT_value_object(properties: Map<string, any>) {
	return {type: "object", properties} as ObjectRuntimeValue;
}

// ------------------------------------------------------------------------------------------

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

		} else if (node.type == "ArrayLiteral") {
			return this.visit_ArrayLiteral(node as nodes.ArrayLiteralNode, env);

		} else if (node.type == "ObjectLiteral") {
			return this.visit_ObjectLiteral(node as nodes.ObjectLiteralNode, env);

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

		} else if (node.type == "ReturnStatement") {
			return this.visit_ReturnStatement(node as nodes.ReturnStatementNode, env);

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
		return res.success(RT_value_number(node.value));
	}

	public visit_StringLiteral(node: nodes.StringLiteralNode) {
		var res = new RuntimeResult();
		return res.success(RT_value_string(node.value));
	}

	public visit_Identifier(node: nodes.IdentifierNode, env: Environment) {
		var res = new RuntimeResult();
		var variable = env.lookupVar(node.value);

		if (!variable)
			return res.success(RT_value_undefined());

		// var resultVar = res.register(this.visit(variable, env));

		return res.success(variable);
	}

	public visit_ArrayLiteral(node: nodes.ArrayLiteralNode, env: Environment) {
		var res = new RuntimeResult();
		var values = [];

		for (var i = 0; i < node.values.length; i += 1) {
			values.push(res.register(this.visit(node.values[i], env)));
			if (res.error) return res;
		}

		return res.success(RT_value_array(values));
	}

	public visit_ObjectLiteral(node: nodes.ObjectLiteralNode, env: Environment) {
		var res = new RuntimeResult();
		var object = RT_value_object(new Map());
		var properties = Object.fromEntries(node.properties);
		var keys = Object.keys(properties);

		// https://github.com/tlaceby/guide-to-interpreters-series/blob/main/ep08-object-literals/runtime/eval/expressions.ts
		for (var i = 0; i < node.properties.size; i += 1) {
			var key = keys[i];
			var value = node.properties.get(key);

			var runtimeVal = (value == undefined)
				? env.lookupVar(key)
				: res.register(this.visit(value, env));
			if (res.error) return res;

			object.properties.set(key, runtimeVal);
		}

		return res.success(object);
	}

	public visit_Literal(node: nodes.LiteralNode, env: Environment) {
		var res = new RuntimeResult();

		if (["true", "false"].includes(node.value)) {
			var value = node.value == "true" ? true : false;
			return res.success(RT_value_boolean(value));
		}

		return res.success(RT_value(String(value)));
	}

	public visit_IfStatement(node: nodes.IfStatementNode, env: Environment) {
		var res = new RuntimeResult();
		var isCondTrue = RT_toBoolean(res.register(this.visit(node.condition, env)));
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

		var isTestTrue = RT_toBoolean(res.register(this.visit(node.test, subEnv)));
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
			isTestTrue = RT_toBoolean(res.register(this.visit(node.test, subEnv)));
			if (res.error) return res;
		}

		return res.success(value);
	}

	public visit_WhileStatement(node: nodes.WhileStatementNode, env: Environment) {
		var res = new RuntimeResult();

		var isTestTrue = RT_toBoolean(res.register(this.visit(node.test, env)));
		if (res.error) return res;

		var value;

		while (isTestTrue) {
			value = res.register(this.visit(node.block, env));
			if (res.error) return res;

			isTestTrue = RT_toBoolean(res.register(this.visit(node.test, env)));
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
		var variable = env.declareVar(
			node.ident.value,
			res.register(
				this.visit(node.value, env)));

		if (!variable)
			return res.failure(node.ident.pos.right, `Cannot redeclare variable '${node.ident.value}'`);

		return res.success(variable);
	}

	public visit_ReturnStatement(node: nodes.ReturnStatementNode, env: Environment) {
		var res = new RuntimeResult();
		var argument = res.register(this.visit(node.argument, env));
		if (res.error) return res;

		return res.success(argument);
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
			return res.failure(node.pos.right, "Cannot call non-function value");

		var args = [];

		for (var _node of node.args) {
			var value = res.register(this.visit(_node, env));
			if (res.error) return res;

			args.push(value);
		}

		var _env = new Environment(env);

		console.log(func);
		// console.log(func.params);
		console.log(args);

		for (var i = 0; i < func.params.length; i += 1) {
			var variable = _env.declareVar(func.params[i].value, args[i]);
			if (!variable)
				return res.failure(node.pos.right, `Variable ${func.params[i].value} already declared`);
		}

		console.log(_env);

		var value = res.register(func.call(args, _env));
		if (res.error) return res;

		return res.success(value);
	}

	public visit_VarAssignment(node: nodes.VarAssignmentNode, env: Environment) {
		var res = new RuntimeResult();
		var variable: any = env.setVar(
			node.ident.value,
			res.register(
				this.visit(node.value, env)
			));

		if (!variable)
			return res.failure(node.ident.pos.right, `Cannot assign an undeclared variable '${node.ident.value}'`);

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
			result = RT_toBoolean(left) && RT_toBoolean(right);
		} else if (operator == "||") {
			result = RT_toBoolean(left) || RT_toBoolean(right);
		}

		return res.success(RT_value_boolean(result));
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
				return res.failure(node.right.pos.right, "Cannot divide by 0");

			result = left.value / right.value;
		} else if (operator == "%") {
			result = left.value % right.value;
		}

		if (["<", ">", "<=", ">="].includes(node.operator)) {

			if (left.type != "number" || right.type != "number")
				return res.failure(node.left.pos.right, "Cannot compare non-number value " + left.type + ", " + right.type);
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
			return res.success(RT_value_boolean(result));

		return res.success(RT_value_number(result));
	}
}