'use strict';
const {
  parse,
  CSSImportRule,
  CSSStyleRule,
  CSSFontFaceRule,
  CSSSupportsRule,
  CSSMediaRule,
} = require('cssom');
const absolutizeUrl = require('./absolutizeUrl');

function getUrlFromCssText(cssText) {
  const re = /url\((?!['"]?:)['"]?([^'"\)]*)['"]?\)/g;
  const ret = [];
  let result;
  while ((result = re.exec(cssText)) !== null) {
    ret.push(result[1]);
  }
  return ret;
}

function extractResourcesFromStyleSheet(styleSheet) {
  const resourceUrls = [...styleSheet.cssRules].reduce((acc, rule) => {
    if (rule instanceof CSSImportRule) {
      return acc.concat(rule.href);
    } else if (rule instanceof CSSFontFaceRule) {
      return acc.concat(getUrlFromCssText(rule.style.getPropertyValue('src')));
    } else if (rule instanceof CSSSupportsRule || rule instanceof CSSMediaRule) {
      return acc.concat(extractResourcesFromStyleSheet(rule));
    } else if (rule instanceof CSSStyleRule) {
      for (let i = 0, ii = rule.style.length; i < ii; i++) {
        const urls = getUrlFromCssText(rule.style.getPropertyValue(rule.style[i]));
        urls.length && (acc = acc.concat(urls));
      }
    }
    return acc;
  }, []);
  return [...new Set(resourceUrls)];
}

function extractCssResources(cssText, absoluteUrl, logger) {
  let styleSheet;

  try {
    styleSheet = parse(cssText);
  } catch (ex) {
    logger.log(ex);
    return [];
  }

  return extractResourcesFromStyleSheet(styleSheet).map(url => absolutizeUrl(url, absoluteUrl));
}

module.exports = extractCssResources;
