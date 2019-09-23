// # Something

const { TestEnv } = require('./test_env')
const { TestEnvStatic } = require('./test_env_static')
const { TestEnvPath } = require('./test_env_path')
const { TestEnvException,
      FsException,
      FsNotFoundException,
      FsAlreadyExistsException } = require('./errors')
const VERSION = require('../package.json').version

module.exports = {
  TestEnv, TestEnvPath, TestEnvStatic,
  TestEnvException, VERSION,
  FsException, FsNotFoundException FsAlreadyExistsException
}
