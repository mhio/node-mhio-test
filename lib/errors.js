const { ExtendedError, RethrownError } = require('@deployable/errors')

class TestEnvError extends ExtendedError {}
class TestEnvFsError extends RethrownError {}

module.exports = { TestEnvError, TestEnvFsError }
