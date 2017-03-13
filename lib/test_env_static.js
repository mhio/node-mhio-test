// # TestEnv

// Test environment
// Standard things that all the tests might use

// `fixturePath()`

// `outputPath()`

// `basePath()`

// Setting `DEBUG_CLEAN=true mocha` does't clean up files. Lets you look at them after a test

const Promise = require('bluebird')
const path = require('path')
const fse = Promise.promisifyAll(require('fs-extra'))
const debug = require('debug')('dply:test:helpers:test_env')
const klaw = require('klaw')
const escapeRegExp = require('lodash.escapeRegExp')
const randomHex =  require('./random_hex')


const { TestEnvError } = require('./errors')

// User facing interface to TestEnv methods for a specific path

class TestEnvStatic {

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
      ? path.resolve(__dirname, '..', '..', '..', '..', 'test')
      : path.resolve(base)

    if ( ! fse.existsSync(this.base_path) )
      console.error(`TestEnvStatic base path does not exist "${this.base_path}"`)

    // Fixtures in test
    this.fixture_dir = 'fixture'
    this.fixture_path = path.join(this.base_path, 'fixture')

    // Output in test
    this.output_dir = 'output'
    this.output_path = path.join(this.base_path, 'output')

    // The prefix used for a  tmp- dir in output
    this.tmp_output_dir_prefix = 'tmp-'

    // Attach modules for users
    this.path = path
    this.fse = fse

    return this
  }

  static join (...args) { return path.join(...args) }
  static resolve (...args) { return path.resolve(...args) }

  // Return a dir from base dir
  static basePath(...args) {
    return path.join(this.base_path, ...args)
  }

  // Return the fixture dir
  static fixturePath(...args){
    return path.join(this.fixture_path, ...args)
  }

  // Return the output dir
  static outputPath(...args){
    return path.join(this.output_path, ...args)
  }

  // create a `tmp-<something>` dir in output
  static tmpOutputPath(suffix, ...extras){
    if (suffix === undefined) suffix = this.randomHex(5)
    let path_str = this.tmp_output_dir_prefix + suffix
    return this.outputPath( path_str, ...extras )
  }

  // #### `checkFixturePath('dir','subdir')`
  //
  // Promise to check if a fixture exists.
  // Resolves `true` or `false`
  static checkFixturePath(...args){
    let fixture_path = this.fixturePath(...args)
    return fse.statAsync(fixture_path)
      .then(()=> true)
      .catch(error => {
        debug('check error', error)
        if ( error.code === 'ENOENT' ) return false
        throw error
      })
  }

  // `cleanAsync(dir)`
  // `cleanAsync(outside_dir, force: true)`
  // `clean(dir)`
  static clean(...args){ return this.cleanAsync(...args) }
  static cleanAsync(dir, options = {}){
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

      // The environment variable `DEBUG_CLEAN` will turn off deletions
      if (process.env.DEBUG_CLEAN) {
        debug('debug would have cleaned up dir "%s"', dir)
        return resolve(dir)
      }

      // Now the actual remove. `rm -rf` equivelant
      debug('cleaning up dir "%s"', dir)
      return resolve(fse.removeAsync(dir).then(res => {
        debug('cleaned dir "%s"', dir)
        return res
      }))
    })
  }

  // `cleanAllOutputAsync()`
  // Clean everything in the `output/` dir
  static cleanAllOutputAsync(){
    return new Promise((resolve) => {
      let dir = this.outputPath()
      debug('emptying output dir', dir)
      return resolve(this.cleanAsync(dir))
    })
  }

  // `cleanOutputAsync(subdir)`
  // Clean a named `output/subdir`
  static cleanOutputAsync(subdir){
    return new Promise((resolve) => {
      if (!subdir) throw new TestEnvError('No subdir to clean')
      debug('cleaning up output dir "%s"', subdir)
      return resolve(this.cleanAsync( this.outputPath(subdir) ))
    })
  }

  // `cleanAllOutputTmpAsync()`
  // Cleans any `tmp-*` dirs created (Named with `tmp_output_dir_prefix`)
  static cleanAllOutputTmpAsync(){
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
      return Promise.all(items_to_delete.map(item => this.cleanAsync(item)))
    })

  }

  // `cleanOutputTmpAsync(suffix)`
  // Clean a named `output/tmp-suffix` dir
  static cleanOutputTmpAsync(suffix){
    return new Promise((resolve) => {
      // Deal with a full tmp path
      suffix = this.removeTmpPrefixFromPath(suffix)
      let dir = this.tmpOutputPath(suffix)
      debug('cleaning up tmp dir', dir)
      return resolve(this.cleanAsync( dir ))
    })
  }

  // `mkdirOutputAsync(...args)`
  static mkdirOutputAsync(...args){
    return new Promise((resolve) => {
      let out_dir = this.outputPath(...args)
      return resolve(fse.mkdirsAsync(out_dir))
    })
  }

  // `mkdirOutputTmpAsync(suffix)`
  static mkdirOutputTmpAsync(suffix, ...paths){
    return new Promise((resolve) => {
      let out_dir = this.tmpOutputPath(suffix, ...paths)
      return resolve(fse.mkdirsAsync(out_dir))
    })
  }

  static removeTmpPrefixFromPath(tmppath){
    debug('removeTmpPrefixFromPath tmppath', tmppath)
    let tmp_path_prefix = this.outputPath(this.tmp_output_dir_prefix)
    let re = new RegExp( `^${escapeRegExp(tmp_path_prefix)}` )
    let str = tmppath.replace(re, '')
    debug('removeTmpPrefixFromPath new', str)
    return str
  }

  static copyAsync(src, dest, options){
    debug('copyAsync', src, dest, options)
    return fse.copyAsync(src, dest, options)
  }

  // No output_suffix copies to a random output tmp dir
  // No fixture suffix copies all fixtures to a random output tmp dir
  static copyFixtureToTmpOutputAsync(fixture_suffix){
    return new Promise((resolve) => {
      debug('copyFixtureTmpOutputAsync', fixture_suffix)
      let src = this.fixturePath(fixture_suffix)
      let dest = this.tmpOutputPath(undefined, fixture_suffix)
      resolve( this.copyAsync(src, dest).then(()=> dest) )
    })
  }

  // No output_suffix copies directly to output
  // No fixture suffix copies all fixtures to output
  static copyFixtureToOutputAsync(fixture_suffix, output_suffix = fixture_suffix){
    return new Promise((resolve) => {
      debug('copyFixtureOutputAsync', fixture_suffix, output_suffix)

      if ( !(fixture_suffix instanceof Array) ) fixture_suffix = Array(fixture_suffix)
      let src = this.fixturePath(...fixture_suffix)

      if ( !(output_suffix instanceof Array) ) output_suffix = Array(output_suffix)
      let dest = this.outputPath(...output_suffix)

      resolve( this.copyAsync(src, dest).then(()=> dest) )
    })
  }

}
TestEnvStatic.init()

module.exports = { TestEnvStatic, TestEnvError }
