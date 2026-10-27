# warhammer_site
A page for warhammer.no

## Character sheet

The site is a Warhammer Fantasy Roleplay character sheet (https://warhammer.no/).

- Up to five characters are saved in the browser's localStorage and picked from the drop-down at the top.
- **Download** saves the current character as a YAML file, **Upload** loads a YAML file into the current slot.
- The portrait uses an optional image URL; without one a default horned silhouette is shown.
- Calculated values (current characteristics, skills, wounds, encumbrance, walk/run, XP total) update automatically.

Files:

- `index.html` – page markup
- `css/sheet.css` – stylesheet; colours, fonts and spacing are variables at the top
- `js/sheet.js` – saving, loading, YAML and calculations
- `img/default-portrait.svg` – default portrait
- `js/vendor/js-yaml.min.js` – [js-yaml](https://github.com/nodeca/js-yaml) 4.1.0 (MIT)
