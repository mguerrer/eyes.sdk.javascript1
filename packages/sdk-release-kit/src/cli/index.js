#!/usr/bin/env node

const args = require('yargs').argv
const chalk = require('chalk')
const cwd = process.cwd()

async function execute(cb) {
  try {
    await cb()
  } catch (error) {
    console.log(chalk.red(error.message))
    process.exit(1)
  }
}

if (args['verify-changelog']) {
  const verifyChangelog = require('../changelog/scripts/verify-changelog')
  execute(verifyChangelog)
} else if (args['update-changelog']) {
  const updateChangelog = require('../changelog/scripts/update-changelog')
  execute(updateChangelog)
} else if (args['send-release-notification']) {
  const sendReleaseNotification = require('../send-report/scripts/send-release-notification')
  execute(sendReleaseNotification.bind(undefined, args.recipient))
} else if (args['verify-versions']) {
  const verifyVersions = require('../versions/scripts/verify-versions')
  execute(verifyVersions.bind(undefined, {isFix: args.fix, pkgPath: cwd}))
} else if (args['verify-commits']) {
  const verifyCommits = require('../versions/scripts/verify-commits')
  execute(verifyCommits.bind(undefined, cwd))
} else {
  execute(() => {
    throw new Error('Invalid option provided')
  })
}