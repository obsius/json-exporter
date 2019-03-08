'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Input = exports.Exporter = exports.Block = undefined;

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs');

var DEFAULT_OPTIONS = {
	colDelimiter: ',',
	lineDelimiter: '\r\n',
	blockDelimiter: '',
	numType: 'int',
	floatPrecision: 2

	/**
  * The encapsulation of an output or partial output.
  */
};
var Block = exports.Block = function () {
	function Block(_ref) {
		var _ref$selector = _ref.selector,
		    selector = _ref$selector === undefined ? null : _ref$selector,
		    _ref$filename = _ref.filename,
		    filename = _ref$filename === undefined ? null : _ref$filename,
		    _ref$options = _ref.options,
		    options = _ref$options === undefined ? {} : _ref$options,
		    _ref$variables = _ref.variables,
		    variables = _ref$variables === undefined ? {} : _ref$variables,
		    _ref$blocks = _ref.blocks,
		    blocks = _ref$blocks === undefined ? [] : _ref$blocks;
		(0, _classCallCheck3.default)(this, Block);

		this.selector = selector;
		this.filename = filename;
		this.options = options;
		this.variables = variables;
		this.blocks = blocks;
	}

	(0, _createClass3.default)(Block, [{
		key: 'write',
		value: function write(data, formatter) {
			var _this = this;

			var out = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;


			// run for all variants of this block's selector
			runOnSelector(data, this.selector, formatter.variables, function (data, variables) {

				// apply the selectors variables
				formatter = formatter.apply(variables);

				// new formatter with this blocks variables and options
				formatter = formatter.apply(_this.variables, _this.options);

				// check for an out stream or if a new filename should be written
				if (_this.filename) {
					out = fs.createWriteStream(formatter.formatString(_this.filename));
				} else if (!out) {
					throw new Error('An exporter block cannot output without a filename or write stream');
				}

				// walk the sub blocks
				var _iteratorNormalCompletion = true;
				var _didIteratorError = false;
				var _iteratorError = undefined;

				try {
					for (var _iterator = (0, _getIterator3.default)(_this.blocks), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
						var block = _step.value;


						// literal output else block output
						if (Array.isArray(block)) {
							for (var i = 0; i < block.length; ++i) {
								safeWrite(out, formatter.evalAndformat(block[i]));
								if (i < block.length - 1) {
									safeWrite(out, _this.options.colDelimiter);
								}
							}
							safeWrite(out, _this.options.lineDelimiter);
						} else if (block instanceof Block) {
							block.write(data, formatter, out);
						}
					}

					// end of block
				} catch (err) {
					_didIteratorError = true;
					_iteratorError = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion && _iterator.return) {
							_iterator.return();
						}
					} finally {
						if (_didIteratorError) {
							throw _iteratorError;
						}
					}
				}

				safeWrite(out, _this.options.blockDelimiter);

				// end of stream (end if this block own's it)
				if (_this.filename) {
					out.end();
				}
			});
		}
	}, {
		key: 'validate',
		value: function validate(formatter) {
			if (!formatter.validateSelector(this.selector)) {
				return false;
			}

			// walk the sub blocks
			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = (0, _getIterator3.default)(this.blocks), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var block = _step2.value;

					if (Array.isArray(block)) {
						var _iteratorNormalCompletion3 = true;
						var _didIteratorError3 = false;
						var _iteratorError3 = undefined;

						try {
							for (var _iterator3 = (0, _getIterator3.default)(block), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
								var element = _step3.value;

								if (!formatter.validate(element)) {
									return false;
								}
							}
						} catch (err) {
							_didIteratorError3 = true;
							_iteratorError3 = err;
						} finally {
							try {
								if (!_iteratorNormalCompletion3 && _iterator3.return) {
									_iterator3.return();
								}
							} finally {
								if (_didIteratorError3) {
									throw _iteratorError3;
								}
							}
						}
					} else if (block instanceof Block) {
						if (!block.validate(formatter)) {
							return false;
						}
					}
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}

			return true;
		}
	}], [{
		key: 'buildFromObj',
		value: function buildFromObj(obj) {
			var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


			options = (0, _assign2.default)({}, options, obj.options);

			var blocks = [];
			if (obj.blocks) {
				var _iteratorNormalCompletion4 = true;
				var _didIteratorError4 = false;
				var _iteratorError4 = undefined;

				try {
					for (var _iterator4 = (0, _getIterator3.default)(obj.blocks), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
						var block = _step4.value;

						if (Array.isArray(block)) {
							blocks.push(block);
						} else {
							blocks.push(Block.buildFromObj(block, options));
						}
					}
				} catch (err) {
					_didIteratorError4 = true;
					_iteratorError4 = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion4 && _iterator4.return) {
							_iterator4.return();
						}
					} finally {
						if (_didIteratorError4) {
							throw _iteratorError4;
						}
					}
				}
			}

			return new Block((0, _extends3.default)({}, obj, { blocks: blocks, options: options }));
		}
	}]);
	return Block;
}();

