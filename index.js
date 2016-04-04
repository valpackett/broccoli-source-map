'use strict'

var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var walkSync = require('walk-sync')
var convert = require('convert-source-map')
var CachingWriter = require('broccoli-caching-writer')
var _ = require('lodash')

function _genMkdirOrProcess (destDir, process) {
	return function (relativePath) {
		if (relativePath.slice(-1) === '/') {
			return mkdirp.sync(path.join(destDir, relativePath))
		} else {
			return process(relativePath)
		}
	}
}

function _isSourceMappableFile (path) {
	return path.slice(-3) === '.js'
		|| path.slice(-4) === '.css'
}

SourceMapProcessor.prototype = Object.create(CachingWriter.prototype)

SourceMapProcessor.prototype.constructor = SourceMapProcessor
function SourceMapProcessor (inputNodes, options) {
	options = options || {};
	if (!_.isArray(inputNodes))
		inputNodes = [inputNodes]
	CachingWriter.call(this, inputNodes, {
		annotation: options.annotation
	});
}

SourceMapProcessor.prototype.build = function () {
	var destDir = this.outputPath
	var self = this
	this.inputPaths.forEach(function (srcDir) {
		walkSync(srcDir).forEach(_genMkdirOrProcess(destDir, function (relativePath) {
			if (_isSourceMappableFile(relativePath)) {
				var srcPath = path.join(srcDir, relativePath)
				var destPath = path.join(destDir, relativePath)
				var srcCode = fs.readFileSync(srcPath, {encoding: 'utf-8'})
				self.processCode(srcCode, path.dirname(srcPath), destPath, relativePath)
			}
		}))
	})
}


SourceMapInliner.prototype = Object.create(SourceMapProcessor.prototype)

SourceMapInliner.prototype.constructor = SourceMapInliner
function SourceMapInliner (inputNodes, options) {
	options = options || {};
	SourceMapProcessor.call(this, inputNodes, options);
}

SourceMapInliner.prototype.processCode = function (srcCode, srcDir, destPath, relativePath) {
	var smap = convert.fromMapFileSource(srcCode, srcDir)
	if (smap !== null && typeof smap['sourcemap'] !== 'undefined') {
		if (typeof smap.getProperty('sourcesContent') === 'undefined' && typeof smap.getProperty('sources') !== 'undefined') {
			var contents = smap.getProperty('sources').map(function (spath) {
				return fs.readFileSync(path.join(srcDir, spath), {encoding: 'utf-8'})
			})
			smap = smap.setProperty('sourcesContent', contents)
		}
		var comment = smap.toComment()
		if (destPath.slice(-4) === '.css') {
			comment = comment.replace(/^\/\//, '/*') + ' */'
		}
		fs.writeFileSync(destPath, convert.removeMapFileComments(srcCode) + '\n' + comment)
	} else {
		fs.writeFileSync(destPath, srcCode)
	}
}

SourceMapExtractor.prototype = Object.create(SourceMapProcessor.prototype)

SourceMapExtractor.prototype.constructor = SourceMapExtractor
function SourceMapExtractor (inputNodes, options) {
	options = options || {};
	SourceMapProcessor.call(this, inputNodes, options);
}

SourceMapExtractor.prototype.processCode = function (srcCode, srcDir, destPath, relativePath) {
	var smap = convert.fromComment(srcCode, srcDir)
	if (smap !== null) {
		var comment = '//# sourceMappingURL=' + path.basename(relativePath) + '.map'
		if (destPath.slice(-4) === '.css') {
			comment = '/*# sourceMappingURL=' + path.basename(relativePath) + '.map */'
		}
		fs.writeFileSync(destPath, convert.removeComments(srcCode) + '\n' + comment)
		fs.writeFileSync(destPath + '.map', smap.toJSON())
	} else {
		fs.writeFileSync(destPath, srcCode)
	}
}

module.exports = {
	inline: function (t, o) { return new SourceMapInliner(t, o) },
	extract: function (t, o) { return new SourceMapExtractor(t, o) },
	SourceMapInliner: SourceMapInliner,
	SourceMapExtractor: SourceMapExtractor
}
