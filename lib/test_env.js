// # TestEnv

// Test environment
// Standard things that all the tests might use

// `fixturePath()`

// `outputPath()`

// `basePath()`

// Setting `DEBUG_CLEAN=true mocha` does't clean up files. Lets you look at them after a test

const Promise = require('bluebird')
const path = require('path')
const debug = require('debug')('dply:test:helpers:test_env')
const klaw = require('klaw')
const escapeRegExp = require('lodash.escapeRegExp')
const randomHex =  require('./random_hex')
const { arrayOnNil } = require('./ensure_array')

const { TestEnvError,
      TestEnvFsError } = require('./errors')
const { TestEnvStatic } = require('./test_env_static')
const { TestEnvPath,
      TestEnvPathWriteable,
      TestEnvPathReadable,
      TestEnvPathOutput,
      TestEnvPathFixture } = require('./test_env_path')


class TestEnv {

  // Requires the path to your `test` directory that your
  // `fixture` and `output` directories live under.
  // This will normally be `__dirname` from where you required
  // this file.
  static init( base ){

    // The app base bath
    // Take a guess if the user doesn't provide one.
    // The guess removes `node_modules/@deployable/test/lib`.
    // If you are somehow referencing a sub module of a sub module
    // the guess will be wrong. Also if you `npm link`
    this.base_path = (!base)
      ? path.resolve(__dirname, '..', '..', '..', '..')
      : path.resolve(base)

    // Where the tests at
    this.test_dir_name = 'test'
    this.test_path = path.join(this.base_path, this.test_dir_name)

    // Fixtures in test
    this.fixture_dir = 'fixture'
    this.fixture_path = path.join(this.base_path, this.fixture_dir)

    // Output in test
    this.output_dir = 'output'
    this.output_path = path.join(this.base_path, this.output_dir)

    // The prefix used for a  tmp- dir in output
    this.tmp_output_dir_prefix = 'tmp-'

    // Attach modules for users
    this.path = path

    return this
  }

  static join (...args) { return path.join(...args) }
  static resolve (...args) { return path.resolve(...args) }

  // Remove a single directory from the end of a path, if it's there
  static trimDirNameFromPath(full_path, dir_name){
    let last = full_path.split(path.sep).pop()
    if ( last === dir_name ){
      full_path = path.join(full_path, '..')
      debug('Removed "%s" from base path "%s"', dir_name, full_path)
    }
    return full_path
  }


  static setupTestDir( base_path, options = {} ){
    options.strip_test_dir = true
    options.base_path = base_path
    return new this(options)
  }

  static setup( ...args ){
    return new this(...args)
  }
  // ## Instance

  constructor( options = {} ) {

    // Go up to the app base path. "node_modules/@deployable/test/lib"
    // If we are not a direct dependency of the app we are testing then :/
    if (!options.base_path) {
      this.base_path = path.resolve(__dirname, '..', '..', '..', '..')
    } else {
      let base_path = options.base_path
      if (base_path.join) base_path = path.join(...base_path)
      this.base_path = path.resolve(options.base_path)
    }
    debug('TestEnv base_path "%s"', this.base_path)

    // Where the tests at
    this.test_dir_name = options.test_dir_name || 'test'

    // Optionally remove the `test` dir from the end
    if ( options.strip_test_dir && this.base_path.split ) {
      this.base_path = TestEnv.trimDirNameFromPath(this.base_path, this.test_dir_name)
    }

    // The path object for the tests
    this.test_tep = new TestEnvPathReadable(this, this.test_path)

    // Path object for fixture directory in test
    this.fixture_dir = options.fixture_dir || 'fixture'
    this.fixture_tep = new TestEnvPathFixture(this, this.fixture_path)

    // Path object for output directory in test
    this.output_dir = options.output_dir || 'output'
    this.output_tep = new TestEnvPathOutput(this, this.output_path)

    // The prefix used for a  tmp- dir in output
    this.tmp_output_dir_prefix =
      options.tmp_prefix ||
      options.tmp_output_dir_prefix ||
      'tmp-'

    // Attach modules for users
    this.path = path

    debug('TestEnv new', this.base_path)
  }

