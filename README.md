# [Deployable Test Helpers](https://github.com/deployable/node-deployable-test)

## Title

Node Test Environment Helpers

## Install

    npm install @deployable/test --save-dev

    yarn add @deployable/test --dev

## Usage

```javascript

const { TestEnv } = require('@deployable/test')
TestEnv.init(__dirname) // Should contains `fixture` and `output`
TestEnv.fixturePath('something') //=> /users/you/project/test/fixture/something

```

Setting `DEBUG_CLEAN=true` in your environment prevents cleanup so
you can inspect file after test runs

```
DEBUG_CLEAN=true mocha -b
```

## API

### `TestEnv.init( test_dir )`

Requires the path to your `test` directory that your
`fixture` and `output` directories live under.
This will normally be `__dirname` from where you required

Options:

 - `base_path`<br>
   The test base bath to use.
   Take a guess if the user doesn't provide one.
   The guess removes the `node_modules/@deployable/test/lib` dirs.

 - `fixture_dir`<br>
    This directory with to be appended to `base_path` that contains your fixures.
    Defaults to: `fixture`

 - `output_dir`<br>
    This directory with to be appended to `base_path` to create tese output in.
    Defaults to: `output`

-  `tmp_output_dir_prefix`
    The prefix used for a temp dirs in output. Defaults to `tmp-`


### `basePath(...args)`

Return a dir from `base_path` dir

### `fixturePath(...args)`

Return a dir path in the fixtures path

### `outputPath(...args)`

Return a dir path in the output path

### `tmpOutputPath(suffix, ...extras)`

Return a random tmp dir path in the output path

### `randomHex(n)`

Create a random hex string n chars long

### `clean(dir)`

Promise to clean a directory that must be inside the base path.

`DEBUG_CLEAN` makes this skip the rm

### `cleanAllOutputAsync()`

Clean everything in the `output/` dir

### `cleanOutputAsync(subdir)`

Clean a named `output/subdir`

### `cleanAllOutputTmpAsync()`

Cleans any `tmp-*` dirs created (Named with `tmp_output_dir_prefix`)

### `cleanOutputTmpAsync(suffix)`

Clean a named `output/tmp-suffix` dir

### `mkdirOutputAsync(...args)`

### `mkdirOutputTmpAsync(suffix)`

### `removeTmpPrefixFromPath(tmppath)`

### `copyAsync(src, dest, options)`

### `copyFixtureToTmpOutputAsync(fixture_suffix)`

No output_suffix copies to a random output tmp dir

No fixture suffix copies all fixtures to a random output tmp dir


### `copyFixtureToOutputAsync(fixture_suffix, output_suffix)`

No output_suffix copies directly to output
No fixture suffix copies all fixtures to output


## About

@deployable/test is released under the MIT license.

Copyright 2016 Matt Hoyle - code at deployable.co

https://github.com/deployable/node-deployable-test

