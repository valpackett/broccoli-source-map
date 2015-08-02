'use strict'

var fs = require('fs')
var path = require('path')
var test = require('tape')
var broccoli = require('broccoli')
var sourceMap = require('../')

function fixt(n) { return path.join('test/fixtures', n) }

test('inline', function(t) {
	t.plan(1)
	new broccoli.Builder(sourceMap.inline(fixt('compiled-as-external')))
		.build().then(function(result) {
			t.equal(
				fs.readFileSync(path.join(result.directory, 'example-es6.js'), {encoding: 'utf8'}).replace('\n\n\n\n', '\n\n'),
				fs.readFileSync(fixt('compiled-as-inline/example-es6.js'), {encoding: 'utf8'})
			)
		})
})

test('extract', function(t) {
	t.plan(2)
	new broccoli.Builder(sourceMap.extract(fixt('compiled-as-inline')))
		.build().then(function(result) {
			t.equal(
				fs.readFileSync(path.join(result.directory, 'example-es6.js'), {encoding: 'utf8'}).replace('\n\n\n', '\n\n') + '\n',
				fs.readFileSync(fixt('compiled-as-external/example-es6.js'), {encoding: 'utf8'})
			)
			t.equal(
				fs.readFileSync(path.join(result.directory, 'example-es6.js.map'), {encoding: 'utf8'}),
				fs.readFileSync(fixt('compiled-as-external/example-es6.js.map'), {encoding: 'utf8'})
			)
		})
})