/**
 * Exporter.
 */


var Exporter = exports.Exporter = function (_Block) {
	(0, _inherits3.default)(Exporter, _Block);

	function Exporter(_ref2) {
		var name = _ref2.name,
		    _ref2$selector = _ref2.selector,
		    selector = _ref2$selector === undefined ? null : _ref2$selector,
		    _ref2$filename = _ref2.filename,
		    filename = _ref2$filename === undefined ? null : _ref2$filename,
		    _ref2$options = _ref2.options,
		    options = _ref2$options === undefined ? {} : _ref2$options,
		    _ref2$variables = _ref2.variables,
		    variables = _ref2$variables === undefined ? {} : _ref2$variables,
		    _ref2$inputs = _ref2.inputs,
		    inputs = _ref2$inputs === undefined ? [] : _ref2$inputs,
		    _ref2$blocks = _ref2.blocks,
		    blocks = _ref2$blocks === undefined ? [] : _ref2$blocks;
		(0, _classCallCheck3.default)(this, Exporter);

		var _this2 = (0, _possibleConstructorReturn3.default)(this, (Exporter.__proto__ || (0, _getPrototypeOf2.default)(Exporter)).call(this, { selector: selector, filename: filename, variables: variables, blocks: blocks, options: (0, _assign2.default)({}, DEFAULT_OPTIONS, options) }));

		_this2.operations = {

			if: function _if(_ref3) {
				var variable = _ref3.variable,
				    ifTrue = _ref3.ifTrue,
				    ifFalse = _ref3.ifFalse;

				if (this.eval(variable)) {
					return this.eval(ifTrue);
				} else {
					return this.eval(ifFalse);
				}
			},

			postInc: function postInc(_ref4) {
				var variable = _ref4.variable;
				return this.select(this.path(variable), null, '++');
			},

			pad: function pad(_ref5) {
				var variable = _ref5.variable,
				    _ref5$length = _ref5.length,
				    length = _ref5$length === undefined ? 3 : _ref5$length,
				    _ref5$character = _ref5.character,
				    character = _ref5$character === undefined ? '0' : _ref5$character;

				var pad = '';
				for (var i = length; i--;) {
					pad += character;
				}

				return (pad + this.eval(variable)).slice(-length);
			},

			lookup: function lookup(_ref6) {
				var obj = _ref6.obj,
				    path = _ref6.path;

				return _select(this.eval(obj), this.eval(path));
			},

			concat: function concat(_ref7) {
				var variable = _ref7.variable,
				    _ref7$spacer = _ref7.spacer,
				    spacer = _ref7$spacer === undefined ? '' : _ref7$spacer;
				return this.eval(variable).join(spacer);
			}
		};


		_this2.name = name;
		_this2.inputs = inputs;
		return _this2;
	}

	(0, _createClass3.default)(Exporter, [{
		key: 'write',
		value: function write(data) {
			var variables = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

			var formatter = new Formatter(this.operations, variables, this.options);
			(0, _get3.default)(Exporter.prototype.__proto__ || (0, _getPrototypeOf2.default)(Exporter.prototype), 'write', this).call(this, data, formatter);
		}
	}, {
		key: 'validate',
		value: function validate() {
			var formatter = new Formatter(this.operations, {}, this.options);
			return (0, _get3.default)(Exporter.prototype.__proto__ || (0, _getPrototypeOf2.default)(Exporter.prototype), 'validate', this).call(this, formatter);
		}
	}, {
		key: 'registerOperation',
		value: function registerOperation(name, fn) {
			this.operations[name] = fn;
		}
	}], [{
		key: 'buildFromObj',
		value: function buildFromObj(obj) {
			try {

				var inputs = [];
				if (obj.inputs) {
					var _iteratorNormalCompletion5 = true;
					var _didIteratorError5 = false;
					var _iteratorError5 = undefined;

					try {
						for (var _iterator5 = (0, _getIterator3.default)(obj.inputs), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
							var input = _step5.value;

							inputs.push(Input.buildFromObj(input));
						}
					} catch (err) {
						_didIteratorError5 = true;
						_iteratorError5 = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion5 && _iterator5.return) {
								_iterator5.return();
							}
						} finally {
							if (_didIteratorError5) {
								throw _iteratorError5;
							}
						}
					}
				}

				return new Exporter((0, _extends3.default)({}, Block.buildFromObj(obj, DEFAULT_OPTIONS), {
					name: obj.name,
					inputs: inputs
				}));
			} catch (e) {
				throw new Error('Failed to build exporter from obj', e);
			}
		}
	}, {
		key: 'buildFromFile',
		value: function buildFromFile(filename) {
			try {
				var contents = fs.readFileSync(filename, 'utf8');
				var obj = JSON.parse(contents);

				return Exporter.buildFromObj(obj);
			} catch (e) {
				throw new Error('Failed to build exporter from file "' + filename + '"', e);
			}
		}
	}]);
	return Exporter;
}(Block);