  // Return the fixture dir
  get test_path(){
    return path.join(this.base_path, this.test_dir_name)
  }

  // // Return the fixture dir
  get fixture_path(){
    return path.join(this.base_path, this.test_dir_name, this.fixture_dir)
  }

  // // Return the output dir
  get output_path(){
    return path.join(this.base_path, this.test_dir_name, this.output_dir)
  }

  join (...args) { return path.join(...args) }
  resolve (...args) { return path.resolve(...args) }

  // Return dir joined to a path string
  // Deletes the path from the start of the join directory
  // argument in case it's already there
  // `/home/jim/test + /home/jim/test/2/3 = /home/jim/test/2/3`
  genericPath(path_str, arg, ...args) {
    if ( !arg ) {
      arg = ''
    } else {
      if ( arg.startsWith && arg.startsWith(path_str) ) return arg
    }
    return path.join(path_str, arg, ...args)
  }

  // #### `basePath(...args)`
  // Return a directory with `.join`  from base dir
  basePath(...args) {
    return this.genericPath(this.base_path, ...args)
  }

  // #### `testPath(...args)`
  // Return a directory with `.join` from test dir
  testPath(...args) {
    return this.genericPath(this.test_path, ...args)
  }

  // #### `fixturePath( ...args )`
  // Return a fixture directory + subdirs with `.join`
  fixturePath(...args){
    return this.genericPath(this.fixture_path, ...args)
  }

  // #### `outputPath( ...args )`
  // Return the output directory + subdirs with `.join`
  outputPath(...args){
    return this.genericPath(this.output_path, ...args)
  }

  // #### `outputTmpPath(suffix, ...extras)`
  // create a `tmp-<something>` dir in output
  //tmpOutputPath
  outputTmpPath(suffix, ...extras){
    if (suffix === undefined) suffix = randomHex(5)
    let path_str = this.tmp_output_dir_prefix + suffix
    return this.outputPath( path_str, ...extras )
  }

  // #### `checkFixturePath('dir','subdir')`
  //
  // Promise to check if a fixture exists.
  // Resolves `true` or `false`
  checkFixturePathAsync(...args){
    let fixture_path = this.fixturePath(...args)
    return TestEnvStatic.statAsync(fixture_path)
      .then(()=> true)
      .catch(error => {
        if ( error.code === 'ENOENT' ) return false
        throw error
      })
  }
  checkFixturePath(...args){
    return TestEnvStatic.existsSync(this.fixturePath(...args))
  }

  // #### `cleanAsync( dir, options = {} )`
  // Promise to clean the contents of a directory
  // ```
  // cleanAsync(dir)
  // cleanAsync(outside_dir, force: true)
  // ```
  cleanAsync(dir, options = {}){
    return new Promise((resolve, reject)=>{
      if (!dir)
        return reject(new TestEnvError('No dir to clean'))

      if (typeof dir !== 'string')
        return reject(new TestEnvError(`directory must be a string. ${typeof dir}`))

      // Be careful when deleting paths
      let base_path = this.basePath()
      if ( !dir.startsWith(base_path) && !options.force ) {
        return reject(new TestEnvError(`Can't clean outside of project without force option: ${dir}`))
      }

      // Be more careful when deleting paths
      if ( (dir === base_path || dir === `${base_path}/`) && !options.force ) {
        return reject(new TestEnvError(`Can't clean entire project without force option: ${dir}`))
      }

      // The environment variable `DEBUG_CLEAN` will turn off deletions
      if ( process.env.DEBUG_CLEAN ) {
        debug('clean debug - would have removed dir "%s"', dir)
        return resolve(dir)
      }

      // Now the actual remove. `rm -rf` equivelant, hence the checks
      debug('cleaning up dir "%s"', dir)
      return resolve(TestEnvStatic.emptyDirAsync(dir).then(res => {
        debug('cleaned up dir "%s"', dir)
        return res
      }))
    })
  }

