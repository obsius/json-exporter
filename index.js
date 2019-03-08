/**
 * JsonExporter
 *
 * A small library that takes in a JSON spec describing how to export a known JS object to a file or stream. 
 *
 * Author: Jeff Seaman
 * Date: March 7, 2019
 */
 
const JsonExporter = require('./lib/JsonExporter');
 module.exports = {
	Exporter: JsonExporter.Exporter,
	Block: JsonExporter.Block,
	Input: JsonExporter.Input
 };