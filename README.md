# warhammer_site
A page for warhammer.no

## Character sheet

The site is a Warhammer Fantasy Roleplay character sheet (https://warhammer.no/).

- The menu (character selector, style, download/upload, print, delete) is hidden by default; the menu icon in the top right corner shows and hides it.
- Up to 50 characters are saved in the browser's localStorage. The drop-down at the top lists the saved characters plus one "+ New character" slot.
- **Download all** saves every character in one YAML file. **Upload all** loads such a file and replaces all saved characters (after asking). A YAML file with a single character, as made by earlier versions, is added as a new character instead.
- The portrait comes from an optional image URL, set with the **Change picture** button in the menu; without one a default horned silhouette is shown.
- The **Style** drop-down switches between Parchment (default, follows light/dark), Death, Forest, Water, Dessert and Bubblegum. The choice is remembered in the browser. Colours are blocks of variables at the top of `css/sheet.css`. The artwork (page background, panel corner ornaments, heading flourishes) is in `css/art.css` and the small SVG files in `img/art/`. To add a style, add a `:root[data-theme="name"]` block in both CSS files and an `<option>` in `index.html`.
- Calculated values (current characteristics, skills, wounds, encumbrance, walk/run, XP total) update automatically.

Files:

- `index.html` – page markup
- `css/sheet.css` – stylesheet; colours, fonts and spacing are variables at the top
- `css/art.css` – theme artwork (backgrounds, corners, dividers); the pictures are `img/art/<theme>-tile|corner|divider.svg`
- `js/sheet.js` – saving, loading, YAML and calculations
- `img/default-portrait.svg` – default portrait
- `js/vendor/js-yaml.min.js` – [js-yaml](https://github.com/nodeca/js-yaml) 4.1.0 (MIT)
