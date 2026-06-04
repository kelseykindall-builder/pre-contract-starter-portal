#!/usr/bin/env node
/**
 * capture.js
 * Captures full-page screenshots of every variant in a named board folder
 * and emits a SINGLE self-contained compare.html with all data, screenshots,
 * and variant HTML inlined. Works under file:// — no server, no fetch, no
 * CDN dependency required to open or share the output.
 *
 * Why: the old pipeline relied on a localhost server + runtime fetch() calls
 * for variants.json and sibling HTML files. Both fail silently when the file
 * is opened directly from Finder (file:// blocks fetch). This rewrite
 * eliminates both failure modes by baking everything in at capture time.
 * (Multi-board structure from #148; inlining approach from #138.)
 *
 * Usage: node capture.js <board-name> [--desktop] [--width <px>] [--surface <key>] [--name "Board name"]
 *   e.g. node capture.js homepage-exploration --surface my-petitions
 *        node capture.js homepage-exploration --desktop   # adds second 1280px pass
 *
 * Default capture width: 390px (mobile-first). Add --desktop for a 1280px second pass.
 * --width overrides the mobile capture width only.
 *
 * Inputs (discovered inside <board-name>/):
 *   variant-a-*.html ... variant-f-*.html
 *
 * Outputs (inside the board subfolder):
 *   <board-name>/assets/full-<key>.jpg    full-page screenshots (kept for reference)
 *   <board-name>/compare.html             self-contained deliverable (open via file://)
 *
 * And in the riff/ root:
 *   index.html                            refreshed picker listing every board
 */

const { chromium } = require('playwright');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { buildIndex } = require('./build-index');

// ----- CLI args -----
const args = process.argv.slice(2);
const positional = args.filter(a => !a.startsWith('--'));
const flagValue = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const MOBILE_WIDTH  = Number(flagValue('--width', 390));   // default: iPhone-class 390px
const DESKTOP_WIDTH = 1280;
const HEIGHT        = 900;
const DO_DESKTOP    = args.includes('--desktop');          // opt-in second pass at 1280px
const SURFACE_ARG   = flagValue('--surface', null);
const NAME_ARG      = flagValue('--name', null);

// Canonical Change.org surfaces — keep in sync with riff/SKILL.md and prototype/SKILL.md Phase 4.
const SURFACES = {
  'empty':                'Empty',
  'homepage':             'Homepage',
  'search':               'Search',
  'my-petitions':         'My Petitions',
  'psf-promote':          'PSF — Promote',
  'psf-share':            'PSF — Share',
  'psf-promote-or-share': 'PSF — Promote or Share',
  'petition':             'Petition',
};

const boardArg = positional[0];
if (!boardArg) {
  console.error('❌  Missing board name.\n');
  console.error('Usage: node capture.js <board-name> [--width 1280] [--surface <key>] [--name "Board name"]');
  console.error('Example: node capture.js homepage-exploration --surface my-petitions\n');
  process.exit(1);
}

