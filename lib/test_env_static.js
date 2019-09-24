// # TestEnv

// Standard things that all the tests might use.

// All the `fs-extra` functions are wrapped here so the stack
// on an error reports something traceable rather than a one
// line `native` error.

// `fixturePath()`

// `outputPath()`

// `basePath()`

// Setting `DEBUG_CLEAN=true mocha` does't clean up files. Lets you look at them after a test

const debug = require('debug')('mhio:test-helpers:TestEnvStatic')
const Promise = require('bluebird')
const path = require('path')
const fse = require('fs-extra')

const { FsException, FsNotFoundException, TestEnvException } = require('./errors')

// User facing interface to TestEnv methods for a specific path

class TestEnvStatic {

  static init(){
    return this
  }

  static join (...args) { return path.join(...args) }
  static resolve (...args) { return path.resolve(...args) }

  static copyAsync( src, dest, options = {} ){
    return new Promise.try(()=>{
      debug('copyAsync', src, dest, options)
      return fse.copy(src, dest, options)
        .catch(err => {
          debug('error', err)
          throw FsException.create('FS copy failed', err, { stack: true })
        })
    })
  }

  static existsAsync(test_path){
    debug('existsAsync', test_path)
    return fse.exists(test_path)
      .catch(err => {
        debug('error', err)
        throw FsException.create('FS exists failed', err, { stack: true })
      })
  }

  static existsSync(test_path){
    debug('existsSync', test_path)
    return fse.existsSync(test_path)
  }

  static mkdirsAsync(src){
    debug('mkdirsAsync', src)
    return fse.mkdirs(src).then(()=> src)
      .catch(err => {
        debug('error', err)
        throw FsException.create('FS make directory failed', err)
      })
  }

  static removeAsync(rm_path){
    debug('removeAsync', rm_path)
    return fse.remove(rm_path)
      .catch(err => {
        debug('error', err)
        throw FsException.create('FS remove failed', err)
      })
  }

  static emptyDirAsync(rm_path){
    debug('cleanAsync', rm_path)
    return fse.emptyDir(rm_path)
      .catch(err => {
        debug('error', err)
        throw FsException.create('FS remove failed', err)
      })
  }

  static statAsync(test_path){
    return new Promise.try(()=>{
      debug('statAsync', test_path)
      return fse.stat(test_path)
        .catch(err => {
          debug('error', err)
          throw FsException.create('FS stat failed', err)
        })
    })
  }

}
TestEnvStatic.init()

module.exports = { TestEnvStatic, FsException, FsNotFoundException }
