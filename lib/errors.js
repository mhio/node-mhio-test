const { ExtendedError, FsError, FsNotFoundError } = require('@deployable/errors')

class TestEnvError extends ExtendedError {}

module.exports = {
  TestEnvError,
  FsError, FsNotFoundError
}
