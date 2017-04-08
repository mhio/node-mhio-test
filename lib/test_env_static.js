// # TestEnv

// Standard things that all the tests might use.

// All the `fs-extra` functions are wrapped here so the stack
// on an error reports something traceable rather than a one
// line `native` error.

// `fixturePath()`

// `outputPath()`

// `basePath()`

// Setting `DEBUG_CLEAN=true mocha` does't clean up files. Lets you look at them after a test

const debug = require('debug')('dply:test:helpers:test_env_static')
const Promise = require('bluebird')
const path = require('path')
const fse = Promise.promisifyAll(require('fs-extra'))

const { FsError, FsNotFoundError, TestEnvError } = require('./errors')

// User facing interface to TestEnv methods for a specific path

class TestEnvStatic {

  static init(){
    return this
  }

  static join (...args) { return path.join(...args) }
  static resolve (...args) { return path.resolve(...args) }

  static copyAsync(src, dest, options){
    debug('copyAsync', src, dest, options)
    return fse.copyAsync(src, dest, options)
      .catch(err => {
        debug('error', err)
        throw FsError.create('FS copy failed', err, { stack: true })
      })
  }

  static existsAsync(test_path){
    return new Promise( resolve => {
      debug('existsAsync', test_path)
      fse.existsAsync(test_path, state => {
        resolve(state)
      })
      .catch(err => {
        debug('error', err)
        throw FsError.create('FS exists failed', err, { stack: true })
      })
    })
  }

  static existsSync(test_path){
    debug('existsSync', test_path)
    return fse.existsSync(test_path)
  }

  static mkdirsAsync(src){
    debug('mkdirsAsync', src)
    return fse.mkdirsAsync(src)
      .catch(err => {
        debug('error', err)
        throw FsError.create('FS make directory failed', err)
      })
  }

  static removeAsync(rm_path){
    debug('removeAsync', rm_path)
    return fse.removeAsync(rm_path)
      .catch(err => {
        debug('error', err)
        throw FsError.create('FS remove failed', err)
      })
  }

  static emptyDirAsync(rm_path){
    debug('cleanAsync', rm_path)
    return fse.emptyDirAsync(rm_path)
      .catch(err => {
        debug('error', err)
        throw FsError.create('FS remove failed', err)
      })
  }

  static statAsync(test_path){
    debug('statAsync', test_path)
    return fse.statAsync(test_path)
      .catch(err => {
        debug('error', err)
        throw FsError.create('FS stat failed', err)
      })
  }

}
TestEnvStatic.init()

module.exports = { TestEnvStatic, FsError, FsNotFoundError }
