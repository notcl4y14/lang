export function either( ... $n: any[] ) {
	var value = arguments[0];

	for (var i = 1; i < arguments.length; i += 1) {
		if (value == arguments[i]) {
			return true;
		}
	}

	return false;
}