/**
 * Input.
 */


var Input = exports.Input = function () {
	function Input(_ref8) {
		var type = _ref8.type,
		    name = _ref8.name,
		    label = _ref8.label,
		    description = _ref8.description;
		(0, _classCallCheck3.default)(this, Input);

		this.type = type;
		this.name = name;
		this.label = label;
		this.description = description;
	}

	(0, _createClass3.default)(Input, null, [{
		key: 'buildFromObj',
		value: function buildFromObj(obj) {
			return new Input(obj);
		}
	}]);
	return Input;
}();

/* internals */

/**
 * Formatter.
 */


var Formatter = function () {
	function Formatter(operations) {
		var variables = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
		var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
		(0, _classCallCheck3.default)(this, Formatter);

		this.operations = operations;
		this.variables = variables;
		this.options = options;
	}

	(0, _createClass3.default)(Formatter, [{
		key: 'apply',
		value: function apply() {
			var variables = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
			var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

			if ((0, _keys2.default)(variables).length) {
				variables = (0, _assign2.default)({}, this.eval(variables));
			}

			// make vars scoped, use this: Object.assign({}, this.variables, variables)
			return new Formatter(this.operations, (0, _assign2.default)(this.variables, variables), (0, _assign2.default)({}, this.options, options));
		}
	}, {
		key: 'validate',
		value: function validate(obj) {
			return true;
		}
	}, {
		key: 'validateSelector',
		value: function validateSelector(selector) {
			return true;
		}
	}, {
		key: 'evalAndformat',
		value: function evalAndformat(data) {
			return this.format(this.eval(data));
		}
	}, {
		key: 'eval',
		value: function _eval(data) {
			var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
			var maxDepth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

			if (typeof data == 'string') {
				return this.evalString(data);
			} else {
				return this.evalObject(data, depth, maxDepth);
			}
		}
	}, {
		key: 'evalString',
		value: function evalString(str) {
			str.trim();
			if (str[0] == '$' && str[1] == '{' && str[str.length - 1] == '}') {
				return this.select(str.substring(2, str.length - 1));
			} else {
				return str;
			}
		}
	}, {
		key: 'evalObject',
		value: function evalObject(data) {
			var depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
			var maxDepth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;


			// ignore null or not an object
			if (!data || (typeof data === 'undefined' ? 'undefined' : (0, _typeof3.default)(data)) != 'object') {
				return data;
			}

			// check for operations and check recursive until max depth
			if (data.type && this.operations[data.type]) {
				return this.operations[data.type].call(this, data);
			} else {
				if (depth < maxDepth) {

					var evaluated = void 0;

					if (Array.isArray(data)) {
						evaluated = [];
						var _iteratorNormalCompletion6 = true;
						var _didIteratorError6 = false;
						var _iteratorError6 = undefined;

						try {
							for (var _iterator6 = (0, _getIterator3.default)(data), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
								var element = _step6.value;

								evaluated.push(this.eval(element, depth + 1, maxDepth));
							}
						} catch (err) {
							_didIteratorError6 = true;
							_iteratorError6 = err;
						} finally {
							try {
								if (!_iteratorNormalCompletion6 && _iterator6.return) {
									_iterator6.return();
								}
							} finally {
								if (_didIteratorError6) {
									throw _iteratorError6;
								}
							}
						}
					} else {
						evaluated = {};
						for (var key in data) {
							evaluated[key] = this.eval(data[key], depth + 1, maxDepth);
						}
					}

					return evaluated;
				} else {
					return data;
				}
			}
		}
	}, {
		key: 'format',
		value: function format(data) {
			switch (typeof data === 'undefined' ? 'undefined' : (0, _typeof3.default)(data)) {
				case 'number':
					return this.formatNumber(data);
				case 'string':
					return this.formatString(data);
			}

			return data;
		}
	}, {
		key: 'formatNumber',
		value: function formatNumber(num) {
			if (this.options.numType == 'int') {
				return parseInt(num);
			} else {
				num = parseFloat(num);
				if (this.options.floatPrecision != null) {
					return num.toFixed(this.options.floatPrecision);
				}
			}
		}
	}, {
		key: 'formatString',
		value: function formatString(str) {
			var _this3 = this;

			return str.replace(/\${([^}]+)}/g, function (reference, path) {

				var val = _this3.select(path.split('.'));

				if (typeof val == 'number') {
					return _this3.formatNumber(val);
				} else {
					return val;
				}
			});
		}
	}, {
		key: 'path',
		value: function path(str) {
			return str.replace(/\${([^}]+)}/g, function (reference, path) {
				return path.split('.');
			});
		}
	}, {
		key: 'select',
		value: function select() {
			var path = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
			var val = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
			var operator = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;

			return _select(this.variables, path, val, operator);
		}
	}]);
	return Formatter;
}();

