# broccoli-source-map [![npm version](https://img.shields.io/npm/v/broccoli-source-map.svg?style=flat)](https://www.npmjs.org/package/broccoli-source-map) [![npm downloads](https://img.shields.io/npm/dm/broccoli-source-map.svg?style=flat)](https://www.npmjs.org/package/broccoli-source-map) [![Dependency Status](https://img.shields.io/gemnasium/myfreeweb/broccoli-source-map.svg?style=flat)](https://gemnasium.com/myfreeweb/broccoli-source-map) [![WTFPL](https://img.shields.io/badge/license-WTFPL-brightgreen.svg?style=flat)](https://www.tldrlegal.com/l/wtfpl)

A [Broccoli] plugin for inlining or extracting [JavaScript source maps] using [convert-source-map].

[Broccoli]: https://github.com/joliss/broccoli
[JavaScript source maps]: http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/
[convert-source-map]: https://www.npmjs.org/package/convert-source-map

## Installation

```bash
$ npm install --save-dev broccoli-source-map
```

## Usage

```js
var sourceMap = require('broccoli-source-map');
var src = 'js_and_maps'; // probably something like: sweetjs('js', {sourceMap: true, readableNames: true});
var inlined = sourceMap.inline(src);
var extracted = sourceMap.extract(inlined);
```

### inline

`require('broccoli-source-map').inline` combines pairs of `.js` and `.js.map` (`.css` and `.css.map`) files into one `.js` (`.css`) file that contains the source map as a base64 URL comment.
If the map contains file references in the `sources` field, but not the `sourcesContent` field, it will also inline the files into that field to make the compiled file independent of the source file.
This is very useful if you want to use [broccoli-browserify] because browserify reads inline source maps, but not external ones.

[broccoli-browserify]: https://github.com/gingerhendrix/broccoli-browserify

### extract

`require('broccoli-source-map').extract` extracts source maps from base64 URL comments of `.js` (`.css`) files into separate `.js.map` (`.css.map`) files, just like [exorcist].

[exorcist]: https://github.com/thlorenz/exorcist

## License

Copyright © 2014 [myfreeweb](https://github.com/myfreeweb)
This work is free. You can redistribute it and/or modify it under the
terms of the Do What The Fuck You Want To Public License, Version 2,
as published by Sam Hocevar. See the COPYING file for more details.
