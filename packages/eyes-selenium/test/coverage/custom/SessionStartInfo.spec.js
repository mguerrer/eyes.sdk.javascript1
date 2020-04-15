'use strict'

const path = require('path')
const assert = require('assert')
const fetch = require('node-fetch')
const fakeEyesServer = require('@applitools/sdk-fake-eyes-server')
const {fakeDriver} = require('../../util/fake-driver')
const {Eyes, Logger, Target, ConsoleLogHandler, TestResultsStatus} = require('../../../index')

const fixturesPath = path.resolve(__dirname, '../../fixtures')
const logger = new Logger(process.env.APPLITOOLS_SHOW_LOGS)

describe('SessionStartInfo', () => {
  let server, serverUrl

  before(async () => {
    server = await fakeEyesServer({
      logger,
      expectedFolder: fixturesPath,
      updateFixtures: process.env.APPLITOOLS_UPDATE_FIXTURES,
    })
    serverUrl = `http://localhost:${server.port}`
  })

  after(async () => {
    await server.close()
  })

  it('sends correct data in startSession in classic mode', async () => {
    const eyes = setupEyes()
    const driver = fakeDriver()

    const configuration = eyes.getConfiguration()
    configuration.setIgnoreDisplacements(true)
    configuration.setAccessibilityValidation('AA')
    eyes.setConfiguration(configuration)

    await eyes.open(driver, 'SessionStartInfo', 'classic')
    await eyes.check('bla', Target.window())
    const testResults = await eyes.close(false)
    assert.strictEqual(testResults.getStatus(), TestResultsStatus.Passed) // sanity check

    const {startInfo} = await getSession(testResults)

    assert.strictEqual(startInfo.defaultMatchSettings.ignoreDisplacements, true)
    assert.strictEqual(startInfo.defaultMatchSettings.accessibilityLevel, 'AA')
  })

  it('sends correct data in startSession in visual grid mode', async () => {})

  function setupEyes() {
    const eyes = new Eyes()
    eyes.setServerUrl(serverUrl)
    eyes.setApiKey('fakeApiKey')
    if (process.env.APPLITOOLS_SHOW_LOGS) {
      eyes.setLogHandler(new ConsoleLogHandler(true))
    }
    eyes.setMatchTimeout(0)
    return eyes
  }

  async function getSession(testResults) {
    const sessionUrl = `${serverUrl}/api/sessions/batches/${encodeURIComponent(
      testResults.getBatchId(),
    )}/${encodeURIComponent(testResults.getId())}`
    const session = await fetch(sessionUrl).then(r => r.json())
    return session
  }
})