/* utility */

function safeWrite(stream) {
	var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

	return stream.write(data);
}

function _select(obj) {
	var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
	var val = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
	var operator = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;


	// ignore undefined
	if (obj === undefined) {
		return;
	}

	// run function if at a leaf
	if (path == null || !path.length) {
		return obj;
	}

	// convert a str path to an array
	if (typeof path == 'string') {
		path = path.split('.');
	}

	// convert any to an array
	if ((typeof path === 'undefined' ? 'undefined' : (0, _typeof3.default)(path)) != 'object') {
		path = [path];
	}

	// make a shallow copy of the path and get the next
	path = path.slice();
	var next = path.shift();

	// if obj is an array, compare against an index
	if (Array.isArray(obj)) {
		next = parseInt(next);
	}

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

	return _select(obj[next], path);
}

function runOnPath(obj) {
	var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
	var variables = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
	var fn = arguments[3];


	// ignore undefined
	if (obj === undefined) {
		return;
	}

	// auto size path
	if (path && !Array.isArray(path)) {
		path = [path];
	}

	// run function if at a leaf
	if (!path.length) {
		fn(obj, variables);
		return;
	}

	// ignore non objects
	if ((typeof obj === 'undefined' ? 'undefined' : (0, _typeof3.default)(obj)) != 'object') {
		return;
	}

	// make a shallow copy of the path
	path = path.slice();

	// remove and keep the first path
	var firstKey = path.shift();

	// ignore empty keys
	if (!firstKey.length) {
		return;
	}

	// match all
	if (firstKey[0] == '(') {

		firstKey = firstKey.substring(1, firstKey.length - 1);

		if (Array.isArray(obj)) {
			for (var i = 0; i < obj.length; ++i) {
				runOnPath(obj[i], path, (0, _assign2.default)({}, variables, (0, _defineProperty3.default)({}, firstKey, { key: i, obj: obj[i] })), fn);
			}
		} else {
			for (var key in obj) {
				runOnPath(obj[key], path, (0, _assign2.default)({}, variables, (0, _defineProperty3.default)({}, firstKey, { key: key, obj: obj[key] })), fn);
			}
		}

		// match one
	} else {
		runOnPath(obj[firstKey], path, variables, fn);
	}
}

function runOnSelector(obj, selector, variables, fn) {
	if (Array.isArray(selector)) {
		var _iteratorNormalCompletion7 = true;
		var _didIteratorError7 = false;
		var _iteratorError7 = undefined;

		try {
			for (var _iterator7 = (0, _getIterator3.default)(selector), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
				var subSelector = _step7.value;

				runOnPath(obj, subSelector.path.split('.'), (0, _assign2.default)({}, variables, subSelector.variables), fn);
			}
		} catch (err) {
			_didIteratorError7 = true;
			_iteratorError7 = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion7 && _iterator7.return) {
					_iterator7.return();
				}
			} finally {
				if (_didIteratorError7) {
					throw _iteratorError7;
				}
			}
		}
	} else if (typeof selector == 'string') {
		runOnPath(obj, selector.split('.'), variables, fn);
	}
}