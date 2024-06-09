import process from 'node:process'
import fs from 'node:fs'
import path from 'node:path'

const IGNORE_FOLDERS = ['meta', 'messages', 'versions']

const emojiKeys = new Set([
  'label',
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
    .sort()

  // Check that the files we're going to publish are the same as these files
  const pkgJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
  const { files } = pkgJson
  if (JSON.stringify(langs) !== JSON.stringify(files)) {
    console.info('Found: ' + JSON.stringify(langs))
    console.info('Expected: ' + JSON.stringify(files))
    throw new Error('lang files are not the same as package.json files, please update')
  }

  for (const lang of langs) {
    fs.rmSync(path.resolve('./', lang), { recursive: true, force: true })
    const shortcodeFiles = fs.readdirSync(path.resolve(emojibaseDir, lang, 'shortcodes'))
      .filter(_ => _.endsWith('.json'))
    const baseData = JSON.parse(fs.readFileSync(path.resolve(emojibaseDir, lang, 'data.json'), 'utf8'))
    for (const shortcodeFile of shortcodeFiles) {
      const fullShortcodeFilename = path.resolve(emojibaseDir, lang, 'shortcodes', shortcodeFile)
      const shortcodeData = JSON.parse(fs.readFileSync(fullShortcodeFilename, 'utf8'))

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
              if (key === 'label') {
                // Rename to annotation for backwards compat for pre-v7
                // https://github.com/milesj/emojibase/blob/master/packages/data/CHANGELOG.md#700---2021-10-15
                // TODO: breaking change to rename this
                outEmoji.annotation = emoji[key]
              } else if (key === 'emoticon') {
                // In case of an array, just take one string for backwards compat for pre-v7
                // https://github.com/milesj/emojibase/blob/master/packages/data/CHANGELOG.md#700---2021-10-15
                // TODO: breaking change to allow arrays as well as strings
                if (Array.isArray(emoji[key])) {
                  // These are usually just variations on the capitalization, with the capitalized version last,
                  // which in my opinion usually looks best (e.g. "XD" instead of "xD", "XO" instead of "xo")
                  outEmoji[key] = emoji[key][emoji[key].length - 1]
                } else {
                  outEmoji[key] = emoji[key]
                }
              } else if (key === 'skins') {
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
      fs.mkdirSync(outPath, { recursive: true })
      fs.writeFileSync(path.resolve(outPath, 'data.json'), JSON.stringify(outData), 'utf8')
    }
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
