'use strict'
const path = require('path')
const cwd = process.cwd()
const spec = require(path.resolve(cwd, 'src/SpecWrappedDriver'))
const {Browsers, getEyes} = require('../../util/TestSetup')
const {TestCheckInnerFrame} = require('./TestClassicApi_utils')

describe('Coverage tests', () => {
  let driver, eyes

  afterEach(async () => {
    await eyes.abortIfNotClosed()
    await spec.cleanup(driver)
  })

  beforeEach(async () => {
    driver = await spec.build({capabilities: Browsers.chrome()})
    await spec.visit(driver, 'https://applitools.github.io/demo/TestPages/FramesTestPage/')
    eyes = await getEyes({branchName: 'v2'})
  })

  it('TestCheckInnerFrame_Scroll', () =>
    TestCheckInnerFrame({testName: 'TestCheckInnerFrame_Scroll', eyes, driver}))
})