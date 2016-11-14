# alle-publish

[![Build Status][travis-image]][travis-url]
[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]

[travis-url]: https://travis-ci.org/tlvince/alle-publish
[travis-image]: https://img.shields.io/travis/tlvince/alle-publish.svg
[npm-url]: https://www.npmjs.com/package/alle-publish
[npm-image]: https://img.shields.io/npm/v/alle-publish.svg
[license-url]: https://opensource.org/licenses/MIT
[license-image]: https://img.shields.io/npm/l/alle-publish.svg

> An approximation of Lerna publish using alle

1. Walk through a packages dir
2. Collect package dependencies through static analysis
3. Merge top-level `package.json` metadata
4. Publish packages

## Installation

```shell
npm install --save-dev alle-publish
```

## Usage

Have something bump the `version` of the parent package, then call
`alle-publish`.

## Options

Looks for the nearest `.allerc` in JSON format (example shown here in JS for
comments).

```js
{
  // optional scoped package support
  scope: '@myorg',
  // package.json template extended into parent package
  template: {
    main: 'index.js',
    // supports private registries
    publishConfig: {
      registry: 'http://example.com'
    }
  },
  // pull these properties from the parent package.json
  extends: [
    'repository',
    'keywords',
    'bugs',
    'homepage',
    'license',
    'author'
  ],
  // optionally transform resolved dependencies during static analysis
  transformers: {
    // npm package/a package in node_modules
    // option or list of options passed to the transformer
    'allo-replace-transformer': {
      pattern: '/foo/',
      replacement: 'bar'
    }
  }
}
```

## Author

© 2016 Tom Vincent <git@tlvince.com> (https://tlvince.com)

## License

Released under the [MIT license](http://tlvince.mit-license.org).
