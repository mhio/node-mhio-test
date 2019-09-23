const {
      Exception,
      FsException,
      FsNotFoundError,
      FsAlreadyExistsError
} = require('@mhio/exception')

class TestEnvException extends Exception {}

module.exports = {
  TestEnvException,
  FsException, FsNotFoundError, FsAlreadyExistsError
}
