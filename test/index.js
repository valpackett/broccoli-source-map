'use strict'

var fs = require('fs')
var path = require('path')
var test = require('tape')
var broccoli = require('broccoli')
var sourceMap = require('../')

function fixt (n) { return path.join('test/fixtures', n) }

test('inline', function (t) {
	t.plan(1)
	var builder = new broccoli.Builder(new sourceMap.SourceMapInliner([fixt('compiled-as-external')]))
	builder.build().then(function (result) {
		t.equal(
			fs.readFileSync(path.join(result.directory, 'example-es6.js'), {encoding: 'utf8'}).replace('\n\n\n\n', '\n\n'),
			fs.readFileSync(fixt('compiled-as-inline/example-es6.js'), {encoding: 'utf8'})
		)
	}).catch(t.end).finally(function (_) {
		builder.cleanup()
	})
})

test('extract', function (t) {
	t.plan(2)
	var builder = new broccoli.Builder(new sourceMap.SourceMapExtractor([fixt('compiled-as-inline')]))
	builder.build().then(function (result) {
		t.equal(
			fs.readFileSync(path.join(result.directory, 'example-es6.js'), {encoding: 'utf8'}).replace('\n\n\n', '\n\n') + '\n',
			fs.readFileSync(fixt('compiled-as-external/example-es6.js'), {encoding: 'utf8'})
		)
		t.equal(
			fs.readFileSync(path.join(result.directory, 'example-es6.js.map'), {encoding: 'utf8'}),
			fs.readFileSync(fixt('compiled-as-external/example-es6.js.map'), {encoding: 'utf8'})
		)
	}).catch(t.end).finally(function (_) {
		builder.cleanup()
	})
})
