// # TestEnv

// Test environment
// Standard things that all the tests might use

// `fixturePath()`

// `outputPath()`

// `basePath()`

// Setting `DEBUG_CLEAN=true mocha` does't clean up files. Lets you look at them after a test

const Promise = require('bluebird')
const path = require('path')
const crypto = require('crypto')
const fse = Promise.promisifyAll(require('fs-extra'))
const debug = require('debug')('dply:test:helpers:test_env')
const klaw = require('klaw')
const escapeRegExp = require('lodash.escapeRegExp')


class TestEnvError extends Error {}


class TestEnv {

  // Requires the path to your `test` directory that your
  // `fixture` and `output` directories live under.
  // This will normally be `__dirname` from where you required
  // this file.
  static init ( base ) {

    // The app base bath
    // Take a guess if the user doesn't provide one.
    // The guess removes `node_modules/deployable-test/lib`.
    // If you are somehow referencing a sub module of a sub module
    // the path will be wrong
    this.base_path = (!base)
      ? path.resolve(__dirname, '..', '..', '..', 'test')
      : path.resolve(base)

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
  static tmpOutputPath(suffix){
    if (!suffix) suffix = this.randomHex(5)
    return this.outputPath( this.tmp_output_dir_prefix + suffix )
  }

  // `randomHex(6)`
  static randomHex(n){
    let bytes = Math.ceil(n/2)
    return crypto.randomBytes(bytes).toString('hex').slice(0,n)
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

      var items = [] // files, directories, symlinks, etc

      klaw(output_dir)
        .on('readable', function () {
          var item
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
      suffix = this.removeTmpPrefix(suffix)
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
  static mkdirOutputTmpAsync(suffix){
    return new Promise((resolve) => {
      let out_dir = this.tmpOutputPath(suffix)
      return resolve(fse.mkdirsAsync(out_dir))
    })
  }

  static removeTmpPrefix(tmppath){
    debug('removeTmpPrefix tmppath', tmppath)
    let tmp_path_prefix = this.outputPath(this.tmp_output_dir_prefix)
    let re = new RegExp( `^${escapeRegExp(tmp_path_prefix)}` )
    let str = tmppath.replace(re, '')
    debug('removeTmpPrefix new', str)
    return str
  }


  // ## Instance

  // constructor( base_path, options = {} ) {
  //   this.base_path = base_path
  //   this.test_dir = options.test_dir || 'test'
  //   this.fixture_dir = options.fixture_dir || 'fixture'
  //   this.output_dir = options.output_dir || 'output'
  // }

  // // Return the fixture dir
  // get test_path(){
  //   return path.join(this.base_path, this.test_dir)
  // }

  // // Return the fixture dir
  // get fixture_path(){
  //   return path.join(this.base_path, this.test_dir, this.fixture_dir)
  // }

  // // Return the output dir
  // get output_path(){
  //   return path.join(this.base_path, this.test_dir, this.output_dir)
  // }

}

// Attach class data due to es2015 class limitation
TestEnv.init()

module.exports = { TestEnv, TestEnvError }
