// # TestEnv

// Test environment
// Standard things that all the tests might use

// `fixturePath()`

// `outputPath()`

// `basePath()`

// Setting `DEBUG_CLEAN=true mocha` does't clean up files. Lets you look at them after a test

const debug = require('debug')('dply:test:helpers:test_env_path')
const Promise = require('bluebird')
const path = require('path')

const { arrayOnNil } = require('./ensure_array')
const { TestEnvStatic } = require('./test_env_static')
const { TestEnvError, TestEnvFsError } = require('./errors')

// User facing interface to TestEnv methods for a specific path

class TestEnvPath {

  static new(...args){
    return new this(...args)
  }

  constructor( test_env, tep_path, options = {} ){

    // parent test_env
    this.test_env = test_env
    if ( !this.test_env )
      throw new TestEnvError(`new TestEnvPath First param must be a Test Env`)

    // The path for this tep, appended to the Test Env base path.
    this.tep_path = tep_path
    if ( !this.tep_path )
      throw new TestEnvError(`new TestEnvPath Second param must be a path`)

    // Full path
    this.base_path = this.test_env.basePath(tep_path)

    // is this output for fixture?
    this.writeable = options.writeable || false

    // suffix dirs used to create this path
    this.dirs = options.dirs

    debug('tep new', tep_path, this.base_path)
  }

  path( ...args ){ return this.join(...args) }
  join( ...args ){
    return path.join(this.base_path, ...args)
  }

  get dir(){
    return path.dirname(this.base_path)
  }

  copy( src, dest, options ){
    return this.test_env.copyAsync(src, dest, options)
  }

}


class TestEnvPathReadable extends TestEnvPath {

}


class TestEnvPathWriteable extends TestEnvPath {

  constructor( test_env, path, options = {} ){
    if (options.writeable === undefined) options.writeable = true
    super(test_env, path, options)
  }

  clean(){
    debug('tep fixture clean', this.base_path)
    if (!this.writeable) return Promise.reject(new TestEnvError('Can\'t clean a non writeable path'))
    return this.test_env.cleanAsync(this.base_path)
  }

}


class TestEnvPathFixture extends TestEnvPathReadable {

  // #### `copyTo(src, dest)`

  // Promise to copy this TEP to somewhere

  // `undefined`/`null` - Parents fixture path.
  // `String`           - Parents fixture path + str
  // `Array`            - Parents fixture path join with Array
  // `TestEnvPath`      - TEP's base bath

  copyTo(src, dest){
    debug('tep fixture copyTo', src, dest)
    let src_path = this.join(...arrayOnNil(src))
    let dst_path = ( dest instanceof TestEnvPath )
      ? dst_path.base_path
      : this.test_env.outputPath(...arrayOnNil(dest))
    debug('tep fixture copyTo', src_path, dst_path)
    return this.copy(src_path, dst_path)
  }
}


class TestEnvPathOutput extends TestEnvPathWriteable {

  // #### `copyFrom(src, dest)`

  // Promise to copy from somewhere to this writeable TEP

  // `undefined`/`null` - Parents fixture path.
  // `String`           - Parents fixture path + str
  // `Array`            - Parents fixture path join with Array
  // `TestEnvPath`      - TEP's base bath

  copyFrom(src, dest){
    debug('tep fixture copyFrom', src, dest)
    let src_path = (src instanceof TestEnvPath)
      ? src_path.base_path
      : this.test_env.fixturePath(...arrayOnNil(src))
    let dst_path = this.join(...arrayOnNil(dest))
    debug('tep fixture copyFrom', src_path, dst_path)
    return this.copy(src_path, dst_path)
  }
}

module.exports = { TestEnvPath,
  TestEnvPathReadable, TestEnvPathWriteable,
  TestEnvPathFixture, TestEnvPathOutput,
  TestEnvError }
