// # TestEnv

// Test environment
// Standard things that all the tests might use

// `fixturePath()`

// `outputPath()`

// `basePath()`

// Setting `DEBUG_CLEAN=true mocha` does't clean up files. Lets you look at them after a test

const debug = require('debug')('dply:test:helpers:test_env_static')
const Promise = require('bluebird')
const path = require('path')
const fse = Promise.promisifyAll(require('fs-extra'))

const { FsError, FsNotFoundError } = require('./errors')

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

  static copyAsync(src, dest, options){
    debug('copyAsync', src, dest, options)
    return fse.copyAsync(src, dest, options)
      .catch(err => {
        debug('error', err)
        throw new FsError('FS copy Failed', err, { lines: 4 })
      })
  }

  static existsAsync(test_path){
    debug('existsAsync', test_path)
    return fse.existsAsync(test_path)
      .catch(err => {
        debug('error', err)
        throw new FsError('FS exists Failed', err, { all: true })
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
        throw new FsError('FS mkdir Failed', err)
      })
  }

  static removeAsync(rm_path){
    debug('removeAsync', rm_path)
    return fse.removeAsync(rm_path)
      .catch(err => {
        debug('error', err)
        throw new FsError('FS remove Failed', err)
      })
  }

  static statAsync(test_path){
    debug('statAsync', test_path)
    return fse.statAsync(test_path)
      .catch(err => {
        debug('error', err)
        throw new FsError('FS stat Failed', err)
      })
  }

}
TestEnvStatic.init()

module.exports = { TestEnvStatic, FsError, FsNotFoundError }
