const https = require('https');

const puppeteer = require('puppeteer');
const fs = require('fs');
const mime = require('mime');
const URL = require('url').URL;
let browser = undefined;
let page = undefined;
let lastfromlang;
let lasttolang;
let isNowWorking = false;

const Languages = {
  af: 'Afrikaans',
  sq: 'Albanian',
  ar: 'Arabic',
  az: 'Azerbaijani',
  eu: 'Basque',
  bn: 'Bengali',
  be: 'Belarusian',
  bg: 'Bulgarian',
  ca: 'Catalan',
  'zh-cn': 'Chinese Simplified',
  'zh-tw': 'Chinese Traditional',
  hr: 'Croatian',
  cs: 'Czech',
  da: 'Danish',
  nl: 'Dutch',
  en: 'English',
  eo: 'Esperanto',
  et: 'Estonian',
  tl: 'Filipino',
  fi: 'Finnish',
  fr: 'French',
  gl: 'Galician',
  ka: 'Georgian',
  de: 'German',
  el: 'Greek',
  gu: 'Gujarati',
  ht: 'Haitian Creole',
  iw: 'Hebrew',
  hi: 'Hindi',
  hu: 'Hungarian',
  is: 'Icelandic',
  id: 'Indonesian',
  ga: 'Irish',
  it: 'Italian',
  ja: 'Japanese',
  kn: 'Kannada',
  ko: 'Korean',
  la: 'Latin',
  lv: 'Latvian',
  lt: 'Lithuanian',
  mk: 'Macedonian',
  ms: 'Malay',
  mt: 'Maltese',
  no: 'Norwegian',
  fa: 'Persian',
  pl: 'Polish',
  pt: 'Portuguese',
  ro: 'Romanian',
  ru: 'Russian',
  sr: 'Serbian',
  sk: 'Slovak',
  sl: 'Slovenian',
  es: 'Spanish',
  sw: 'Swahili',
  sv: 'Swedish',
  ta: 'Tamil',
  te: 'Telugu',
  th: 'Thai',
  tr: 'Turkish',
  uk: 'Ukrainian',
  ur: 'Urdu',
  vi: 'Vietnamese',
  cy: 'Welsh',
  yi: 'Yiddish',
};

function Exception(message) {
  this.message = message;
}

module.exports = async (from, to, text, callback) => {
  const translate = async (from, to, text, callback) => {
    if (!isNowWorking) {
      isNowWorking = true;
      if (!browser) browser = await puppeteer.launch();
      if (!page) page = await browser.newPage();
      if (from) {
        from = from.toLowerCase();
      }
      if (to) {
        to = to.toLowerCase();
      }

      var detectlanguage = false;

      if (from == undefined) {
        detectlanguage = true;
      } else if (!(from in Languages)) {
        throw new Exception('Cannot translate from unknown language: ' + from);
      }

      if (to == undefined || !(to in Languages)) {
        throw new Exception('Cannot translate to unknown language: ' + to);
      }

      if (text == undefined || text.length == 0) {
        throw new Exception('Cannot translate undefined or empty text string');
      }
      let content = '';

      try {
        if (page && lastfromlang === from && lasttolang === to) {
        } else {
          lastfromlang = from;
          lasttolang = to;
          await page.goto(
            'http://translate.google.com/#view=home&op=translate&sl=' +
              (detectlanguage ? '' : from) +
              '&tl=' +
              to,
            {
              waitUntil: 'networkidle2',
            }
          );
        }

        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.keyboard.press('Delete');
        await page.keyboard.type(text);

        const response = await page.waitForResponse(res => {
          return res.url().includes('translate_a/single?');
        });
        const buffer = await response.buffer();
        isValid = true;
        content = eval(`${buffer}`);
        let translated = {
          text: '',
          isCorrect: true,
          source: {
            synonyms: [],
            pronunciation: [],
            definitions: [],
            examples: [],
          },
          target: {
            synonyms: [],
          },
          translations: [],
        };
        try {
          //translated.text = content[0][0][0];
          //now it works for larger content
          if (content[0][content[0].length - 1][0] === null) content[0].pop();
          content[0].forEach(element => {
            translated.text += element[0];
          });
          //target synonyms
          if (
            content[1] != null &&
            content[1][0] != null &&
            content[1][0][1] != null
          ) {
            if (content[1][0][1].length > 0) {
              content[1][0][1].forEach(synonyms => {
                translated.target.synonyms.push(synonyms);
              });
            }
          }

          //target translations
          if (content[1] != null) {
            content[1].forEach(translation => {
              var type = {
                type: translation[0],
                translations: [],
              };
              translation[2].forEach(translations => {
                type.translations.push([translations[0], translations[1]]);
              });
              translated.translations.push(type);
            });
          }

          //source synonyms
          if (
            content[11] != null &&
            content[11][0] != null &&
            content[11][0][1] != null
          ) {
            if (content[11][0][1].length > 0) {
              content[11][0][1].forEach(synonyms => {
                translated.source.synonyms.push(synonyms[0]);
              });
            }
          }

          //pronunciation
          if (content[0][1] != null) {
            content[0][1].forEach(pronunciation => {
              if (pronunciation != null) {
                translated.source.pronunciation.push(pronunciation);
              }
            });
          }

          //definitions
          if (content[12] != null) {
            content[12].forEach(definitions => {
              var define = {
                type: definitions[0],
                definitions: [],
              };
              definitions[1].forEach(one => {
                define.definitions.push({
                  definition: one[0],
                  example: one[2],
                });
              });
              translated.source.definitions.push(define);
            });
          }
          //examples
          if (content[13] != null && content[13][0] != null) {
            var TextWithoutTags = '';
            content[13][0].forEach(examples => {
              if (examples != null) {
                TextWithoutTags = examples[0].replace(/(<([^>]+)>)/gi, '');
                translated.source.examples.push(TextWithoutTags);
              }
            });
          }
        } catch (e) {
          isNowWorking = false;
          callback({ text: content, isCorrect: false });
          isValid = false;
        }
        if (isValid) {
          isNowWorking = false;
          callback(translated);
        }
      } catch (e) {
        isNowWorking = false;
        callback({ text: content, isCorrect: false });
        isValid = false;
        console.log(e);
        await page.close();
        await browser.close();
      }
    } else {
      setTimeout(() => {
        translate(from, to, text, callback);
      }, 100);
    }
  };
  translate(from, to, text, callback);
};
