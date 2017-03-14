const { ExtendedError,
      FsError,
      FsNotFoundError,
      FsAlreadyExistsError } = require('@deployable/errors')

class TestEnvError extends ExtendedError {}

module.exports = {
  TestEnvError,
  FsError, FsNotFoundError, FsAlreadyExistsError
}
