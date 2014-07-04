'use strict';
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var walkSync = require('walk-sync');
var convert = require('convert-source-map');
var CachingWriter = require('broccoli-caching-writer');

function SourceMapInliner(inputTree) {
	if (!(this instanceof SourceMapInliner)) return new SourceMapInliner(inputTree);
	this.inputTree = inputTree;
}
SourceMapInliner.prototype = Object.create(CachingWriter.prototype);
SourceMapInliner.prototype.constructor = SourceMapInliner;
SourceMapInliner.prototype.updateCache = function(srcDir, destDir) {
	walkSync(srcDir).forEach(function(relativePath) {
		if (relativePath.slice(-1) === '/') {
			mkdirp.sync(path.join(destDir, relativePath));
		} else if (relativePath.slice(-4) !== '.map') {
			var srcPath = path.join(srcDir, relativePath);
			var destPath = path.join(destDir, relativePath);
			var srcCode = fs.readFileSync(srcPath, {encoding: 'utf-8'});
			var smap = convert.fromMapFileSource(srcCode, srcDir);
			if (smap !== null) {
				if (typeof smap.getProperty('sourcesContent') === 'undefined' && typeof smap.getProperty('sources') !== 'undefined') {
					var contents = smap.getProperty('sources').map(function(spath) {
						return fs.readFileSync(path.join(srcDir, spath), {encoding: 'utf-8'});
					});
					smap = smap.setProperty('sourcesContent', contents);
				}
				fs.writeFileSync(destPath, convert.removeMapFileComments(srcCode) + '\n' + smap.toComment());
			} else {
				fs.writeFileSync(destPath, srcCode);
			}
		}
	});
}

module.exports = {
	inline: SourceMapInliner
}
