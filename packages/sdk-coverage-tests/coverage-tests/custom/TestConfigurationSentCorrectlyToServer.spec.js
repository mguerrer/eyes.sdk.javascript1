'use strict'
const cwd = process.cwd()
const path = require('path')
const {getEyes, Browsers} = require('../util/TestSetup')
const spec = require(path.resolve(cwd, 'src/SpecWrappedDriver'))
const assert = require('assert')
const {
  Configuration,
  Target,
  BatchInfo,
  MatchLevel,
} = require(cwd)
const {getApiData} = require('../util/ApiAssertions')
describe.only('TestEyesConfiguration', async () => {
  let testCases = []
  testCase(false, 'Test sequence', 'Test Sequence Name Env Var')
  testCase(false, 'Test sequence', undefined)
  testCase(false, undefined, 'Test Sequence Name Env Var')
  testCase(false, undefined, undefined)
  // testCase(true, 'Test sequence', 'Test Sequence Name Env Var')
  // testCase(true, 'Test sequence', undefined)
  // testCase(true, undefined, 'Test Sequence Name Env Var')
  // testCase(true, undefined, undefined)

  testCases.forEach((data, index) => {
    it(`TestEyesConfiguration_${index}`, async () => {
      let eyes = getEyes({isVisualGrid: data.useVisualGrid})
      let driver = await spec.build({capabilities: Browsers.chrome()})
      await spec.visit(driver, 'https://applitools.github.io/demo/TestPages/FramesTestPage/')
      let originalBatchSequence = process.env.APPLITOOLS_BATCH_SEQUENCE
      if (data.sequenceNameEnvVar !== undefined) {
        process.env.APPLITOOLS_BATCH_SEQUENCE = data.sequenceNameEnvVar
      }
      let batchInfo = new BatchInfo()
      let effectiveSequenceName = data.sequenceName ? data.sequenceName : data.sequenceNameEnvVar

      if (data.sequenceName !== undefined) {
        batchInfo.setSequenceName(data.sequenceName)
      }

      if (data.sequenceNameEnvVar !== undefined) {
        if (originalBatchSequence === undefined) {
          delete process.env.APPLITOOLS_BATCH_SEQUENCE
        } else {
          process.env.APPLITOOLS_BATCH_SEQUENCE = originalBatchSequence
        }
      }

      let results
      try {
        assert.deepStrictEqual(effectiveSequenceName, batchInfo.getSequenceName(), 'SequenceName')
        let conf = new Configuration()
        let testName = `Test - ${data.useVisualGrid ? 'Visual Grid' : 'Selenium'}`
        conf
          .setAppName('app')
          .setTestName(testName)
          .setHostApp('someHostApp')
          .setHostOS('someHostOS')
          .setEnvironmentName('env name')
          .setBatch(batchInfo)
        eyes.setConfiguration(conf)

        await eyes.open(driver)

        eyes.setMatchLevel(MatchLevel.Layout)
        await eyes.check('', Target.window())

        eyes.setMatchLevel(MatchLevel.Content)
        await eyes.check('', Target.window())
      } finally {
        results = await eyes.close(false)
        await spec.cleanup(driver)
      }

      let sessionResults = await getApiData(results)
      assert.ok(sessionResults, 'SessionResults')

      assert.deepStrictEqual(sessionResults.env.os, 'someHostOS', 'OS')
      assert.deepStrictEqual(sessionResults.env.hostingApp, 'someHostApp', 'Hosting App')

      assert.deepStrictEqual(
        sessionResults.startInfo.batchInfo.sequenceName,
        batchInfo.sequenceName,
        'Sequence Name',
      )

      assert.ok(sessionResults.actualAppOutput, 'Actual App Output')
      assert.deepStrictEqual(sessionResults.actualAppOutput.length, 2, 'Actual App Output')
      assert.deepStrictEqual(
        sessionResults.actualAppOutput[0].imageMatchSettings.matchLevel,
        MatchLevel.Layout2,
        `Actual App Output (Layout)`,
      )
      assert.deepStrictEqual(
        sessionResults.actualAppOutput[1].imageMatchSettings.matchLevel,
        MatchLevel.Content,
        `Actual App Output (Content)`,
      )

      await eyes.abort()
    })
  })

  function testCase(useVisualGrid, sequenceName, sequenceNameEnvVar) {
    testCases.push({
      useVisualGrid: useVisualGrid,
      sequenceName: sequenceName,
      sequenceNameEnvVar: sequenceNameEnvVar,
    })
  }
})