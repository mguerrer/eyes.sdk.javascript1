'use strict'

const {Builder} = require('selenium-webdriver')
const {Logger} = require('../../..')
const assert = require('assert')
const {captureDom, getExpectedDom} = require('./DomCapture_utils')

describe('DomCapture', function() {
  let driver,
    logger = new Logger(process.env.APPLITOOLS_SHOW_LOGS)
  beforeEach(async function() {
    driver = await new Builder()
      .withCapabilities({browserName: 'chrome', 'goog:chromeOptions': {args: ['headless']}})
      .usingServer(process.env.CVG_TESTS_REMOTE)
      .build()

    await driver
      .manage()
      .window()
      .setRect({x: 0, y: 0, width: 800, height: 600})
  })

  afterEach(async function() {
    await driver.quit()
  })

  it('TestSendDOM_NSA', async function() {
    const actualDomJsonString = await captureDom(
      logger,
      driver,
      'https://nikita-andreev.github.io/applitools/dom_capture.html?aaa',
      this.test.title,
    )
    const actualDomJson = JSON.parse(actualDomJsonString)

    const expectedDomJson = await getExpectedDom(this.test.title)
    assert.deepStrictEqual(actualDomJson, expectedDomJson)
  })
})