  // #### `removeAsync( dir, options = {} )`
  // Promise to remove the a directory
  // ```
  // removeAsync(dir)
  // removeAsync(outside_dir, force: true)
  // ```
  removeAsync(dir, options = {}){
    return new Promise((resolve, reject)=>{
      if (!dir)
        return reject(new TestEnvError('No dir to remove'))

      if (typeof dir !== 'string')
        return reject(new TestEnvError(`directory must be a string. ${typeof dir}`))

      // Be careful when deleting paths
      let base_path = this.basePath()
      if ( !dir.startsWith(base_path) && !options.force ) {
        return reject(new TestEnvError(`Can't remove outside of project without force option: ${dir}`))
      }

      // Be more careful when deleting paths
      if ( (dir === base_path || dir === `${base_path}/`) && !options.force ) {
        return reject(new TestEnvError(`Can't remove entire project without force option: ${dir}`))
      }

      // The environment variable `DEBUG_CLEAN` will turn off deletions
      if ( process.env.DEBUG_CLEAN ) {
        debug('remove debug - would have removed dir "%s"', dir)
        return resolve(dir)
      }

      // Now the actual remove. `rm -rf` equivelant
      debug('remove removing dir "%s"', dir)
      return resolve(TestEnvStatic.removeAsync(dir).then(res => {
        debug('remove removed dir "%s"', dir)
        return res
      }))
    })
  }

  // #### `cleanAllOutputAsync()`
  // Clean everything in the `output/` dir
  cleanAllOutputAsync(){
    return new Promise((resolve) => {
      let dir = this.outputPath()
      debug('emptying output dir', dir)
      return resolve(this.cleanAsync(dir))
    })
  }

  // #### `cleanOutputAsync(subdir)`
  // Clean a named `output/subdir`
  cleanOutputAsync(subdir){
    return new Promise((resolve) => {
      if (!subdir) throw new TestEnvError('No subdir to clean')
      debug('cleaning up output dir "%s"', subdir)
      return resolve(this.cleanAsync( this.outputPath(subdir) ))
    })
  }

  // #### `cleanOutputAsync(subdir)`
  // Remove a named `output/subdir`
  removeOutputAsync(subdir){
    return new Promise((resolve) => {
      if (!subdir) throw new TestEnvError('No subdir to clean')
      debug('removing output dir "%s"', subdir)
      return resolve(this.removeAsync( this.outputPath(subdir) ))
    })
  }

  // #### `removeAllOutputTmpAsync()`
  // Removes any `tmp-*` dirs created (Named with `tmp_output_dir_prefix`)
  cleanAllOutputTmpAsync(){
    console.error('cleanAllOutputTmpAsync() has been deprecated. Use removeAllOutputTmpAsync() instead')
    this.removeAllOutputTmpAsync()
  }
  removeAllOutputTmpAsync(){
    return new Promise((resolve, reject) => {
      let output_dir = this.outputPath()
      let output_tmp = this.outputPath(this.tmp_output_dir_prefix)
      debug('cleaning all output tmp- directories dir', output_dir)

      let items = [] // files, directories, symlinks, etc

      klaw(output_dir)
        .on('readable', function () {
          let item
          while ( (item = this.read()) ) {
            debug('klaw clean found item', item.path)
            if ( item.path.startsWith(output_tmp) ) items.push(item.path)
          }
        })
        .on('error', reject)
        .on('end', function () {
          debug('klaw items', items.length) // => [ ... array of files]
          resolve(items)
        })
    }).then(items_to_delete => {
      return Promise.all(items_to_delete.map(item => this.removeAsync(item)))
    })

  }

  // #### `cleanOutputTmpAsync(suffix)`
  // Clean a named `output/tmp-suffix` dir
  cleanOutputTmpAsync(suffix){
    return new Promise((resolve) => {
      // Deal with a full tmp path
      suffix = this.removeTmpPrefixFromPath(suffix)
      let dir = this.outputTmpPath(suffix)
      debug('cleaning up tmp dir', dir)
      return resolve(this.cleanAsync( dir ))
    })
  }

