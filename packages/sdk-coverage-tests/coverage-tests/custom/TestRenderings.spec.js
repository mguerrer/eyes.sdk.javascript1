'use strict'
const cwd = process.cwd()
const path = require('path')
const {getEyes, Browsers} = require('../util/TestSetup')
const spec = require(path.resolve(cwd, 'src/SpecWrappedDriver'))
const {DeviceName, Target} = require(cwd)

describe('TestRenderings', () => {
  let driver, eyes, runner
  beforeEach(async () => {
    driver = await spec.build({capabilities: Browsers.chrome()})
    await spec.visit(driver, 'https://applitools.com/helloworld')
    eyes = await getEyes({isVisualGrid: true})
    runner = eyes.getRunner()
  })
  it.skip('TestMobileOnly', async () => {
    let conf = eyes.getConfiguration()
    conf.setTestName('Mobile Render Test')
    conf.setAppName('Visual Grid Render Test')
    conf.addDeviceEmulation(DeviceName.Galaxy_S5)
    eyes.setConfiguration(conf)
    await eyes.open(driver)
    await spec.visit(
      driver,
      'https://applitools.github.io/demo/TestPages/DynamicResolution/mobile.html',
    )
    await eyes.check('Test Mobile Only', Target.window().fully())
    await eyes.close()
    await runner.getAllTestResults()
  })
  afterEach(async () => {
    await spec.cleanup(driver)
    await eyes.abortIfNotClosed()
  })
})