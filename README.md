# [Deployable Test Helpers](https://github.com/deployable/node-deployable-test)

## @deployable/test

Collection of Node.js Test Helpers.

`TestEnv` sets up up a read/write environment that can be easily cleaned up
after a test run.

## Install

```bash
    npm install @deployable/test --save-dev
    yarn add @deployable/test --dev
```

## Usage

See [examples](examples/README.md) for more

```javascript
let test_env, out

before('Copy `files` from fixtures', function(){
  test_env = TestEnv.setupTestDir(__dirname, { test_dir: 'examples' })
  out = test_env.output('newdir')
  return out.copyFrom('files', 'subdir')
})

after('Cleanup', function(){
  return out.clean()
})

it('should now have fixtures in the output directory', function(){
  let dir = out.path('subdir')
  expect( dir ).to.be.a.directory().with.contents(['firstfile'])
})

it('should write a file to output', function(){
  let file = out.path('subdir', 'testfile')
  return fs.writeFileAsync(file, 'data\n').then( ()=> {
    expect( path.join(__dirname,'output','newdir','subdir','testfile') ).to.be.a.file()
  })
})
```

Setting `DEBUG_CLEAN=true` in your environment prevents cleanup so
you can inspect file after test runs

```shell
DEBUG_CLEAN=true mocha -b
```

## API

### TestEnv Path

- [path()](#path-test_dir-)
- [copy()](#copy-test_dir-)

#### TestEnv Output

- [clean()](#copyto-test_dir-)
- [copyTo()](#copyto-test_dir-s)

#### TestEnv Fixture

- [copyFrom()](#copyfrom-test_dir-)


### TestEnv

- [TestEnv.setup()](#testenvsetup-test_dir-)
- [TestEnv.setupTestDir()](#testenvsetuptestdir-test_dir-)
- [TestEnv.join()](#testenvsetuptestdir-test_dir-)
- [TestEnv.resolve()](#testenvsetuptestdir-test_dir-)
- [basePath()](#basepathargs)
- [fixturePath()](#fixturepathargs)
- [outputPath()](#outputpathargs)
- [tmpOutputPath()](#tmpoutputpathsuffix-extras)
- [randomHex()](#randomhexn)
- [cleanAsync()](#cleanasyncdir)
- [cleanAllOutputAsync()](#cleanalloutputasync)
- [cleanOutputAsync()](#cleanoutputasyncsubdir)
- [cleanAllOutputTmpAsync()](#cleanalloutputtmpasync)
- [cleanOutputTmpAsync()](#cleanoutputtmpasyncsuffix)
- [mkdirOutputAsync()](#mkdiroutputasyncargs)
- [mkdirOutputTmpAsync()](#mkdiroutputtmpasyncsuffix)
- [removeTmpPrefixFromPath()](#removetmpprefixfrompathtmppath)
- [copyAsync()](#copyasyncsrc-dest-options)
- [copyFixtureToTmpOutputAsync()](#copyfixturetotmpoutputasyncfixture_suffix)
- [copyFixtureToOutputAsync()](#copyfixturetooutputasyncfixture_suffix-output_suffix)

### TestEnv Path

----
##### `.path( test_dir )`

----
##### `copy( test_dir )`

#### TestEnv Output

----
##### `copyTo( test_dir )`

Promise to copy data to this Output or path from a Fixture or path


----
##### clean()

Clean this TestEnvPath


----
#### TestEnv Fixture

----
##### `copyFrom( test_dir )`

Promise to copy data from this Fixture or path to an Output or path

### TestEnv

----
#### `TestEnv.setup( test_dir )`

Requires the path to your `test` directory that your
`fixture` and `output` directories live under.
This will normally be `__dirname` from where you required

Properties:

 - `base_path`<br>
    The test base bath to use.
    Take a guess if the user doesn't provide one.
    The guess removes the `node_modules/@deployable/test/lib` dirs.

 - `test_dir`<br>
    This directory will be appended to `base_path` that contains your tests.
    Defaults to: `test`

 - `fixture_dir`<br>
    This directory will be appended to `test_dir` and contains your fixtures.
    Defaults to: `fixture`

 - `output_dir`<br>
    This directory will be appended to `test_dir` for test output.
    Defaults to: `output`

-  `tmp_output_dir_prefix`
    The prefix used for a temp dirs in output. Defaults to `tmp-`

----
#### `TestEnv.setupTestDir( test_dir )`

Same as above but auto strips the test directory (`test_dir`) from the
end of the provided path.
Allows `TestEnv.setupTestDir( __dirname )` from test files

----
#### `basePath(...args)`

Return a directory path from TestEnv `base_path`.
Joins all arguments with `path.join`

----
#### `fixturePath(...args)`

Return a directory path from the `fixture/` path
Joins all arguments with `path.join`

```javascript
TestEnv.fixturePath('a', 'b')
// = '/project/test/fixture/a/b'
```

----
#### `outputPath(...args)`

Return a directory from the `output/` path
Joins all arguments with `path.join`

```javascript
TestEnv.outputPath('one', 'two')
// = '/project/test/output/one/two'
```

----
#### `tmpOutputPath(suffix, ...extras)`

Return a random tmp dir path in the output path

```javascript
TestEnv.tmpOutputPath('blah', 'one', 'two')
// = '/project/test/output/tmp-blah/one/two'
```

----
#### `randomHex(n)`

Create a random hex string n chars long

```javascript
TestEnv.randomHex(5)
// = 'c8fd2'
```

----
#### `cleanAsync(dir)`

Promise to clean a directory that must be inside the base path.

`DEBUG_CLEAN` makes this skip the removals


----
#### `cleanAllOutputAsync()`

Promise to clean everything in the `output/` dir

`DEBUG_CLEAN` makes this skip the removals


----
#### `cleanOutputAsync(subdir)`

Promise to clean a named `output/subdir`

`DEBUG_CLEAN` makes this skip the removals


----
#### `cleanAllOutputTmpAsync()`

Promise to clean any `tmp-*` dirs created (Named with `tmp_output_dir_prefix`)

`DEBUG_CLEAN` makes this skip the removals


----
#### `cleanOutputTmpAsync(suffix)`

Promise to clean a named `output/tmp-suffix` dir

`DEBUG_CLEAN` makes this skip the removals


----
#### `mkdirOutputAsync(...args)`

Promise to make the named directorys in `output/`.


----
#### `mkdirOutputTmpAsync(suffix)`

Promise to make a temp directory `output/tmp-${suffix}`.


----
#### `removeTmpPrefixFromPath(tmppath)`

Remove the current temp directory from a path

```javascript
TestEnv.removeTmpPrefixFromPath('/project/test/output/tmp-output/whatever')
// = 'output/whatever'
```

----
#### `copyAsync(src, dest, options)`

Promise to copt a directory to a destination


----
#### `copyFixtureToTmpOutputAsync(fixture_suffix)`

Promise to copy a `fixture/` path to `output/tmp-{random}`


----
#### `copyFixtureToOutputAsync(fixture_suffix, output_suffix)`

Promise to copy a `fixture/` path to `output/`

```javascript
TestEnv.copyFixtureToOutputAsync('config', 'somedir')
// = cp -r /project/test/fixture/config /project/test/output/somedir
```


## About

@deployable/test is released under the MIT license.

Copyright 2017 Matt Hoyle - code at deployable.co

https://github.com/deployable/node-deployable-test

