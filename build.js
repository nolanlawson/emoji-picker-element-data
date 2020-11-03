import process from 'process'
import fs from 'fs'
import path from 'path'
import rimraf from 'rimraf'
import mkdirp from 'mkdirp'

const IGNORE_FOLDERS = ['meta', 'versions']

const emojiKeys = new Set([
  'annotation',
  'emoji',
  'emoticon',
  'group',
  'order',
  'shortcodes',
  'skins',
  'tags',
  'version'
])

const skinKeys = new Set(['tone', 'emoji', 'version'])

async function main() {
  const emojibaseDir = path.resolve('./node_modules', 'emojibase-data')
  const langs = fs.readdirSync(emojibaseDir)
    .filter(file => !IGNORE_FOLDERS.includes(file))
    .filter(file => fs.statSync(path.resolve(emojibaseDir, file)).isDirectory())

  for (const lang of langs) {
    rimraf.sync(path.resolve('./', lang))
    const shortcodeFiles = fs.readdirSync(path.resolve(emojibaseDir, lang, 'shortcodes'))
    const baseData = JSON.parse(fs.readFileSync(path.resolve(emojibaseDir, lang, 'data.json'), 'utf8'))
    for (const shortcodeFile of shortcodeFiles) {
      const data = JSON.parse(JSON.stringify(baseData))
      const shortcodeData = JSON.parse(fs.readFileSync(
        path.resolve(emojibaseDir, lang, 'shortcodes', shortcodeFile),
        'utf8'
      ))

      for (const emoji of data) {
        // normalize shortcodes to an array of strings or empty
        let shortcodes = shortcodeData[emoji.hexcode]
        if (!shortcodes) {
          console.log('missing shortcodes', lang, shortcodeFile, emoji.hexcode)
          shortcodes = []
        } else if (!Array.isArray(shortcodes)) {
          shortcodes = [shortcodes]
        }
        emoji.shortcodes = shortcodes

        // trim keys we don't need
        for (const key of Object.keys(emoji)) {
          if (!emojiKeys.has(key)) {
            delete emoji[key]
          }
        }
        if (emoji.skins) {
          for (const skinKey of Object.keys(emoji.skins)) {
            if (!skinKeys.has(skinKey)) {
              delete emoji.skins[skinKey]
            }
          }
        }
      }
      const outPath = path.resolve('./', lang, shortcodeFile.replace('.json', ''))
      mkdirp.sync(outPath)
      fs.writeFileSync(path.resolve(outPath, 'data.json'), JSON.stringify(data), 'utf8')
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})