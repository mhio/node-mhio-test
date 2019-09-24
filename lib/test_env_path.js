// # TestEnv

// Test environment
// Standard things that all the tests might use

// `fixturePath()`

// `outputPath()`

// `basePath()`

// Setting `DEBUG_CLEAN=true mocha` does't clean up files. Lets you look at them after a test

const debug = require('debug')('mhio:test:helpers:test_env_path')
const Promise = require('bluebird')
const path = require('path')

const { arrayOnNil } = require('./ensure_array')
const { TestEnvStatic } = require('./test_env_static')
const { TestEnvException, TestEnvFsException } = require('./errors')

// User facing interface to TestEnv methods for a specific path

class TestEnvPath {

  constructor( test_env, tep_path, options = {} ){

    // parent test_env
    this.test_env = test_env
    if ( !this.test_env )
      throw new TestEnvException(`new TestEnvPath First param must be a Test Env`)

    // The path for this tep, appended to the Test Env base path.
    this.tep_path = tep_path
    if ( !this.tep_path )
      throw new TestEnvException(`new TestEnvPath Second param must be a path`)

    // Full path
    this.base_path = this.test_env.basePath(tep_path)

    // is this output for fixture?
    this.writeable = options.writeable || false

    // suffix dirs used to create this path
    this.dirs = options.dirs

    debug('tep new', this.base_path)
  }

  path( ...args ){ return this.join(...args) }
  join( ...args ){
    return path.join(this.base_path, ...args)
  }

  get dir(){
    return path.basename(this.base_path)
  }
  get dirname(){
    return path.dirname(this.base_path)
  }

  copy( src, dest, options ){
    return this.test_env.copyAsync(src, dest, options).then(()=> dest)
  }

}


class TestEnvPathReadable extends TestEnvPath {
  clean(){ throw new TestEnvException('Can\'t clean a non writeable path') }
}


class TestEnvPathWriteable extends TestEnvPath {

  constructor( test_env, path, options = {} ){
    if (options.writeable === undefined) options.writeable = true
    super(test_env, path, options)
  }

  // ----
  // #### clean()
  //
  // Promise to clean the contents of this TestEnvPath.
  //
  clean(){
    debug('tep fixture clean', this.base_path)
    if (!this.writeable) return Promise.reject(new TestEnvException('Can\'t clean a non writeable path'))
    return this.test_env.cleanAsync(this.base_path)
  }

  // ----
  // #### remove()
  //
  // Promise to remove the this TestEnvPath.
  //
  remove(){
    debug('tep fixture clean', this.base_path)
    if (!this.writeable) return Promise.reject(new TestEnvException('Can\'t clean a non writeable path'))
    return this.test_env.removeAsync(this.base_path)
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
    let src_path = (src instanceof TestEnvPath)
      ? src.base_path
      : this.join(...arrayOnNil(src))
    let dst_path = ( dest instanceof TestEnvPath )
      ? dest.base_path
      : this.test_env.outputPath(...arrayOnNil(dest))
    debug('copyTo', src_path, dst_path)
    return this.copy(src_path, dst_path)
  }

  copyToTmp(src, dest){
    let src_path = (src instanceof TestEnvPath)
      ? src.base_path
      : this.join(...arrayOnNil(src))
    let dst_path = this.test_env.outputTmpPath(...arrayOnNil(dest))
    debug('copyTo', src_path, dst_path)
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
    let src_path = (src instanceof TestEnvPath)
      ? src.base_path
      : this.test_env.fixturePath(...arrayOnNil(src))
    let dst_path = (dest instanceof TestEnvPath)
      ? dest.base_path
      : this.join(...arrayOnNil(dest))
    debug('copyFrom', src_path, dst_path)
    return this.copy(src_path, dst_path)
  }
}

module.exports = { TestEnvPath,
  TestEnvPathReadable, TestEnvPathWriteable,
  TestEnvPathFixture, TestEnvPathOutput,
  TestEnvException }