// Normalize: accept "homepage-exploration", "./homepage-exploration", or
// "riff/homepage-exploration" — strip leading "./" and "riff/" since
// this script always lives inside riff/.
const boardName = boardArg
  .replace(/^\.\//, '')
  .replace(/^riff\//, '')
  .replace(/\/$/, '');

const TARGET_DIR = path.join(__dirname, boardName);

if (!fs.existsSync(TARGET_DIR) || !fs.statSync(TARGET_DIR).isDirectory()) {
  console.error(`❌  Board folder not found: ${TARGET_DIR}`);
  console.error(`\nCreate the folder and add variant-a-*.html (etc.) files first.\n`);
  process.exit(1);
}

// ----- Discover variants -----
const VARIANT_FILES = fs.readdirSync(TARGET_DIR)
  .filter(f => /^variant-[a-z]-.+\.html$/.test(f))
  .sort();

// Reject duplicate letters — would silently overwrite screenshots and
// break the manifest mapping. Surface the collision so the user can rename.
const seenKeys = new Map();
for (const file of VARIANT_FILES) {
  const key = file.match(/^variant-([a-z])-/)[1];
  if (seenKeys.has(key)) {
    console.error(`❌  Duplicate variant letter "${key}" in ${boardName}/:`);
    console.error(`      ${seenKeys.get(key)}`);
    console.error(`      ${file}`);
    console.error(`\nEach variant must use a unique letter (a–f). Rename one of these files and re-run.\n`);
    process.exit(1);
  }
  seenKeys.set(key, file);
}

const VARIANTS = VARIANT_FILES.map(file => ({
  file,
  key: file.match(/^variant-([a-z])-/)[1],
  fallbackLabel: file.replace(/^variant-[a-z]-/, '').replace(/\.html$/, '').replace(/-/g, ' ')
                     .replace(/\b\w/g, c => c.toUpperCase()),
}));

const SHELL_PATH = path.join(__dirname, 'compare-shell.html');
const ASSETS     = path.join(TARGET_DIR, 'assets');
const OUT_HTML   = path.join(TARGET_DIR, 'compare.html');

// boardSlug scopes localStorage (carts + commentary) per-board.
// Use the board folder NAME for readability plus a 6-char hash of its
// absolute path so two same-named boards in different projects get
// different storage scopes.
const dirHash      = crypto.createHash('sha1').update(TARGET_DIR).digest('hex').slice(0, 6);
const BOARD_SLUG   = `${boardName}-${dirHash}`;
const BOARD_TITLE  = NAME_ARG || boardName.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const SURFACE_KEY  = SURFACE_ARG && SURFACES[SURFACE_ARG] ? SURFACE_ARG : null;
const SURFACE_LABEL = SURFACE_KEY ? SURFACES[SURFACE_KEY] : null;
const PROJECT_DIR  = __dirname;  // absolute path to the riff/ folder

if (SURFACE_ARG && !SURFACE_KEY) {
  console.warn(`⚠️   Unknown surface "${SURFACE_ARG}" — ignoring. Valid keys: ${Object.keys(SURFACES).join(', ')}`);
}

function fileUrl(absPath) {
  // Convert an absolute path to a file:// URL, encoding each path segment.
  return 'file://' + absPath.split(path.sep).map(encodeURIComponent).join('/');
}

// JSON-stringify a value so it's safe to drop inside an inline <script>.
function jsonForScript(value) {
  return JSON.stringify(value)
    .replace(/<\/script/gi, '<\\/script')
    .replace(/<!--/g, '<\\!--')
    .replace(/-->/g, '--\\>')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

async function capture() {
  if (VARIANTS.length === 0) {
    console.error(`❌  No variant files found in ${boardName}/ (expected variant-a-*.html, etc.)`);
    process.exit(1);
  }

  if (!fs.existsSync(SHELL_PATH)) {
    console.error(`❌  Compare board template missing: ${SHELL_PATH}`);
    console.error(`     Re-copy reference/compare-shell.html from the riff skill.\n`);
    process.exit(1);
  }

  fs.mkdirSync(ASSETS, { recursive: true });

  const browser = await chromium.launch();
  console.log(`\n📸  Capturing ${VARIANTS.length} variants from ${boardName}/ at ${MOBILE_WIDTH}px (mobile)${DO_DESKTOP ? ' + 1280px (desktop)' : ''} via file://...\n`);

  const concepts = {}; // { [key]: { variant, name, summary, concepts: [...] } }

  async function screenshotVariant(page, variantPath, width, outPath) {
    await page.setViewportSize({ width, height: HEIGHT });
    const url = fileUrl(variantPath);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    } catch {
      await page.goto(url, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(1500);
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await page.screenshot({ path: outPath, fullPage: true, type: 'jpeg', quality: 88 });
  }

  for (const v of VARIANTS) {
    const variantPath = path.join(TARGET_DIR, v.file);

    // --- Mobile pass (always) ---
    const mobilePage = await browser.newPage();
    const mobileOut  = path.join(ASSETS, `full-${v.key}.jpg`);

    // Extract concept metadata on the mobile pass
    await mobilePage.setViewportSize({ width: MOBILE_WIDTH, height: HEIGHT });
    const url = fileUrl(variantPath);
    try {
      await mobilePage.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    } catch {
      await mobilePage.goto(url, { waitUntil: 'load', timeout: 20000 });
      await mobilePage.waitForTimeout(1500);
    }
    await mobilePage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await mobilePage.waitForTimeout(400);
    await mobilePage.evaluate(() => window.scrollTo(0, 0));
    await mobilePage.waitForTimeout(200);

    const conceptData = await mobilePage.evaluate(() => {
      const el = document.getElementById('riff-concepts');
      if (!el) return null;
      try { return JSON.parse(el.textContent); }
      catch { return null; }
    });
    v.short  = (conceptData && conceptData.name)    || v.fallbackLabel;
    v.teaser = (conceptData && conceptData.summary) || '';
    if (conceptData) concepts[v.key] = conceptData;

    await mobilePage.screenshot({ path: mobileOut, fullPage: true, type: 'jpeg', quality: 88 });
    await mobilePage.close();

    const mobileKb = Math.round(fs.statSync(mobileOut).size / 1024);
    console.log(`  ✓  Variant ${v.key.toUpperCase()} — ${v.short} (mobile ${mobileKb} KB)`);

    // --- Desktop pass (opt-in) ---
    if (DO_DESKTOP) {
      const desktopOut = path.join(ASSETS, `full-${v.key}-desktop.jpg`);
      const desktopPage = await browser.newPage();
      await screenshotVariant(desktopPage, variantPath, DESKTOP_WIDTH, desktopOut);
      await desktopPage.close();
      v.screenshotDesktop = `data:image/jpeg;base64,${fs.readFileSync(desktopOut).toString('base64')}`;
      const desktopKb = Math.round(fs.statSync(desktopOut).size / 1024);
      console.log(`          desktop ${desktopKb} KB`);
    }

  }

  await browser.close();

  // ============ INLINE EVERYTHING INTO compare.html ============
  // Base64-encode screenshots and inline raw variant HTML as srcdoc strings.
  // The result is fully portable — open from Finder, share via Slack or email.
  console.log('\n📦  Inlining screenshots + variant HTML into compare.html...');

  const inlinedVariants = VARIANTS.map(v => {
    const shotPath = path.join(ASSETS, `full-${v.key}.jpg`);
    const shotB64  = fs.readFileSync(shotPath).toString('base64');

    return {
      key:               v.key,
      file:              v.file,
      label:             v.key.toUpperCase(),
      short:             v.short,
      teaser:            v.teaser,
      screenshot:        `data:image/jpeg;base64,${shotB64}`,
      screenshotDesktop: v.screenshotDesktop || null,  // null if --desktop not passed
      srcdoc:            fs.readFileSync(path.join(TARGET_DIR, v.file), 'utf8'),
    };
  });

  const shell = fs.readFileSync(SHELL_PATH, 'utf8');
  const replacements = {
    __BOARD_TITLE__:        BOARD_TITLE.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    __BOARD_TITLE_JSON__:   JSON.stringify(BOARD_TITLE),
    __BOARD_SLUG_JSON__:    JSON.stringify(BOARD_SLUG),
    __SURFACE_JSON__:       JSON.stringify(SURFACE_KEY),
    __SURFACE_LABEL_JSON__: JSON.stringify(SURFACE_LABEL),
    __PROJECT_DIR_JSON__:   JSON.stringify(PROJECT_DIR),
    __HAS_DESKTOP_JSON__:   JSON.stringify(DO_DESKTOP),
    __VARIANTS_JSON__:      jsonForScript(inlinedVariants),
    __CONCEPTS_JSON__:      jsonForScript(concepts),
  };

  let html = shell;
  for (const [token, value] of Object.entries(replacements)) {
    html = html.split(token).join(value);
  }

  fs.writeFileSync(OUT_HTML, html);
  const sizeMb = (fs.statSync(OUT_HTML).size / (1024 * 1024)).toFixed(2);
  console.log(`✅  Wrote ${boardName}/compare.html (${sizeMb} MB, ${inlinedVariants.length} variants, slug: "${BOARD_SLUG}")`);
  console.log(`\n   Open it:  open "${OUT_HTML}"`);
  console.log(`   Or share: works from any folder, including Downloads.\n`);

  // Refresh the top-level picker so the new (or updated) board shows up.
  const indexResult = buildIndex({ riffDir: __dirname, silent: false });
  if (indexResult && indexResult.count > 0) {
    console.log(`🗂   Index updated — ${indexResult.count} board${indexResult.count === 1 ? '' : 's'} listed in riff/index.html`);
  }
}

capture().catch(err => {
  console.error('\n❌  Capture failed:', err.message);
  if (err.stack) console.error(err.stack.split('\n').slice(1, 5).join('\n'));
  process.exit(1);
});
