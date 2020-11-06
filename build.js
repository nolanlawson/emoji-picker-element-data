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

async function main () {
  const emojibaseDir = path.resolve('./node_modules', 'emojibase-data')
  const langs = fs.readdirSync(emojibaseDir)
    .filter(file => !IGNORE_FOLDERS.includes(file))
    .filter(file => fs.statSync(path.resolve(emojibaseDir, file)).isDirectory())

  for (const lang of langs) {
    rimraf.sync(path.resolve('./', lang))
    const shortcodeFiles = fs.readdirSync(path.resolve(emojibaseDir, lang, 'shortcodes'))
    const baseData = JSON.parse(fs.readFileSync(path.resolve(emojibaseDir, lang, 'data.json'), 'utf8'))
    for (const shortcodeFile of shortcodeFiles) {
      const shortcodeData = JSON.parse(fs.readFileSync(
        path.resolve(emojibaseDir, lang, 'shortcodes', shortcodeFile),
        'utf8'
      ))

      const outData = baseData
        .filter(emoji => 'group' in emoji) // skip odd emoji with no group, e.g. regional indicator (1F1E6)
        .map(emoji => {
          const outEmoji = {}
          // normalize shortcodes to an array of strings
          // sometimes these don't exist for the given shortcodes file though (e.g. too-new emoji)
          let shortcodes = shortcodeData[emoji.hexcode]
          if (shortcodes) {
            if (!Array.isArray(shortcodes)) {
              shortcodes = [shortcodes]
            }
            outEmoji.shortcodes = shortcodes
          }

          // trim keys we don't need
          for (const key of Object.keys(emoji)) {
            if (emojiKeys.has(key)) {
              if (key === 'skins') {
                const skins = []
                for (const skin of emoji.skins) {
                  const outSkin = {}
                  for (const skinKey of Object.keys(skin)) {
                    if (skinKeys.has(skinKey)) {
                      outSkin[skinKey] = skin[skinKey]
                    }
                  }
                  skins.push(outSkin)
                }
                outEmoji.skins = skins
              } else {
                outEmoji[key] = emoji[key]
              }
            }
          }

          return outEmoji
        })
      const outPath = path.resolve('./', lang, shortcodeFile.replace('.json', ''))
      mkdirp.sync(outPath)
      fs.writeFileSync(path.resolve(outPath, 'data.json'), JSON.stringify(outData), 'utf8')
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
