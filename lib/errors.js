const { ExtendedError } = require('@deployable/errors')

class TestEnvError extends ExtendedError {}

module.exports = { TestEnvError }
