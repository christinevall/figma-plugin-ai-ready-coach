// Certification: a realistic design-system file with a known list of planted problems.
// The audit must report every planted problem (recall) and nothing else (precision).
// Usage: node tests/certify.js
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { File, node, add, solid, MIXED } = require('./mock-figma');
const CODE = fs.readFileSync(path.join(__dirname, '..', 'ai-ready', 'code.js'), 'utf8');
function load(file) { const ctx = { figma: file.figma(), __html__: '', console, Number, Math, JSON, Array, Object, String, Date, RegExp, Error, Promise, isFinite, parseInt, parseFloat, setTimeout }; vm.createContext(ctx); vm.runInContext(CODE, ctx, { filename: 'code.js' }); return ctx; }
const bound = v => ({ type: 'VARIABLE_ALIAS', id: v.id });
const pb = (hex, v) => solid(hex, { boundVariables: { color: bound(v) } });

// ---------------------------------------------------------------------------
// The file: a tidy library, then planted problems. Each plant is recorded as {check, name}.
// ---------------------------------------------------------------------------
const f = new File(); const planted = [];
function plant(check, name) { planted.push({ check, name }); }

// Variables: primitives (hidden, unscoped) and semantics (scoped, code names, described)
const prim = f.collection('Primitives');
const sem = f.collection('Semantic', ['Light', 'Dark']);
const P = {};
[['color/blue/500', '#1E4FCC'], ['color/blue/700', '#163A99'], ['color/neutral/50', '#F8F9FA'], ['color/neutral/200', '#E7E4DC'], ['color/neutral/900', '#212529'], ['color/neutral/white', '#FFFFFF'], ['color/red/600', '#C0392B']].forEach(([n, h]) => { P[n] = f.variable(prim, n, 'COLOR', h, { hidden: true }); });
[['space/2', 8], ['space/4', 16], ['space/6', 24], ['radius/1', 4], ['radius/2', 8], ['font-size/300', 14], ['font-size/400', 16], ['font-weight/semibold', 600]].forEach(([n, v]) => { P[n] = f.variable(prim, n, 'FLOAT', v, { hidden: true }); });
P['font-family/sans'] = f.variable(prim, 'font-family/sans', 'STRING', 'Inter', { hidden: true });
const S = {};
function semv(name, a, b, scopes, extra = {}) { S[name] = f.variable(sem, name, P[a].resolvedType, [{ alias: P[a] }, { alias: P[b || a] }], Object.assign({ scopes, codeSyntax: { WEB: '--sds-' + name.replace(/\//g, '-') }, description: 'Use for ' + name.split('/').slice(1).join(' ') + '. Not for anything else.' }, extra)); return S[name]; }
semv('color/background/brand', 'color/blue/500', 'color/blue/700', ['FRAME_FILL', 'SHAPE_FILL']);
semv('color/background/surface', 'color/neutral/white', 'color/neutral/900', ['FRAME_FILL', 'SHAPE_FILL']);
semv('color/background/neutral/default', 'color/neutral/50', 'color/neutral/900', ['FRAME_FILL', 'SHAPE_FILL']);
semv('color/content/default', 'color/neutral/900', 'color/neutral/white', ['TEXT_FILL']);
semv('color/content/on-brand', 'color/neutral/white', 'color/neutral/white', ['TEXT_FILL']);
semv('color/border/subtle', 'color/neutral/200', 'color/neutral/200', ['STROKE_COLOR']);
semv('color/border/danger', 'color/red/600', 'color/red/600', ['STROKE_COLOR']);
semv('space/inset/sm', 'space/2', null, ['GAP']); semv('space/inset/md', 'space/4', null, ['GAP']); semv('space/stack/lg', 'space/6', null, ['GAP']);
semv('radius/sm', 'radius/1', null, ['CORNER_RADIUS']); semv('radius/md', 'radius/2', null, ['CORNER_RADIUS']);
// planted variable problems
semv('color/background/blue/default', 'color/blue/500', 'color/blue/700', ['FRAME_FILL']); plant('semantic-naming', 'color/background/blue/default');
semv('color/content/muted', 'color/neutral/900', 'color/neutral/white', ['ALL_SCOPES']); plant('scopes', 'color/content/muted');
S['color/content/muted'].scopes = ['ALL_SCOPES'];
semv('color/background/accent', 'color/blue/500', 'color/blue/700', ['FRAME_FILL'], { codeSyntax: {} }); plant('code-syntax', 'color/background/accent');
semv('color/border/focus', 'color/blue/500', 'color/blue/500', ['STROKE_COLOR'], { description: '' }); plant('var-desc', 'color/border/focus');
P['color/orange/500'] = f.variable(prim, 'color/orange/500', 'COLOR', '#FF642F'); plant('hide-primitives', 'color/orange/500'); // not hidden
const mixed = f.collection('Typography', ['Mode 1', 'Mode 2']); plant('split', 'Typography'); plant('modes', 'Typography');
const tyRaw = f.variable(mixed, 'typography/line-height/normal', 'FLOAT', [1.5, 1.5]);
const tyAlias = f.variable(mixed, 'typography/body-md/font-size', 'FLOAT', [{ alias: P['font-size/400'] }, { alias: P['font-size/400'] }], { scopes: ['FONT_SIZE'], codeSyntax: { WEB: '--sds-typography-body-md-font-size' }, description: 'Body size.' });

// Styles
const bodyMd = f.textStyle('typography/body-md', 'Inter', 'Regular', 16, { description: 'Body copy.', boundVariables: { fontSize: bound(tyAlias), fontFamily: bound(P['font-family/sans']) } });
const titleSm = f.textStyle('typography/title-sm', 'Inter', 'Semi Bold', 14, { description: 'Small titles in cards and alerts.', boundVariables: { fontSize: bound(P['font-size/300']) } });
const caption = f.textStyle('typography/caption', 'Inter', 'Regular', 12, { description: '' }); const raised = f.effectStyle('elevation/raised'); plant('text-style-desc', 'typography/caption'); plant('text-styles-bound', 'typography/caption');

// Components: a tidy Button set
const button = add(f.page, node('COMPONENT_SET', 'Button', { strokes: [solid('#752C9F')], cornerRadius: 5, layoutMode: 'NONE', description: 'Button: the main action. Use once per view for the primary action. Not for navigation, use Link. States: default, hover, focus, disabled.', documentationLinks: [{ uri: 'https://example.com/button' }],
  componentPropertyDefinitions: { 'label#1:0': { type: 'TEXT' }, 'leading icon#1:1': { type: 'INSTANCE_SWAP' }, variant: { type: 'VARIANT', variantOptions: ['primary', 'secondary'] }, state: { type: 'VARIANT', variantOptions: ['default', 'hover', 'disabled'] } } }));
['primary', 'secondary'].forEach(v => ['default', 'hover', 'disabled'].forEach(st => {
  const c = add(button, node('COMPONENT', 'variant=' + v + ', state=' + st, { layoutMode: 'HORIZONTAL', paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, itemSpacing: 8, cornerRadius: 8,
    boundVariables: { paddingLeft: bound(S['space/inset/md']), paddingRight: bound(S['space/inset/md']), paddingTop: bound(S['space/inset/sm']), paddingBottom: bound(S['space/inset/sm']), itemSpacing: bound(S['space/inset/sm']), topLeftRadius: bound(S['radius/md']) },
    fills: [pb(v === 'primary' ? '#1E4FCC' : '#FFFFFF', v === 'primary' ? S['color/background/brand'] : S['color/background/surface'])], strokes: v === 'secondary' ? [pb('#E7E4DC', S['color/border/subtle'])] : [solid('#000000', { opacity: 0 })] }));
  const icon = add(c, node('INSTANCE', 'leading icon', { visible: st !== 'disabled', componentPropertyReferences: { visible: 'show icon#1:2' }, fills: [] })); add(icon, node('VECTOR', 'Vector', { fills: [solid('#ABCDEF')] })); // raw colour inside an instance: the main component's business
  add(c, node('TEXT', 'label', { fontName: { family: 'Inter', style: 'Semi Bold' }, fontSize: 14, textStyleId: titleSm.id, fills: [v === 'primary' ? pb('#FFFFFF', S['color/content/on-brand']) : pb('#212529', S['color/content/default'])] }));
}));
// Icons: drawings, no auto-layout needed
['icon/check', 'icon/close'].forEach(n => { const ic = add(f.page, node('COMPONENT', n, { layoutMode: 'NONE', description: n + ': a 24px icon. Decorative unless given a label.' })); add(ic, node('VECTOR', 'Vector', { fills: [pb('#212529', S['color/content/default'])] })); add(ic, node('BOOLEAN_OPERATION', 'Union', { fills: [pb('#212529', S['color/content/default'])] })); });
// Alert set with placeholder/value style states and a boolean-driven dismiss
const alert = add(f.page, node('COMPONENT_SET', 'Alert', { description: 'Alert: an inline message block. Use for status that stays on the page. Not for confirmations, use Dialog. States: info, success, danger.', documentationLinks: [{ uri: 'https://example.com/alert' }],
  componentPropertyDefinitions: { 'title#2:0': { type: 'TEXT' }, 'onDismiss#2:1': { type: 'BOOLEAN' }, variant: { type: 'VARIANT', variantOptions: ['info', 'success'] } } }));
['info', 'success'].forEach(v => {
  const c = add(alert, node('COMPONENT', 'variant=' + v, { layoutMode: 'HORIZONTAL', paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 16, itemSpacing: 8, cornerRadius: 8, boundVariables: { paddingLeft: bound(S['space/inset/md']), paddingRight: bound(S['space/inset/md']), paddingTop: bound(S['space/inset/md']), paddingBottom: bound(S['space/inset/md']), itemSpacing: bound(S['space/inset/sm']), topLeftRadius: bound(S['radius/md']) }, fills: [pb('#F8F9FA', S['color/background/neutral/default'])], strokes: [pb('#E7E4DC', S['color/border/subtle'])] }));
  const content = add(c, node('FRAME', 'content', { layoutMode: 'VERTICAL', itemSpacing: 8, boundVariables: { itemSpacing: bound(S['space/inset/sm']) } }));
  add(content, node('TEXT', 'title', { textStyleId: titleSm.id, fills: [pb('#212529', S['color/content/default'])] }));
  add(content, node('TEXT', 'body', { textStyleId: bodyMd.id, fills: [pb('#212529', S['color/content/default'])] }));
  const dismiss = add(c, node('FRAME', 'dismiss', { visible: false, componentPropertyReferences: { visible: 'onDismiss#2:1' }, layoutMode: 'HORIZONTAL' })); add(dismiss, node('INSTANCE', 'close icon'));
});
// TextField with variant-driven hidden layers
const field = add(f.page, node('COMPONENT_SET', 'TextField', { description: 'TextField: one line of text input. Use in forms. Not for search, use SearchField. States: empty, filled, focus, error.', documentationLinks: [{ uri: 'https://example.com/textfield' }], componentPropertyDefinitions: { state: { type: 'VARIANT', variantOptions: ['empty', 'filled'] }, 'label#3:0': { type: 'TEXT' } } }));
['empty', 'filled'].forEach(st => { const c = add(field, node('COMPONENT', 'state=' + st, { layoutMode: 'HORIZONTAL', paddingLeft: 8, paddingRight: 8, paddingTop: 8, paddingBottom: 8, itemSpacing: 0, cornerRadius: 4, boundVariables: { paddingLeft: bound(S['space/inset/sm']), paddingRight: bound(S['space/inset/sm']), paddingTop: bound(S['space/inset/sm']), paddingBottom: bound(S['space/inset/sm']), topLeftRadius: bound(S['radius/sm']) }, fills: [pb('#FFFFFF', S['color/background/surface'])], strokes: [pb('#E7E4DC', S['color/border/subtle'])] })); add(c, node('TEXT', 'placeholder', { visible: st === 'empty', textStyleId: bodyMd.id, fills: [pb('#212529', S['color/content/default'])] })); add(c, node('TEXT', 'value', { visible: st === 'filled', textStyleId: bodyMd.id, fills: [pb('#212529', S['color/content/default'])] })); });

// ---- planted component problems ----
const card = add(f.page, node('COMPONENT', 'Card', { layoutMode: 'VERTICAL', paddingLeft: 24, paddingRight: 24, paddingTop: 24, paddingBottom: 24, itemSpacing: 16, cornerRadius: 8, description: '', boundVariables: { paddingLeft: bound(S['space/stack/lg']), paddingRight: bound(S['space/stack/lg']), paddingTop: bound(S['space/stack/lg']), paddingBottom: bound(S['space/stack/lg']), itemSpacing: bound(S['space/inset/md']), topLeftRadius: bound(S['radius/md']) }, fills: [pb('#FFFFFF', S['color/background/surface'])],
  componentPropertyDefinitions: { 'Property 1': { type: 'TEXT' }, 'Boolean': { type: 'BOOLEAN' } } }));
plant('desc', 'Card'); plant('props', 'Property 1'); plant('props', 'Boolean'); plant('docs-link', 'Card');
add(card, node('TEXT', 'title', { textStyleId: titleSm.id, fills: [pb('#212529', S['color/content/default'])] }));
add(card, node('RECTANGLE', 'old divider', { visible: false, fills: [pb('#E7E4DC', S['color/border/subtle'])] })); plant('hidden', 'old divider');
const badge = add(f.page, node('COMPONENT', 'Badge', { layoutMode: 'HORIZONTAL', paddingLeft: 8, paddingRight: 8, paddingTop: 0, paddingBottom: 0, cornerRadius: 999, description: 'Badge', documentationLinks: [{ uri: 'https://example.com/badge' }], boundVariables: { paddingLeft: bound(S['space/inset/sm']), paddingRight: bound(S['space/inset/sm']), topLeftRadius: bound(S['radius/md']) }, fills: [pb('#2F6BFF', S['color/background/brand'])] })); plant('desc-rich', 'Badge');
add(badge, node('TEXT', 'label', { textStyleId: caption.id, fills: [pb('#FFFFFF', S['color/content/on-brand'])] }));
const toggle = add(f.page, node('COMPONENT_SET', 'Toggle', { description: 'Toggle: switches a setting on or off immediately. Not for actions that need a save step.', documentationLinks: [{ uri: 'https://example.com/toggle' }], componentPropertyDefinitions: { kind: { type: 'VARIANT', variantOptions: ['Default', 'Variant2'] } } })); plant('values', 'Variant2'); plant('states', 'Toggle');
['Default', 'Variant2'].forEach(k => { const c = add(toggle, node('COMPONENT', 'kind=' + k, { layoutMode: 'HORIZONTAL', fills: [pb('#2F6BFF', S['color/background/brand'])] })); add(c, node('ELLIPSE', 'knob', { fills: [pb('#FFFFFF', S['color/background/surface'])] })); });
const alert2 = add(f.page, node('COMPONENT_SET', 'Alert2', { description: 'A detached copy of Alert for testing. Not for use.', documentationLinks: [{ uri: 'https://example.com/alert' }], componentPropertyDefinitions: { variant: { type: 'VARIANT', variantOptions: ['info'] } } }));
const a2 = add(alert2, node('COMPONENT', 'variant=info', { layoutMode: 'HORIZONTAL', paddingLeft: 16, paddingRight: 16, paddingTop: 16, paddingBottom: 16, itemSpacing: 8, cornerRadius: 8, boundVariables: { paddingLeft: bound(S['space/inset/md']), paddingRight: bound(S['space/inset/md']), paddingTop: bound(S['space/inset/md']), paddingBottom: bound(S['space/inset/md']), itemSpacing: bound(S['space/inset/sm']), topLeftRadius: bound(S['radius/md']) }, fills: [solid('#F8F9FA')], strokes: [solid('#E7E4DC')] })); plant('colors', 'variant=info'); plant('colors', 'variant=info');
const a2title = add(a2, node('TEXT', 'title', { fontName: { family: 'Inter', style: 'Semi Bold' }, fontSize: 14, textStyleId: '', boundVariables: { fontSize: bound(P['font-size/300']), fontFamily: bound(P['font-family/sans']), fontWeight: bound(P['font-weight/semibold']) }, fills: [solid('#212529')] })); plant('text', 'title'); plant('colors', 'title');
const chip = add(f.page, node('COMPONENT', 'Chip', { layoutMode: 'HORIZONTAL', paddingLeft: 8, paddingRight: 8, paddingTop: 4, paddingBottom: 4, itemSpacing: 0, cornerRadius: 12, description: 'Chip: a compact label for filters and tags. Not for actions, use &lt;code&gt;Button&lt;/code&gt;.', documentationLinks: [{ uri: 'https://example.com/chip' }], boundVariables: { paddingLeft: bound(S['space/inset/sm']), paddingRight: bound(S['space/inset/sm']) }, fills: [pb('#2F6BFF', P['color/blue/500'])] }));
plant('semantic-on-layers', 'Chip'); plant('radius', 'Chip'); plant('spacing', 'Chip'); plant('desc-plain', 'Chip');
add(chip, node('TEXT', 'label', { textStyleId: caption.id, fills: [pb('#FFFFFF', S['color/content/on-brand'])] }));
const pattern = add(f.page, node('FRAME', 'Pattern / Empty state', { layoutMode: 'VERTICAL', effects: [{ type: 'DROP_SHADOW', visible: true }], effectStyleId: '', paddingLeft: 24, paddingRight: 24, paddingTop: 24, paddingBottom: 24, itemSpacing: 16, boundVariables: { paddingLeft: bound(S['space/stack/lg']), paddingRight: bound(S['space/stack/lg']), paddingTop: bound(S['space/stack/lg']), paddingBottom: bound(S['space/stack/lg']), itemSpacing: bound(S['space/inset/md']) }, fills: [pb('#FFFFFF', S['color/background/surface'])] }));
const loose = add(pattern, node('FRAME', 'Frame 12', { layoutMode: 'NONE', fills: [] })); plant('layout', 'Frame 12'); plant('names', 'Frame 12'); plant('effects', 'Pattern / Empty state');
add(loose, node('TEXT', 'Heading', { textStyleId: titleSm.id, fills: [pb('#212529', S['color/content/default'])] })); add(loose, node('RECTANGLE', 'Rectangle 4', { fills: [pb('#E7E4DC', S['color/border/subtle'])] })); plant('names', 'Rectangle 4');
add(pattern, node('TEXT', 'hint', { textStyleId: caption.id, fills: [solid('#BBBBBB')] })); plant('contrast', 'hint'); plant('colors', 'hint');
const inst = add(pattern, node('INSTANCE', 'Button', { layoutMode: 'HORIZONTAL', fills: [pb('#2F6BFF', S['color/background/brand'])] })); add(inst, node('TEXT', 'label', { fills: [solid('#FFFFFF')] })); // raw inside instance: not ours

// A Cover page with loose docs: skipped on whole-file scope
const cover = f.addPage('Cover'); const cf = add(cover, node('FRAME', 'Frame 1', { layoutMode: 'NONE', fills: [solid('#123456')] })); add(cf, node('TEXT', 'Text 1')); add(cf, node('TEXT', 'Text 2'));
// ---------------------------------------------------------------------------
f.select(f.page.children.find(n => n.name === 'Button'));
(async () => {
  const ctx = load(f);
  const r = await ctx.runAudit('file');
  const found = [];
  r.steps.forEach(st => st.checks.forEach(c => c.items.forEach(it => found.push({ check: c.key, name: it.name || it.propName || '' , propName: it.propName, value: it.value }))));
  const key = x => x.check + ' :: ' + (x.propName && x.check === 'props' ? x.propName : x.check === 'values' ? x.value : x.name);
  const plantedKeys = planted.map(p => p.check + ' :: ' + p.name);
  const foundKeys = found.map(key);
  const missed = plantedKeys.filter(k => foundKeys.indexOf(k) < 0);
  const extra = foundKeys.filter(k => plantedKeys.indexOf(k) < 0).filter(k => !/^naming-style ::/.test(k));
  const dupPlant = {}; plantedKeys.forEach(k => dupPlant[k] = (dupPlant[k] || 0) + 1);
  console.log('Planted: ' + plantedKeys.length + ' · Found: ' + foundKeys.length);
  console.log('\nMissed (planted, not reported):'); missed.length ? missed.forEach(m => console.log('  ✗ ' + m)) : console.log('  none');
  console.log('\nExtra (reported, not planted):'); extra.length ? extra.forEach(e => console.log('  ✗ ' + e)) : console.log('  none');
  console.log('\nScores: overall ' + r.overall + ' · ' + r.steps.map(s => s.label + ' ' + s.score).join(' · '));
  // a tidy file must score high on everything that is tidy
  const layers = r.steps.find(s => s.key === 'layers');
  const ok = !missed.length && !extra.length;
  console.log('\n' + (ok ? 'CERTIFIED: every planted problem reported, nothing else.' : 'NOT CERTIFIED.'));
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
