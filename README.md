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
- The Weapons, Armour and Trappings name fields suggest the items from the 5th edition Consumer Guide (52 weapons, 19 pieces of armour including shields, 177 trappings, animals and vehicles). Picking one fills in the row's empty columns (group, Enc, range/reach, damage, qualities; locations, AP; Enc), so the Encumbrance totals add up. The description lists price, availability and each quality or flaw with its rule.
- The Spells and Prayers name field suggests the 5th edition petty, arcane, colour-lore, witch and dark spells (146) and the blessings and miracles of each cult (79). Picking one fills in the row's empty CN, range, target, duration and effect.
- The trappings list starts with the trappings of the character's careers, level by level (e.g. "Trade Tools (Thief) — Thief level 2"), followed by the shop items. Career trappings that match a shop item, weapon or armour fill in Enc and show its stats; the description says which career level a trapping comes from.
- The Mutation field suggests the 40 mutations from the 5th edition Physical and Mental Corruption tables (with their d100 roll). Picking one fills in an empty Type and Effect. Under the corruption skulls the sheet shows when to test for mutation (more Corruption Points than WP Bonus + T Bonus) and the mutation limits (physical up to T Bonus, mental up to WP Bonus), in red when one is exceeded.
- Text fields grow downwards as you type, up to 10 lines; longer text scrolls inside the field. Fields that are one line on the printed sheet wrap but don't take line breaks (Enter does nothing).
- Skill specialisations: the Art, Entertain, Melee, Ride boxes and the Other skills names (e.g. Lore (History), Trade (Cook)) suggest the specialisations from the rules and the careers. The Known Languages names suggest the 19 Old World languages from the rules (with their other names, such as Mootish for Haffennaff); the description shows who speaks each language and which languages are related. Lore specialisations from the rules' common lores show what they cover.
- Talents with a specialisation (Acute Sense, Arcane Magic, Bless, Invoke, Etiquette, Resistant, Striding Gait, Craftsman, Savant…) suggest every option from the talent rules plus those used by careers. The description of Arcane/Chaos Magic (Lore) lists that lore's spells, Bless/Invoke (God) the god's blessings or miracles, and Savant (Lore) what the lore covers.
- The Status box suggests every status from Brass 0 to Gold 7, with the levels of that row's career first. Its description explains the tier and Standing, what the Income Endeavour earns at that Standing, and how Status affects social Tests.
- The Species field suggests the five species (Dwarf, Halfling, High Elf, Human, Wood Elf); the description lists which careers each can take and how it mutates. Once a species is chosen, the career suggestions only offer careers open to it (combined with the class picked on that row).
- Class, career, talent, advanced skill, language and skill specialisation fields offer drop-down suggestions from `data/reference.yaml` (WFRP 5th edition classes, careers, skills and talents, each with a short and a longer description). The drop-down is the page's own (not a browser `<datalist>`), so these fields wrap and grow like the others: it opens when the field gets focus, filters as you type, and works with the arrow keys, Enter, Escape and the mouse. You can still type anything. Picking a career fills in an empty class and status, picking a talent fills in an empty description, and picking a skill fills in an empty characteristic. Hovering over a filled-in field shows its description, and the small ⓘ button in the field's corner shows the same text as a panel (for phones and tablets). Tap ⓘ again, tap elsewhere or press Escape to close it. The suggestions need the page to be served over http(s); opened as a local file the fields are plain text.

Files:

- `index.html` – page markup
- `css/sheet.css` – stylesheet; colours, fonts and spacing are variables at the top
- `css/art.css` – theme artwork (backgrounds, corners, dividers); the pictures are `img/art/<theme>-tile|corner|divider.svg`
- `js/sheet.js` – saving, loading, YAML and calculations
- `img/default-portrait.svg` – default portrait
- `data/reference.yaml` – species, classes, careers (with levels and status), skills, talents, mutations, weapons, armour, trappings, weapon/armour qualities, spells and prayers for the drop-down suggestions
- `js/vendor/js-yaml.min.js` – [js-yaml](https://github.com/nodeca/js-yaml) 4.1.0 (MIT)
