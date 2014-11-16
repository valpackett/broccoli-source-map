'use strict';
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var walkSync = require('walk-sync');
var convert = require('convert-source-map');
var CachingWriter = require('broccoli-caching-writer');

function _genMkdirOrProcess(destDir, process) {
	return function(relativePath) {
		if (relativePath.slice(-1) === '/') {
			return mkdirp.sync(path.join(destDir, relativePath));
		} else {
			return process(relativePath);
		}
	}
}

function _isSourceMappableFile(path) {
	return path.slice(-3) === '.js'
		|| path.slice(-4) === '.css';
}

function SourceMapInliner(inputTree) {
	if (!(this instanceof SourceMapInliner)) return new SourceMapInliner(inputTree);
	this.inputTree = inputTree;
}
SourceMapInliner.prototype = Object.create(CachingWriter.prototype);
SourceMapInliner.prototype.constructor = SourceMapInliner;
SourceMapInliner.prototype.updateCache = function(srcDir, destDir) {
	walkSync(srcDir).forEach(_genMkdirOrProcess(destDir, function(relativePath) {
		if (_isSourceMappableFile(relativePath)) {
			var srcPath = path.join(srcDir, relativePath);
			var destPath = path.join(destDir, relativePath);
			var srcCode = fs.readFileSync(srcPath, {encoding: 'utf-8'});
			var smap = convert.fromMapFileSource(srcCode, srcDir);
			if (smap !== null && typeof smap['sourcemap'] !== 'undefined') {
				if (typeof smap.getProperty('sourcesContent') === 'undefined' && typeof smap.getProperty('sources') !== 'undefined') {
					var contents = smap.getProperty('sources').map(function(spath) {
						return fs.readFileSync(path.join(srcDir, spath), {encoding: 'utf-8'});
					});
					smap = smap.setProperty('sourcesContent', contents);
				}
				var comment = smap.toComment();
				if (destPath.slice(-4) === '.css') {
					comment = comment.replace(/^\/\//, '/*') + ' */';
				}
				fs.writeFileSync(destPath, convert.removeMapFileComments(srcCode) + '\n' + comment);
			} else {
				fs.writeFileSync(destPath, srcCode);
			}
		}
	}));
}

function SourceMapExtractor(inputTree) {
	if (!(this instanceof SourceMapExtractor)) return new SourceMapExtractor(inputTree);
	this.inputTree = inputTree;
}
SourceMapExtractor.prototype = Object.create(CachingWriter.prototype);
SourceMapExtractor.prototype.constructor = SourceMapExtractor;
SourceMapExtractor.prototype.updateCache = function(srcDir, destDir) {
	walkSync(srcDir).forEach(_genMkdirOrProcess(destDir, function(relativePath) {
		if (_isSourceMappableFile(relativePath)) {
			var srcPath = path.join(srcDir, relativePath);
			var destPath = path.join(destDir, relativePath);
			var srcCode = fs.readFileSync(srcPath, {encoding: 'utf-8'});
			var smap = convert.fromComment(srcCode, srcDir);
			if (smap !== null) {
				var comment = '//# sourceMappingURL=' + relativePath + '.map';
				if (destPath.slice(-4) === '.css') {
					comment = '/*# sourceMappingURL=' + relativePath + '.map */';
				}
				fs.writeFileSync(destPath, convert.removeComments(srcCode) + '\n' + comment);
				fs.writeFileSync(destPath + '.map', smap.toJSON());
			} else {
				fs.writeFileSync(destPath, srcCode);
			}
		}
	}));
}

module.exports = {
	inline: SourceMapInliner,
	extract: SourceMapExtractor
}
