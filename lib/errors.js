const {
      Exception,
      FsException,
      FsNotFoundException,
      FsAlreadyExistsException
} = require('@mhio/exception')

class TestEnvException extends Exception {}

module.exports = {
  TestEnvException,
  FsException, FsNotFoundException, FsAlreadyExistsException
}