  // #### `removeOutputTmpAsync(suffix)`
  // Remove a named `output/tmp-suffix` dir
  removeOutputTmpAsync(suffix){
    return new Promise((resolve) => {
      // Deal with a full tmp path
      suffix = this.removeTmpPrefixFromPath(suffix)
      let dir = this.outputTmpPath(suffix)
      debug('removing tmp dir', dir)
      return resolve(this.removeAsync( dir ))
    })
  }


  fixture(...args) { return new TestEnvPathFixture(this, this.fixturePath(...args)) }
  output(...args) { return new TestEnvPathOutput(this, this.outputPath(...args)) }
  outputTmp(...args) { return new TestEnvPathOutput(this, this.outputTmpPath(...args)) }


  // #### `mkdirOutputAsync(...args)`

  // Promise to make a directory in the `output/` dir.
  // Resolve a `TestEnvPath` for the new directory

  mkdirOutputAsync(...args){
    return new Promise((resolve) => {
      let out_dir = this.output(...args)
      let p = TestEnvStatic.mkdirsAsync( out_dir.path() )
        .then(()=> out_dir )
      resolve(p)
    })
  }

  // #### `mkdirOutput(...args)`
  //
  // Make an output directory synchronously.
  // makeOutput(...args){
  //   let out_dir = this.outputPath(...args)
  //   return TestEnvStatic.mkdirsSync(out_dir)
  // }


  // #### `mkdirOutputTmpAsync(suffix)`
  //
  // Promise to make a tmp- directory in output.
  // Resolve a `TestEnvPath` for the new directory

  mkdirOutputTmpAsync(suffix, ...paths){
    return new Promise((resolve) => {
      let out_dir = this.outputTmp(suffix, ...paths)
      let p = TestEnvStatic.mkdirsAsync( out_dir.path() )
        .then(()=> out_dir )
      resolve(p)
    })
  }

  // #### `mkdirOutputTmp(...args)`
  //
  // Make a tmp- directory synchronously in output.

  // makeOutputTmp(suffix, ...paths){
  //   let out_dir = this.outputTmpPath(suffix, ...paths)
  //   return resolve(TestEnvStatic.mkdirsSync(out_dir))
  // }


  // #### `removeTmpPrefixFromPath(tmppath)`
  removeTmpPrefixFromPath(tmppath){
    debug('removeTmpPrefixFromPath tmppath', tmppath)
    let tmp_path_prefix = this.outputPath(this.tmp_output_dir_prefix)
    let re = new RegExp( `^${escapeRegExp(tmp_path_prefix)}` )
    let str = tmppath.replace(re, '')
    debug('removeTmpPrefixFromPath new', str)
    return str
  }

  // #### `copyAsync(src, dest, options)`
  // Promise `fs-extra` copy.
  copyAsync(src, dest, options){
    return TestEnvStatic.copyAsync(src, dest, options)
  }

  // #### `copyFixtureToTmpOutputAsync(fixture_suffix)`
  // No output_suffix copies to a random output tmp dir
  // No fixture suffix copy all fixtures to a random output tmp dir
  copyFixtureToTmpOutputAsync(fixture_suffix){
    return new Promise((resolve) => {
      debug('copyFixtureTmpOutputAsync', fixture_suffix)
      let src = this.fixturePath(fixture_suffix)
      let dest = this.outputTmpPath(undefined, fixture_suffix)
      resolve( this.copyAsync(src, dest).then(()=> dest) )
    })
  }

  // #### `copyFixtureToOutputAsync(fixture_suffix, output_suffix = fixture_suffix)`
  // No output_suffix copies directly to output
  // No fixture suffix copies all fixtures to output
  copyFixtureToOutputAsync(fixture_suffix, output_suffix = fixture_suffix){
    return new Promise((resolve) => {
      debug('copyFixtureOutputAsync', fixture_suffix, output_suffix)

      let src = this.fixturePath(...arrayOnNil(fixture_suffix))
      let dest = this.outputPath(...arrayOnNil(output_suffix))
      resolve( this.copyAsync(src, dest).then(()=> dest) )
    })
  }

}

// Manually attach class static data as es2015 can't
// do this inside the class.
TestEnv.init()

module.exports = { TestEnv, TestEnvPath, TestEnvError }
