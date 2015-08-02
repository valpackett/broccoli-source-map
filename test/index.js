'use strict'

var fs = require('fs')
var path = require('path')
var expect = require('expect.js')
var broccoli = require('broccoli')
var sourceMap = require('..')

function fixt(n) { return path.join('test/fixtures', n) }

describe('sourceMap', function() {
	it('inlines', function() {
		return new broccoli.Builder(sourceMap.inline(fixt('compiled-as-external')))
			.build().then(function(result) {
				expect(
					fs.readFileSync(path.join(result.directory, 'example-es6.js'), {encoding: 'utf8'}).replace('\n\n\n\n', '\n\n')
				).to.eql(
					fs.readFileSync(fixt('compiled-as-inline/example-es6.js'), {encoding: 'utf8'})
				)
			})
	})

	it('extracts', function() {
		return new broccoli.Builder(sourceMap.extract(fixt('compiled-as-inline')))
			.build().then(function(result) {
				expect(
					fs.readFileSync(path.join(result.directory, 'example-es6.js'), {encoding: 'utf8'}).replace('\n\n\n', '\n\n') + '\n'
				).to.eql(
					fs.readFileSync(fixt('compiled-as-external/example-es6.js'), {encoding: 'utf8'})
				)
				expect(
					fs.readFileSync(path.join(result.directory, 'example-es6.js.map'), {encoding: 'utf8'})
				).to.eql(
					fs.readFileSync(fixt('compiled-as-external/example-es6.js.map'), {encoding: 'utf8'})
				)
			})
	})
})
