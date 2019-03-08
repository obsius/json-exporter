const fs = require('fs');

const DEFAULT_OPTIONS = {
	colDelimiter: ',',
	lineDelimiter: '\r\n',
	blockDelimiter: '',
	numType: 'int',
	floatPrecision: 2
}

/**
 * The encapsulation of an output or partial output.
 */
export class Block {
	
	constructor({ selector = null, filename = null, options = {}, variables = {}, blocks = [] }) {
		this.selector = selector;
		this.filename = filename;
		this.options = options;
		this.variables = variables;
		this.blocks = blocks;
	}

	write(data, formatter, out = null) {

		// run for all variants of this block's selector
		runOnSelector(data, this.selector, formatter.variables, (data, variables) => {

			// apply the selectors variables
			formatter = formatter.apply(variables);

			// new formatter with this blocks variables and options
			formatter = formatter.apply(this.variables, this.options);

			// check for an out stream or if a new filename should be written
			if (this.filename) {
				out = fs.createWriteStream(formatter.formatString(this.filename));
			} else if (!out) {
				throw new Error('An exporter block cannot output without a filename or write stream');
			}

			// walk the sub blocks
			for (let block of this.blocks) {

				// literal output else block output
				if (Array.isArray(block)) {
					for (let i = 0; i < block.length; ++i) {
						safeWrite(out, formatter.evalAndformat(block[i]));
						if (i < block.length - 1) {
							safeWrite(out, this.options.colDelimiter);
						}
					}
					safeWrite(out, this.options.lineDelimiter);
				} else if (block instanceof Block) {
					block.write(data, formatter, out);
				}
			}

			// end of block
			safeWrite(out, this.options.blockDelimiter);

			// end of stream (end if this block own's it)
			if (this.filename) { out.end(); }
		});
	}

	validate(formatter) {
		if (!formatter.validateSelector(this.selector)) {
			return false;
		}

		// walk the sub blocks
		for (let block of this.blocks) {
			if (Array.isArray(block)) {
				for (let element of block) {
					if (!formatter.validate(element)) {
						return false;
					}
				}
			} else if (block instanceof Block) {
				if (!block.validate(formatter)) {
					return false;
				}
			}
		}

		return true;
	}

	static buildFromObj(obj, options = {}) {

		options = Object.assign({}, options, obj.options);

		let blocks = [];
		if (obj.blocks) {
			for (let block of obj.blocks) {
				if (Array.isArray(block)) {
					blocks.push(block);
				} else {
					blocks.push(Block.buildFromObj(block, options));
				}
			}
		}

		return new Block({ ...obj, blocks, options });
	}
}

/**
 * Exporter.
 */
export class Exporter extends Block {

	operations = {

		if: function ({ variable, ifTrue, ifFalse }) {
			if (this.eval(variable)) {
				return this.eval(ifTrue);
			} else {
				return this.eval(ifFalse);
			}
		},

		postInc: function ({ variable }) { return this.select(this.path(variable), null, '++') },

		pad: function ({ variable, length = 3, character = '0' }) {
			let pad = '';
			for (let i = length; i--;) { pad += character; }

			return (pad + this.eval(variable)).slice(-length);
		},

		lookup: function ({ obj, path }) {
			return select(this.eval(obj), this.eval(path));
		},

		concat: function ({ variable, spacer = '' }) { return this.eval(variable).join(spacer) }
	};

	constructor({ name, selector = null, filename = null, options = {}, variables = {}, inputs = [], blocks = [] }) {

		super({ selector, filename, variables, blocks, options: Object.assign({}, DEFAULT_OPTIONS, options) });

		this.name = name;
		this.inputs = inputs;
	}

	write(data, variables = {}) {
		let formatter = new Formatter(this.operations, variables, this.options);
		super.write(data, formatter);
	}

	validate() {
		let formatter = new Formatter(this.operations, {}, this.options);
		return super.validate(formatter);
	}

	registerOperation(name, fn) {
		this.operations[name] = fn;
	}

	static buildFromObj(obj) {
		try {

			let inputs = [];
			if (obj.inputs) {
				for (let input of obj.inputs) {
					inputs.push(Input.buildFromObj(input));
				}
			}

			return new Exporter({
				...Block.buildFromObj(obj, DEFAULT_OPTIONS),
				name: obj.name,
				inputs: inputs
			});

		} catch(e) {
			throw new Error('Failed to build exporter from obj', e);
		}
	}

	static buildFromFile(filename) {
		try {
			let contents = fs.readFileSync(filename, 'utf8');
			let obj = JSON.parse(contents);

			return Exporter.buildFromObj(obj);
		} catch(e) {
			throw new Error(`Failed to build exporter from file "${filename}"`, e);
		}
	}
}

/**
 * Input.
 */
export class Input {
	constructor({ type, name, label, description }) {
		this.type = type;
		this.name = name;
		this.label = label;
		this.description = description;
	}

	static buildFromObj(obj) {
		return new Input(obj);
	}
}

/* internals */

/**
 * Formatter.
 */
class Formatter {
	constructor(operations, variables = {}, options = {}) {
		this.operations = operations;
		this.variables = variables;
		this.options = options;
	}

