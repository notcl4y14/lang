export function either( ... $n: any[] ) {
	var value = arguments[0];

	for (var i = 1; i < arguments.length; i += 1) {
		if (value == arguments[i]) {
			return true;
		}
	}

	return false;
}

export function both( ... $n: any[] ) {
	var value = arguments[0];
	var valuesCount = 0;

	for (var i = 1; i < arguments.length; i += 1) {
		if (value == arguments[i]) {
			valuesCount += 1;
		}
	}

	return valuesCount > 0;
}