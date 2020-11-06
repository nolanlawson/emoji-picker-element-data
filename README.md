emoji-picker-element-data
======

Uses [emojibase-data](https://www.npmjs.com/package/emojibase-data) to build JSON files designed for [emoji-picker-element](https://npmjs.com/package/emoji-picker-element). To browse the files, [use jsdelivr](https://www.jsdelivr.com/package/npm/emoji-picker-element-data).

Each file contains both language-specific emoji data and shortcode-specific data. For instance:

- `en/emojibase/data.json`: English data, Emojibase shortcodes
- `en/joypixels/data.json`: English data, JoyPixels shortcodes
- `fr/cldr/data.json`: French data, CLDR shortcodes

The goal is to stitch together shortcode files and emoji files into a single, optimized file format. Incidentally,
this provides a file format more like `emojibase-data` v5 than v6.

For more details, see [this issue](https://github.com/nolanlawson/emoji-picker-element/issues/47).