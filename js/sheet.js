/* WFRP character sheet
 * - Up to five characters saved in localStorage, picked from a drop-down.
 * - Download / upload a character as a YAML file (js-yaml).
 * - Inputs are bound to the character object with data-path="a.b.c".
 * - Read-only values are calculated from <output data-calc="name">.
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'wfrp-character-sheet';
    const THEME_KEY = 'wfrp-sheet-theme';
    const MAX_CHARACTERS = 50;
    const DEFAULT_PORTRAIT = 'img/default-portrait.svg';
    const REFERENCE_URL = 'data/reference.yaml';

    const CHARACTERISTICS = ['WS', 'BS', 'S', 'T', 'I', 'Ag', 'Dex', 'Int', 'WP', 'Fel'];

    // Basic skills as printed on the sheet. "grouped" skills take a specialisation.
    const BASIC_SKILLS = [
        { id: 'art', name: 'Art', char: 'Dex', grouped: true },
        { id: 'athletics', name: 'Athletics', char: 'Ag' },
        { id: 'bribery', name: 'Bribery', char: 'Fel' },
        { id: 'charm', name: 'Charm', char: 'Fel' },
        { id: 'charmAnimal', name: 'Charm Animal', char: 'WP' },
        { id: 'climb', name: 'Climb', char: 'S' },
        { id: 'consumeAlcohol', name: 'Consume Alcohol', char: 'T' },
        { id: 'cool', name: 'Cool', char: 'WP' },
        { id: 'dodge', name: 'Dodge', char: 'Ag' },
        { id: 'drive', name: 'Drive', char: 'Ag' },
        { id: 'endurance', name: 'Endurance', char: 'T' },
        { id: 'entertain', name: 'Entertain', char: 'Fel', grouped: true },
        { id: 'gamble', name: 'Gamble', char: 'Int' },
        { id: 'gossip', name: 'Gossip', char: 'Fel' },
        { id: 'haggle', name: 'Haggle', char: 'Fel' },
        { id: 'intimidate', name: 'Intimidate', char: 'S' },
        { id: 'intuition', name: 'Intuition', char: 'I' },
        { id: 'leadership', name: 'Leadership', char: 'Fel' },
        { id: 'melee1', name: 'Melee', char: 'WS', grouped: true },
        { id: 'melee2', name: 'Melee', char: 'WS', grouped: true },
        { id: 'meleeBasic', name: 'Melee (Basic)', char: 'WS' },
        { id: 'navigation', name: 'Navigation', char: 'Int' },
        { id: 'outdoorSurvival', name: 'Outdoor Survival', char: 'Int' },
        { id: 'perception', name: 'Perception', char: 'I' },
        { id: 'ride', name: 'Ride', char: 'Ag', grouped: true },
        { id: 'row', name: 'Row', char: 'S' },
        { id: 'stealthRural', name: 'Stealth (Rural)', char: 'Ag' },
        { id: 'stealthUrban', name: 'Stealth (Urban)', char: 'Ag' },
        { id: 'stealthUnderground', name: 'Stealth (Underground)', char: 'Ag' }
    ];

    // Career advancement tracker: boxes before skull 2, 3 and 4.
    const TRACKER_SEGMENTS = [10, 12, 14];
    const CAREER_ROWS = 3;
    const CORRUPTION_MAX = 15;

    // Editable tables. type: text | number | check | char | calc
    // "wide" fields span the full row on small screens.
    const LISTS = {
        languages: {
            rows: 3,
            cols: '2rem 1fr 3.5rem 3.5rem 3.5rem',
            fields: [
                { key: 'tick', label: '✓', type: 'check' },
                { key: 'name', label: 'Name', wide: true, ref: 'languages' },
                { key: 'int', label: 'Int', type: 'calc', calc: (r, c) => (r.name || num(r.adv) !== null) ? charValue(c, 'Int') : '' },
                { key: 'adv', label: 'Adv', type: 'number' },
                { key: 'skill', label: 'Skill', type: 'calc', calc: (r, c) => (r.name || num(r.adv) !== null) ? skillValue(c, 'Int', r.adv) : '' }
            ]
        },
        customSkills: {
            rows: 6,
            cols: '2rem 1fr 4.5rem 3.5rem 3.5rem',
            fields: [
                { key: 'tick', label: '✓', type: 'check' },
                { key: 'name', label: 'Name', wide: true, ref: 'skills' },
                { key: 'char', label: 'Char.', type: 'char' },
                { key: 'adv', label: 'Adv', type: 'number' },
                { key: 'skill', label: 'Skill', type: 'calc', calc: (r, c) => r.char ? skillValue(c, r.char, r.adv) : '' }
            ]
        },
        talents: {
            rows: 8,
            cols: '1fr 2fr 3.5rem',
            fields: [
                { key: 'name', label: 'Talent name', wide: true, ref: 'talents' },
                { key: 'description', label: 'Description', wide: true, multiline: true },
                { key: 'pg', label: 'pg.' }
            ]
        },
        mutations: {
            rows: 4,
            cols: '1fr 2fr',
            fields: [
                { key: 'mutation', label: 'Mutation', wide: true },
                { key: 'effect', label: 'Effect', wide: true, multiline: true }
            ]
        },
        weapons: {
            rows: 4,
            cols: '2fr 1fr 3.5rem 1fr 1fr 2fr',
            fields: [
                { key: 'name', label: 'Name', wide: true },
                { key: 'group', label: 'Group' },
                { key: 'enc', label: 'ENC', type: 'number' },
                { key: 'range', label: 'Range/Reach' },
                { key: 'damage', label: 'Damage' },
                { key: 'qualities', label: 'Qualities', wide: true }
            ]
        },
        armour: {
            rows: 5,
            cols: '2fr 1.5fr 3.5rem 3.5rem 2fr',
            fields: [
                { key: 'name', label: 'Name', wide: true },
                { key: 'locations', label: 'Locations', wide: true },
                { key: 'enc', label: 'ENC', type: 'number' },
                { key: 'ap', label: 'AP', type: 'number' },
                { key: 'qualities', label: 'Qualities', wide: true }
            ]
        },
        trappings: {
            rows: 8,
            cols: '1fr 3.5rem',
            fields: [
                { key: 'name', label: 'Trapping' },
                { key: 'enc', label: 'ENC', type: 'number' }
            ]
        },
        spells: {
            rows: 5,
            cols: '1.5fr 3rem 1fr 1fr 1fr 2.5fr',
            fields: [
                { key: 'name', label: 'Name', wide: true },
                { key: 'cn', label: 'CN', type: 'number' },
                { key: 'range', label: 'Range' },
                { key: 'target', label: 'Target' },
                { key: 'duration', label: 'Duration' },
                { key: 'effect', label: 'Effect', wide: true, multiline: true }
            ]
        }
    };

    /* ---------- helpers ---------- */

    function num(v) {
        if (v === null || v === undefined || v === '') return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }

    function sum(values) {
        return values.reduce((total, v) => total + (num(v) || 0), 0);
    }

    function el(tag, attrs, children) {
        const node = document.createElement(tag);
        Object.entries(attrs || {}).forEach(([k, v]) => {
            if (v === undefined || v === null || v === false) return;
            if (k === 'text') node.textContent = v;
            else if (k === 'html') node.innerHTML = v;
            else node.setAttribute(k, v === true ? '' : v);
        });
        (children || []).forEach(c => node.append(c));
        return node;
    }

    function getPath(obj, path) {
        return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
    }

    function setPath(obj, path, value) {
        const keys = path.split('.');
        const last = keys.pop();
        const target = keys.reduce((o, k) => (o[k] = o[k] ?? {}), obj);
        target[last] = value;
    }

    function charValue(c, key) {
        const ch = c.characteristics[key];
        if (!ch || (num(ch.initial) === null && num(ch.advances) === null)) return '';
        return (num(ch.initial) || 0) + (num(ch.advances) || 0);
    }

    function bonus(c, key) {
        const v = charValue(c, key);
        return v === '' ? '' : Math.floor(v / 10);
    }

    function skillValue(c, charKey, adv) {
        const base = charValue(c, charKey);
        if (base === '' && num(adv) === null) return '';
        return (base || 0) + (num(adv) || 0);
    }

    /* ---------- data model ---------- */

    function blankRow(listName) {
        const row = {};
        LISTS[listName].fields.forEach(f => {
            if (f.type === 'calc') return;
            row[f.key] = f.type === 'check' ? false : (f.type === 'number' ? null : '');
        });
        return row;
    }

    function blankCharacter() {
        const c = {
            name: '', species: '', appearance: '', portrait: '',
            careers: [],
            xp: { current: null, spent: null },
            characteristics: {},
            fate: null,
            fortune: { current: null, max: null },
            movement: null,
            skills: {},
            ambitions: { personal: '', party: '' },
            wounds: { current: null, hardy: null },
            armourPoints: { head: null, leftArm: null, rightArm: null, body: null, rightLeg: null, leftLeg: null, shield: null },
            wealth: { gc: null, ss: null, d: null },
            encumbrance: { other: null },
            corruption: 0,
            notes: '',
            sin: null
        };
        for (let i = 0; i < CAREER_ROWS; i++) {
            c.careers.push({
                class: '', career: '', pg: '', status: '',
                tracker: TRACKER_SEGMENTS.map(n => '-'.repeat(n)),
                reached: [false, false, false]
            });
        }
        CHARACTERISTICS.forEach(k => { c.characteristics[k] = { initial: null, advances: null }; });
        BASIC_SKILLS.forEach(s => {
            c.skills[s.id] = s.grouped ? { spec: '', tick: false, adv: null } : { tick: false, adv: null };
        });
        Object.keys(LISTS).forEach(name => {
            c[name] = Array.from({ length: LISTS[name].rows }, () => blankRow(name));
        });
        return c;
    }

    // Merge loaded data onto a blank template so missing fields get defaults.
    function normalize(data) {
        const blank = blankCharacter();
        if (!data || typeof data !== 'object') return blank;

        function merge(template, src) {
            if (src === undefined || src === null) return template;
            if (Array.isArray(template)) return template; // arrays handled below
            if (typeof template === 'object' && template !== null) {
                if (typeof src !== 'object') return template;
                const out = {};
                Object.keys(template).forEach(k => { out[k] = merge(template[k], src[k]); });
                return out;
            }
            return typeof src === 'object' ? template : src;
        }

        const c = merge(blank, data);

        if (Array.isArray(data.careers)) {
            c.careers = blank.careers.map((b, i) => {
                const src = data.careers[i] || {};
                const row = merge(b, src);
                row.tracker = TRACKER_SEGMENTS.map((n, s) => {
                    const str = String((src.tracker || [])[s] || '');
                    return Array.from({ length: n }, (_, j) => (str[j] === 'x' ? 'x' : '-')).join('');
                });
                row.reached = [0, 1, 2].map(j => !!(src.reached || [])[j]);
                return row;
            });
        }

        Object.keys(LISTS).forEach(name => {
            const src = Array.isArray(data[name]) ? data[name] : [];
            const rows = src.filter(r => r && typeof r === 'object').map(r => merge(blankRow(name), r));
            while (rows.length < LISTS[name].rows) rows.push(blankRow(name));
            c[name] = rows;
        });

        c.corruption = Math.max(0, Math.min(CORRUPTION_MAX, num(c.corruption) || 0));
        return c;
    }

    function isRowEmpty(row) {
        return Object.values(row).every(v => v === '' || v === null || v === false);
    }

    function isCharacterEmpty(c) {
        return JSON.stringify(c) === JSON.stringify(blankCharacter());
    }

    // Copy for export: drop blank table rows to keep the YAML tidy.
    function exportable(c) {
        const out = JSON.parse(JSON.stringify(c));
        Object.keys(LISTS).forEach(name => { out[name] = out[name].filter(r => !isRowEmpty(r)); });
        return out;
    }

    /* ---------- storage ---------- */

    // The characters are kept in a list with no gaps. `active` is the position of the
    // character being edited; when it equals the list length it is the free "new character"
    // slot, which only joins the list once something has been entered into it.
    let store = { active: 0, characters: [] };
    let character = blankCharacter();
    let storageOk = true;

    function maxActive() {
        return Math.min(store.characters.length, MAX_CHARACTERS - 1);
    }

    function loadStore() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed.characters)) {
                    store.characters = parsed.characters.slice(0, MAX_CHARACTERS).map(normalize);
                    store.active = parsed.active | 0;
                } else if (Array.isArray(parsed.slots)) {
                    // Older version: five fixed slots, some of them empty
                    const old = parsed.slots.slice(0, MAX_CHARACTERS);
                    const wanted = parsed.active | 0;
                    store.active = old[wanted] ? old.slice(0, wanted).filter(Boolean).length : old.filter(Boolean).length;
                    store.characters = old.filter(Boolean).map(normalize);
                }
            }
        } catch (e) {
            storageOk = false;
        }
        store.active = Math.min(maxActive(), Math.max(0, store.active));
        character = store.characters[store.active] || blankCharacter();
    }

    function saveStore() {
        const list = store.characters;
        if (store.active < list.length) {
            list[store.active] = character;
            // A blank character at the end of the list turns back into the free slot
            if (isCharacterEmpty(character) && store.active === list.length - 1) list.pop();
        } else if (!isCharacterEmpty(character) && list.length < MAX_CHARACTERS) {
            list.push(character);
        }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
            return true;
        } catch (e) {
            storageOk = false;
            showStatus('Could not save – browser storage unavailable', true);
            return false;
        }
    }

    let saveTimer = null;
    function scheduleSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            if (saveStore()) showStatus('Saved');
            renderSlotSelect();
        }, 400);
    }

    function setMenu(open) {
        document.getElementById('toolbar').hidden = !open;
        const btn = document.getElementById('menuBtn');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
        btn.title = open ? 'Close menu' : 'Menu';
    }

    let statusTimer = null;
    function showStatus(text, isError) {
        const node = document.getElementById('status');
        node.textContent = text;
        node.classList.toggle('error', !!isError);
        if (isError) setMenu(true); // errors live in the toolbar, so make sure it is visible
        clearTimeout(statusTimer);
        if (!isError) statusTimer = setTimeout(() => { node.textContent = ''; }, 2000);
    }

    /* ---------- rendering ---------- */

    function slotLabel(i) {
        const c = store.characters[i];
        const career = (c.careers.find(r => r.career) || {}).career;
        return `${i + 1}. ${c.name || 'Unnamed character'}${career ? ' – ' + career : ''}`;
    }

    // Lists the saved characters plus one free slot for a new character.
    function renderSlotSelect() {
        const select = document.getElementById('slotSelect');
        select.innerHTML = '';
        store.characters.forEach((c, i) => select.append(el('option', { value: i, text: slotLabel(i) })));
        if (store.characters.length < MAX_CHARACTERS) {
            select.append(el('option', { value: store.characters.length, text: '+ New character' }));
        }
        select.value = store.active;
    }

    function renderCareers() {
        const box = document.getElementById('careers');
        box.innerHTML = '';
        box.append(el('div', { class: 'career-head' }, [
            el('span', { text: 'Class' }), el('span', { text: 'Career' }), el('span', { text: 'pg.' }),
            el('span', { text: 'Career Advancement Tracker' }), el('span', { text: 'Status' })
        ]));
        for (let i = 0; i < CAREER_ROWS; i++) {
            const tracker = el('div', { class: 'tracker' });
            TRACKER_SEGMENTS.forEach((n, s) => {
                const seg = el('div', { class: 'tracker-seg', style: `--n:${n / 2}` });
                for (let j = 0; j < n; j++) {
                    seg.append(el('input', {
                        type: 'checkbox', 'data-tracker': `${i}.${s}.${j}`,
                        'aria-label': `Career ${i + 1}, level ${s + 1} advance ${j + 1}`
                    }));
                }
                tracker.append(seg);
                tracker.append(el('button', {
                    type: 'button', class: 'skull level', 'data-reached': `${i}.${s}`,
                    'aria-pressed': 'false', title: `Career level ${s + 2} reached`,
                    html: skullSvg(false) + `<b>${s + 2}</b>`
                }));
            });
            box.append(el('div', { class: 'career-row' }, [
                field('Class', el('input', { type: 'text', 'data-path': `careers.${i}.class`, list: 'ref-classes', 'data-ref': 'classes' })),
                field('Career', el('input', { type: 'text', 'data-path': `careers.${i}.career`, list: 'ref-careers', 'data-ref': 'careers' })),
                field('pg.', el('input', { type: 'text', 'data-path': `careers.${i}.pg` }), 'pg'),
                tracker,
                field('Status', el('input', { type: 'text', 'data-path': `careers.${i}.status` }))
            ]));
        }
    }

    function field(label, input, cls) {
        return el('label', { class: 'cell' + (cls ? ' ' + cls : '') }, [el('span', { class: 'cell-label', text: label }), input]);
    }

    function renderCharacteristics() {
        const box = document.getElementById('characteristics');
        box.innerHTML = '';
        box.append(el('div', { class: 'char-legend' }, [
            el('span', { text: '' }), el('span', { text: 'Initial' }), el('span', { text: 'Advances' }), el('span', { text: 'Current' })
        ]));
        CHARACTERISTICS.forEach(k => {
            box.append(el('div', { class: 'char' }, [
                el('span', { class: 'char-name', text: k }),
                el('input', { type: 'number', 'data-path': `characteristics.${k}.initial`, 'aria-label': `${k} initial`, placeholder: 'Init' }),
                el('input', { type: 'number', 'data-path': `characteristics.${k}.advances`, 'aria-label': `${k} advances`, placeholder: 'Adv' }),
                el('output', { 'data-calc': `char.${k}`, 'aria-label': `${k} current` })
            ]));
        });
    }

    function renderBasicSkills() {
        const box = document.getElementById('basicSkills');
        box.innerHTML = '';
        BASIC_SKILLS.forEach(s => {
            const name = el('span', { class: 'skill-name' }, [s.grouped ? s.name + '* (' : s.name]);
            if (s.grouped) {
                name.append(el('input', {
                    type: 'text', class: 'spec', 'data-path': `skills.${s.id}.spec`, 'aria-label': `${s.name} specialisation`,
                    list: `ref-spec-${s.name}`
                }), ')');
            }
            box.append(el('div', { class: 'skill' }, [
                el('input', { type: 'checkbox', 'data-path': `skills.${s.id}.tick`, 'aria-label': `${s.name} career skill` }),
                name,
                el('span', { class: 'skill-char', text: s.char }),
                el('input', { type: 'number', 'data-path': `skills.${s.id}.adv`, 'aria-label': `${s.name} advances`, placeholder: 'Adv' }),
                el('output', { 'data-calc': `skill.${s.id}`, 'aria-label': `${s.name} skill` })
            ]));
        });
    }

    function renderList(name) {
        const def = LISTS[name];
        const box = document.querySelector(`[data-list="${name}"]`);
        box.innerHTML = '';
        box.style.setProperty('--cols', def.cols + ' 1.75rem');

        // Lists that flow into several columns get one header per column (extra ones shown by CSS).
        const heads = box.classList.contains('list-columns') ? 3 : 1;
        for (let h = 1; h <= heads; h++) {
            const head = el('div', { class: h === 1 ? 'list-head' : `list-head extra extra-${h}`, 'aria-hidden': h > 1 ? 'true' : null },
                def.fields.map(f => el('span', { text: f.label })));
            head.append(el('span'));
            box.append(head);
        }

        character[name].forEach((row, index) => {
            const rowEl = el('div', { class: 'list-row' });
            def.fields.forEach(f => {
                const attrs = { 'data-list-field': `${name}.${index}.${f.key}`, 'aria-label': f.label };
                if (f.ref) Object.assign(attrs, { list: `ref-${f.ref}`, 'data-ref': f.ref });
                let input;
                if (f.type === 'check') input = el('input', Object.assign({ type: 'checkbox' }, attrs));
                else if (f.type === 'number') input = el('input', Object.assign({ type: 'number' }, attrs));
                else if (f.type === 'calc') input = el('output', { 'data-calc': `list.${name}.${index}.${f.key}` });
                else if (f.type === 'char') {
                    input = el('select', attrs, [el('option', { value: '', text: '–' })].concat(
                        CHARACTERISTICS.map(k => el('option', { value: k, text: k }))));
                } else if (f.multiline) input = el('textarea', Object.assign({ rows: 1 }, attrs));
                else input = el('input', Object.assign({ type: 'text' }, attrs));

                const cls = ['cell', f.wide ? 'wide' : '', f.type === 'check' ? 'check' : ''].join(' ').trim();
                rowEl.append(el('label', { class: cls }, [el('span', { class: 'cell-label', text: f.label }), input]));
            });
            rowEl.append(el('button', {
                type: 'button', class: 'row-remove', 'data-remove': `${name}.${index}`,
                title: 'Remove row', 'aria-label': 'Remove row', text: '×'
            }));
            box.append(rowEl);
        });

        box.append(el('button', { type: 'button', class: 'row-add', 'data-add': name, text: '+ Add row' }));
    }

    function renderCorruption() {
        const box = document.getElementById('corruptionTrack');
        box.innerHTML = '';
        for (let i = 1; i <= CORRUPTION_MAX; i++) {
            box.append(el('button', {
                type: 'button', class: 'skull', 'data-corruption': i,
                title: `${i} corruption point${i > 1 ? 's' : ''}`, 'aria-label': `${i} corruption`,
                html: skullSvg(i > 8)
            }));
        }
    }

    function skullSvg(horned) {
        const horns = horned ? '<path d="M5 8 2 1l6 5zM19 8l3-7-6 5z"/>' : '';
        return `<svg viewBox="0 0 24 24" aria-hidden="true">${horns}<path d="M12 3C7 3 4 6.5 4 11c0 2.5 1.2 4.3 3 5.3V20h2v-2h2v2h2v-2h2v2h2v-3.7c1.8-1 3-2.8 3-5.3 0-4.5-3-8-8-8zM8.5 13a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm7 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM12 16l-1-2h2z"/></svg>`;
    }

    // Push the character object into every bound control.
    function fillForm() {
        document.querySelectorAll('[data-path]').forEach(input => {
            const value = getPath(character, input.dataset.path);
            if (input.type === 'checkbox') input.checked = !!value;
            else input.value = value ?? '';
        });
        document.querySelectorAll('[data-list-field]').forEach(input => {
            const value = getPath(character, input.dataset.listField);
            if (input.type === 'checkbox') input.checked = !!value;
            else input.value = value ?? '';
        });
        document.querySelectorAll('[data-tracker]').forEach(box => {
            const [i, s, j] = box.dataset.tracker.split('.').map(Number);
            box.checked = character.careers[i].tracker[s][j] === 'x';
        });
        document.querySelectorAll('[data-reached]').forEach(btn => {
            const [i, s] = btn.dataset.reached.split('.').map(Number);
            btn.setAttribute('aria-pressed', character.careers[i].reached[s] ? 'true' : 'false');
        });
        updatePortrait();
        describeAll();
        recalc();
    }

    function updatePortrait() {
        const img = document.getElementById('portraitImg');
        const url = (character.portrait || '').trim();
        const src = url || DEFAULT_PORTRAIT;
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    }

    function calc(name) {
        const c = character;
        const [kind, a, b, d] = name.split('.');
        switch (kind) {
            case 'char': return charValue(c, a);
            case 'skill': {
                const def = BASIC_SKILLS.find(s => s.id === a);
                return skillValue(c, def.char, c.skills[a].adv);
            }
            case 'xp': return (num(c.xp.current) === null && num(c.xp.spent) === null) ? '' : sum([c.xp.current, c.xp.spent]);
            case 'move': {
                const m = num(c.movement);
                if (m === null) return '';
                return a === 'walk' ? m * 2 : m * 4;
            }
            case 'wounds': {
                const sb = bonus(c, 'S'), tb = bonus(c, 'T'), wpb = bonus(c, 'WP');
                if (a === 'sb') return sb;
                if (a === 'tb2') return tb === '' ? '' : tb * 2;
                if (a === 'wpb') return wpb;
                if (sb === '' && tb === '' && wpb === '' && num(c.wounds.hardy) === null) return '';
                return sum([sb, tb === '' ? 0 : tb * 2, wpb, c.wounds.hardy]);
            }
            case 'enc': {
                const weapons = sum(c.weapons.map(r => r.enc));
                const armour = sum(c.armour.map(r => r.enc));
                const trappings = sum(c.trappings.map(r => r.enc));
                if (a === 'weapons') return weapons;
                if (a === 'armour') return armour;
                if (a === 'trappings') return trappings;
                if (a === 'max') {
                    const sb = bonus(c, 'S'), tb = bonus(c, 'T');
                    return (sb === '' && tb === '') ? '' : sum([sb, tb]);
                }
                return weapons + armour + trappings + (num(c.encumbrance.other) || 0);
            }
            case 'corruption': return c.corruption;
            case 'list': {
                const f = LISTS[a].fields.find(x => x.key === d);
                return f.calc(c[a][b], c);
            }
        }
        return '';
    }

    function recalc() {
        document.querySelectorAll('[data-calc]').forEach(out => { out.value = calc(out.dataset.calc); });

        const enc = calc('enc.total'), max = calc('enc.max');
        document.querySelectorAll('[data-calc="enc.total"]').forEach(o => o.classList.toggle('over', max !== '' && enc > max));

        document.querySelectorAll('[data-corruption]').forEach(btn => {
            btn.setAttribute('aria-pressed', Number(btn.dataset.corruption) <= character.corruption ? 'true' : 'false');
        });
    }

    function renderAll() {
        renderSlotSelect();
        Object.keys(LISTS).forEach(renderList);
        fillForm();
    }

    /* ---------- events ---------- */

    function readInput(input) {
        if (input.type === 'checkbox') return input.checked;
        if (input.type === 'number') return num(input.value);
        return input.value;
    }

    function onInput(e) {
        const t = e.target;
        if (t.dataset.path) {
            setPath(character, t.dataset.path, readInput(t));
        } else if (t.dataset.listField) {
            setPath(character, t.dataset.listField, readInput(t));
        } else if (t.dataset.tracker) {
            const [i, s, j] = t.dataset.tracker.split('.').map(Number);
            const chars = character.careers[i].tracker[s].split('');
            chars[j] = t.checked ? 'x' : '-';
            character.careers[i].tracker[s] = chars.join('');
        } else {
            return;
        }
        if (t.dataset.ref) {
            describe(t);
            // Picking from the drop-down (or leaving the field) fills in related empty fields
            if (e.type === 'change' || !e.inputType || e.inputType === 'insertReplacementText') applyReference(t);
        }
        recalc();
        scheduleSave();
    }

    function onClick(e) {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.dataset.corruption) {
            const n = Number(btn.dataset.corruption);
            character.corruption = character.corruption === n ? n - 1 : n;
        } else if (btn.dataset.reached) {
            const [i, s] = btn.dataset.reached.split('.').map(Number);
            character.careers[i].reached[s] = !character.careers[i].reached[s];
            btn.setAttribute('aria-pressed', character.careers[i].reached[s] ? 'true' : 'false');
        } else if (btn.dataset.add) {
            character[btn.dataset.add].push(blankRow(btn.dataset.add));
            renderList(btn.dataset.add);
            fillForm();
            const rows = document.querySelectorAll(`[data-list="${btn.dataset.add}"] .list-row`);
            const first = rows[rows.length - 1].querySelector('input:not([type=checkbox]), textarea');
            if (first) first.focus();
        } else if (btn.dataset.remove) {
            const [name, index] = btn.dataset.remove.split('.');
            const row = character[name][index];
            if (!isRowEmpty(row) && !confirm('Remove this row?')) return;
            character[name].splice(Number(index), 1);
            renderList(name);
            fillForm();
        } else {
            return;
        }
        recalc();
        scheduleSave();
    }

    function switchSlot(index) {
        clearTimeout(saveTimer);
        saveStore();
        store.active = Math.min(index, maxActive());
        character = store.characters[store.active] || blankCharacter();
        saveStore();
        renderAll();
    }

    function download() {
        clearTimeout(saveTimer);
        saveStore();
        if (!store.characters.length) {
            showStatus('There are no characters to download', true);
            return;
        }
        const data = {
            format: 'warhammer-characters',
            version: 1,
            characters: store.characters.map(exportable)
        };
        const yaml = '# Warhammer Fantasy Roleplay characters – warhammer.no\n' +
            jsyaml.dump(data, { lineWidth: -1, noRefs: true });
        const blob = new Blob([yaml], { type: 'text/yaml' });
        const a = el('a', { href: URL.createObjectURL(blob), download: 'warhammer-characters.yaml' });
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        showStatus(`Downloaded ${store.characters.length} character${store.characters.length === 1 ? '' : 's'}`);
    }

    // Loads a file with all characters (replacing the current ones). A file with a single
    // character, as written by earlier versions, is added as a new character instead.
    function upload(file) {
        const reader = new FileReader();
        reader.onload = () => {
            let data;
            try {
                data = jsyaml.load(reader.result);
            } catch (err) {
                showStatus('Not a valid YAML file', true);
                return;
            }
            const isList = Array.isArray(data) || (data && Array.isArray(data.characters));
            const list = (Array.isArray(data) ? data : (isList ? data.characters : [data]))
                .filter(c => c && typeof c === 'object' && !Array.isArray(c));
            if (!data || typeof data !== 'object' || !list.length) {
                showStatus('The file does not contain any characters', true);
                return;
            }

            clearTimeout(saveTimer);
            saveStore();

            if (!isList) {
                if (store.characters.length >= MAX_CHARACTERS) {
                    showStatus(`The limit of ${MAX_CHARACTERS} characters is reached`, true);
                    return;
                }
                character = normalize(list[0]);
                store.characters.push(character);
                store.active = store.characters.length - 1;
                saveStore();
                renderAll();
                showStatus('Character added');
                return;
            }

            const count = Math.min(list.length, MAX_CHARACTERS);
            if (store.characters.length &&
                !confirm(`Replace all ${store.characters.length} saved character${store.characters.length === 1 ? '' : 's'} with the ${count} in the file?`)) {
                return;
            }
            store.characters = list.slice(0, MAX_CHARACTERS).map(normalize);
            store.active = 0;
            character = store.characters[0];
            saveStore();
            renderAll();
            showStatus(list.length > MAX_CHARACTERS
                ? `Loaded ${count} characters (the file had ${list.length}, the limit is ${MAX_CHARACTERS})`
                : `Loaded ${count} character${count === 1 ? '' : 's'}`);
        };
        reader.readAsText(file);
    }

    // The portrait URL has no visible field; the Change picture button opens a dialog for it.
    // (A <dialog> is used instead of prompt(), which many mobile browsers block.)
    function openPortraitDialog() {
        const dialog = document.getElementById('portraitDialog');
        document.getElementById('portraitUrl').value = character.portrait || '';
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
        document.getElementById('portraitUrl').focus();
    }

    function closePortraitDialog() {
        const dialog = document.getElementById('portraitDialog');
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
    }

    function setPortrait(url) {
        character.portrait = url.trim();
        updatePortrait();
        scheduleSave();
        closePortraitDialog();
    }

    function clearSlot() {
        clearTimeout(saveTimer);
        saveStore();
        if (store.active >= store.characters.length) return; // the free slot has nothing to delete
        if (!confirm(`Delete "${character.name || 'Unnamed character'}"? Download your characters first if you want a backup.`)) return;
        store.characters.splice(store.active, 1);
        store.active = Math.min(store.active, maxActive());
        character = store.characters[store.active] || blankCharacter();
        saveStore();
        renderAll();
        showStatus('Character deleted');
    }

    // Style drop-down. The saved style is already applied by a script in <head>.
    function initTheme() {
        const select = document.getElementById('themeSelect');
        select.value = document.documentElement.getAttribute('data-theme') || '';
        select.addEventListener('change', () => {
            const theme = select.value;
            if (theme) document.documentElement.setAttribute('data-theme', theme);
            else document.documentElement.removeAttribute('data-theme');
            try {
                if (theme) localStorage.setItem(THEME_KEY, theme);
                else localStorage.removeItem(THEME_KEY);
            } catch (e) { /* style just isn't remembered */ }
        });
    }

    /* ---------- reference data (classes, careers, skills, talents) ---------- */

    // Loaded from data/reference.yaml and offered as drop-down suggestions (<datalist>) on the
    // matching fields. The fields stay free text, and without the file they work as before.
    let reference = null;

    function loadReference() {
        fetch(REFERENCE_URL)
            .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
            .then(text => {
                const data = jsyaml.load(text) || {};
                reference = {};
                ['classes', 'careers', 'skills', 'talents'].forEach(k => {
                    reference[k] = new Map((data[k] || []).map(entry => [entry.name.toLowerCase(), entry]));
                });
                buildDatalists();
                describeAll();
            })
            .catch(() => { /* no suggestions; the fields still take free text */ });
    }

    function datalist(id, options) {
        let list = document.getElementById(id);
        if (!list) list = document.body.appendChild(el('datalist', { id }));
        list.innerHTML = '';
        options.forEach(([value, label]) => list.append(el('option', { value, label })));
    }

    // "Lore (History)" → "lore", "Soldier – Recruit" → "soldier"
    function baseName(value) {
        return String(value || '').replace(/\s+[–-]\s.*$/, '').replace(/\s*\(.*$/, '').trim().toLowerCase();
    }

    function buildDatalists() {
        const careers = [...reference.careers.values()];
        const careerOptions = list => list.flatMap(c => [[c.name, `${c.class} – ${c.short}`]].concat(
            c.levels.map((l, i) => [`${c.name} – ${l.name}`, `Level ${i + 1} · ${l.status}`])));
        datalist('ref-classes', [...reference.classes.values()].map(c => [c.name, c.short]));
        datalist('ref-careers', careerOptions(careers));
        reference.classes.forEach(cls => datalist(`ref-careers-${cls.name}`, careerOptions(careers.filter(c => c.class === cls.name))));

        datalist('ref-skills', [...reference.skills.values()].flatMap(s => s.specialisations
            ? s.specialisations.map(spec => [`${s.name} (${spec})`, `${s.characteristic} · ${s.short}`])
            : [[s.name, `${s.characteristic} · ${s.short}`]]));
        reference.skills.forEach(s => {
            if (s.specialisations) datalist(`ref-spec-${s.name}`, s.specialisations.map(spec => [spec, null]));
        });
        const language = reference.skills.get('language');
        datalist('ref-languages', ((language && language.specialisations) || []).map(l => [l, null]));
        datalist('ref-talents', [...reference.talents.values()].flatMap(t =>
            [[t.name, t.short]].concat((t.examples || []).map(x => [`${t.name} (${x})`, t.short]))));
    }

    // Accepts "Soldier", "Soldier – Recruit" or just a level name such as "Recruit".
    function findCareer(value) {
        const v = String(value || '').trim().toLowerCase();
        const career = reference.careers.get(baseName(v));
        if (career) {
            const levelName = /\s[–-]\s/.test(v) ? v.replace(/^.*?\s[–-]\s*/, '') : '';
            return { career, level: Math.max(career.levels.findIndex(l => l.name.toLowerCase() === levelName), 0) };
        }
        for (const c of reference.careers.values()) {
            const level = c.levels.findIndex(l => l.name.toLowerCase() === v);
            if (level >= 0) return { career: c, level };
        }
        return null;
    }

    function findEntry(kind, value) {
        if (!reference || !value) return null;
        if (kind === 'careers') return findCareer(value);
        const map = reference[kind]; // none for languages
        return map ? map.get(String(value).trim().toLowerCase()) || map.get(baseName(value)) || null : null;
    }

    // Tooltip with the description of whatever the field names.
    function describe(input) {
        const kind = input.dataset.ref;
        const found = findEntry(kind, input.value);
        let text = '';
        if (kind === 'careers' && found) {
            const c = found.career;
            text = `${c.name} (${c.class}) – ${c.short}\n\n${c.description}\n\n` +
                c.levels.map((l, i) => `${i + 1}. ${l.name} – ${l.status}`).join('\n');
        } else if (kind === 'skills' && found) {
            text = `${found.name} (${found.characteristic}, ${found.type}) – ${found.short}\n\n${found.description}`;
        } else if (found) {
            text = `${found.name} – ${found.short}\n\n${found.description}`;
        }
        input.title = text;

        // The career suggestions follow the class picked on the same row
        if (kind === 'classes') {
            const row = input.dataset.path.split('.')[1];
            const careerInput = document.querySelector(`[data-path="careers.${row}.career"]`);
            careerInput.setAttribute('list', found ? `ref-careers-${found.name}` : 'ref-careers');
        }
    }

    function describeAll() {
        if (reference) document.querySelectorAll('[data-ref]').forEach(describe);
    }

    function fillIfEmpty(path, value, isListField) {
        if (getPath(character, path)) return;
        setPath(character, path, value);
        const input = document.querySelector(isListField ? `[data-list-field="${path}"]` : `[data-path="${path}"]`);
        if (input) {
            input.value = value;
            if (input.dataset.ref) describe(input);
        }
    }

    function applyReference(input) {
        const found = findEntry(input.dataset.ref, input.value);
        if (!found) return;
        const kind = input.dataset.ref;
        if (kind === 'careers') {
            const row = input.dataset.path.split('.')[1];
            fillIfEmpty(`careers.${row}.class`, found.career.class);
            fillIfEmpty(`careers.${row}.status`, found.career.levels[found.level].status);
        } else if (kind === 'talents') {
            fillIfEmpty(`talents.${input.dataset.listField.split('.')[1]}.description`, found.description, true);
        } else if (kind === 'skills') {
            fillIfEmpty(`customSkills.${input.dataset.listField.split('.')[1]}.char`, found.characteristic, true);
        }
    }

    // Draw button: opens a FlockMod drawing room named after the text field.
    // The name is shown in red until it is at least 8 letters long.
    const DRAW_URL = 'https://flockmod.com/r/';
    const DRAW_MIN = 8;

    function initDraw() {
        const input = document.getElementById('drawRoom');
        const open = () => {
            const room = input.value.trim();
            if (!room) { input.focus(); return; }
            window.open(DRAW_URL + encodeURIComponent(room), '_blank', 'noopener');
        };
        input.addEventListener('input', () => {
            input.classList.toggle('short', input.value.trim().length < DRAW_MIN);
        });
        input.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
        document.getElementById('drawBtn').addEventListener('click', open);
    }

    function init() {
        document.getElementById('menuBtn').addEventListener('click', () => {
            setMenu(document.getElementById('toolbar').hidden);
        });
        initTheme();
        initDraw();
        loadReference();
        renderCareers();
        renderCharacteristics();
        renderBasicSkills();
        renderCorruption();
        loadStore();
        renderAll();
        if (!storageOk) showStatus('Browser storage unavailable – use Download to keep your character', true);

        document.addEventListener('input', onInput);
        document.addEventListener('change', onInput);
        document.addEventListener('click', onClick);

        document.getElementById('slotSelect').addEventListener('change', e => switchSlot(Number(e.target.value)));
        document.getElementById('downloadBtn').addEventListener('click', download);
        document.getElementById('uploadBtn').addEventListener('click', () => document.getElementById('uploadInput').click());
        document.getElementById('uploadInput').addEventListener('change', e => {
            if (e.target.files[0]) upload(e.target.files[0]);
            e.target.value = '';
        });
        document.getElementById('printBtn').addEventListener('click', () => window.print());
        document.getElementById('clearBtn').addEventListener('click', clearSlot);

        document.getElementById('portraitBtn').addEventListener('click', openPortraitDialog);
        document.getElementById('portraitForm').addEventListener('submit', e => {
            e.preventDefault();
            setPortrait(document.getElementById('portraitUrl').value);
        });
        document.getElementById('portraitDefault').addEventListener('click', () => setPortrait(''));
        document.getElementById('portraitCancel').addEventListener('click', closePortraitDialog);

        const img = document.getElementById('portraitImg');
        img.addEventListener('error', () => {
            if (img.getAttribute('src') !== DEFAULT_PORTRAIT) img.setAttribute('src', DEFAULT_PORTRAIT);
        });

        // Flush pending edits when leaving the page.
        window.addEventListener('pagehide', () => { clearTimeout(saveTimer); saveStore(); });
    }

    init();
})();