	apply(variables = {}, options = {}) {
		if (Object.keys(variables).length) {
			variables = Object.assign({}, this.eval(variables));
		}

		// make vars scoped, use this: Object.assign({}, this.variables, variables)
		return new Formatter(this.operations, Object.assign(this.variables, variables), Object.assign({}, this.options, options));
	}

	validate(obj) {
		return true;
	}

	validateSelector(selector) {
		return true;
	}

	evalAndformat(data) {
		return this.format(this.eval(data));
	}

	eval(data, depth = 0, maxDepth = 1) {
		if (typeof data == 'string') {
			return this.evalString(data);
		} else {
			return this.evalObject(data, depth, maxDepth);
		}
	}

	evalString(str) {
		str.trim();
		if (str[0] == '$' && str[1] == '{' && str[str.length - 1] == '}') {
			return this.select(str.substring(2, str.length - 1));
		} else {
			return str;
		}
	}

	evalObject(data, depth = 0, maxDepth = 1) {
		
		// ignore null or not an object
		if (!data || typeof data != 'object') { return data; }

		// check for operations and check recursive until max depth
		if (data.type && this.operations[data.type]) {
			return this.operations[data.type].call(this, data);
		} else {
			if (depth < maxDepth) {

				let evaluated;

				if (Array.isArray(data)) {
					evaluated = [];
					for (let element of data) {
						evaluated.push(this.eval(element, depth + 1, maxDepth));
					}
				} else {
					evaluated = {};
					for (let key in data) {
						evaluated[key] = this.eval(data[key], depth + 1, maxDepth);
					}
				}

				return evaluated;
			} else {
				return data;
			}
		}
	}

	format(data) {
		switch (typeof data) {
			case 'number':
				return this.formatNumber(data);
			case 'string':
				return this.formatString(data);
		}

		return data;
	}

	formatNumber(num) {
		if (this.options.numType == 'int') {
			return parseInt(num);
		} else {
			num = parseFloat(num);
			if (this.options.floatPrecision != null) {
				return num.toFixed(this.options.floatPrecision);
			}
		}
	}

	formatString(str) {
		return str.replace(/\${([^}]+)}/g, (reference, path) => {

			let val = this.select(path.split('.'));
	
			if (typeof val == 'number') {
				return this.formatNumber(val);
			} else {
				return val;
			}
		});
	}

	path(str) {
		return str.replace(/\${([^}]+)}/g, (reference, path) => path.split('.'));
	}

	select(path = [], val = undefined, operator = undefined) {
		return select(this.variables, path, val, operator);
	}
}

/* utility */

function safeWrite(stream, data = '') {
	return stream.write(data);
}

function select(obj, path = [], val = undefined, operator = undefined) {

	// ignore undefined
	if (obj === undefined) { return; }

	// run function if at a leaf
	if (path == null || !path.length) {
		return obj;
	}

	// convert a str path to an array
	if (typeof path == 'string') { path = path.split('.'); }

	// convert any to an array
	if (typeof path != 'object') { path = [path]; }

	// make a shallow copy of the path and get the next
	path = path.slice();
	let next = path.shift();

	// if obj is an array, compare against an index
	if (Array.isArray(obj)) { next = parseInt(next); }

	// set a value if val or increment/decrement is defined
	if ((val !== undefined || operator == '++' || operator == '--') && !path.length) {
		switch (operator) {
			case '++':
				obj[next]++;
				break;
			case '--':
				obj[next]--;
				break;
			case '+=':
				obj[next] += val;
			case '-=':
				obj[next] += val;
			case '=':
			default:
				obj[next] = val;
		}
	}
	
	return select(obj[next], path);
}

function runOnPath(obj, path = [], variables = {}, fn) {
	
	// ignore undefined
	if (obj === undefined) { return; }

	// auto size path
	if (path && !Array.isArray(path)) { path = [path]; }

	// run function if at a leaf
	if (!path.length) {
		fn(obj, variables);
		return;
	}

	// ignore non objects
	if (typeof obj != 'object') { return; }

	// make a shallow copy of the path
	path = path.slice();

	// remove and keep the first path
	let firstKey = path.shift();

	// ignore empty keys
	if (!firstKey.length) { return; }

	// match all
	if (firstKey[0] == '(') {

		firstKey = firstKey.substring(1, firstKey.length - 1);

		if (Array.isArray(obj)) {
			for (let i = 0; i < obj.length; ++i) {
				runOnPath(obj[i], path, Object.assign({}, variables, { [firstKey]: { key: i, obj: obj[i] } }), fn);
			}
		} else {
			for (let key in obj) {
				runOnPath(obj[key], path, Object.assign({}, variables, { [firstKey]: { key: key, obj: obj[key] } }), fn);
			}
		}

	// match one
	} else {
		runOnPath(obj[firstKey], path, variables, fn);
	}
}

function runOnSelector(obj, selector, variables, fn) {
	if (Array.isArray(selector)) {
		for (let subSelector of selector) {
			runOnPath(obj, subSelector.path.split('.'), Object.assign({}, variables, subSelector.variables), fn);
		}
	} else if (typeof selector == 'string') {
		runOnPath(obj, selector.split('.'), variables, fn);
	}
}