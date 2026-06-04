#!/usr/bin/env node
/**
 * build-index.js
 * Scans riff/ for board subfolders that contain a variants.json manifest
 * and writes riff/index.html — a picker that lists every board with its
 * first screenshot as a thumbnail and a link to its compare board.
 *
 * Called automatically by capture.js after a successful capture. Also
 * runnable standalone if you've manually added, renamed, or deleted a
 * board folder and want the picker to catch up:
 *   node build-index.js
 */

const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set(['node_modules', 'assets', '.git', '.cache']);

function buildIndex({ riffDir = __dirname, silent = true } = {}) {
  const entries = fs.readdirSync(riffDir, { withFileTypes: true });

  const boards = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.')) continue;

    const manifestPath = path.join(riffDir, entry.name, 'variants.json');
    if (!fs.existsSync(manifestPath)) continue;

    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (err) {
      if (!silent) console.warn(`⚠   Skipping ${entry.name}/ — variants.json is malformed: ${err.message}`);
      continue;
    }
    if (!manifest || !Array.isArray(manifest.variants) || manifest.variants.length === 0) continue;

    const stat = fs.statSync(manifestPath);
    const thumb = manifest.variants[0]?.screenshot;
    boards.push({
      name: entry.name,
      slug: manifest.boardSlug || entry.name,
      variantCount: manifest.variants.length,
      firstVariantName: manifest.variants[0]?.short || '',
      firstVariantTeaser: manifest.variants[0]?.teaser || '',
      thumb: thumb ? `${entry.name}/${thumb}` : null,
      compareUrl: `${entry.name}/compare.html`,
      mtime: stat.mtimeMs,
    });
  }

  // Most recently captured first.
  boards.sort((a, b) => b.mtime - a.mtime);

  const html = renderHtml(boards);
  const outPath = path.join(riffDir, 'index.html');
  fs.writeFileSync(outPath, html);

  return { count: boards.length, outPath };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function formatRelativeTime(ms) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(ms).toLocaleDateString();
}

function renderHtml(boards) {
  const cards = boards.map(b => `
    <a class="board-card" href="${escapeHtml(b.compareUrl)}">
      <div class="board-thumb">
        ${b.thumb
          ? `<img src="${escapeHtml(b.thumb)}" alt="" loading="lazy">`
          : `<div class="board-thumb-empty">No screenshots yet</div>`}
      </div>
      <div class="board-body">
        <div class="board-title">${escapeHtml(b.name)}</div>
        <div class="board-meta">
          <span>${b.variantCount} variant${b.variantCount === 1 ? '' : 's'}</span>
          <span class="dot">·</span>
          <span>${escapeHtml(formatRelativeTime(b.mtime))}</span>
        </div>
        ${b.firstVariantTeaser ? `<div class="board-teaser">${escapeHtml(b.firstVariantTeaser)}</div>` : ''}
      </div>
    </a>`).join('');

  const empty = `
    <div class="empty-state">
      <div class="empty-title">No riffs yet</div>
      <div class="empty-body">
        Create a folder here (e.g. <code>homepage-exploration/</code>), drop in
        <code>variant-a-*.html</code> through <code>variant-f-*.html</code> plus
        a <code>compare.html</code>, then run:
        <pre>node capture.js homepage-exploration</pre>
      </div>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Riffs</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Commissioner:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #faf8f5;
    --card-bg: #ffffff;
    --stroke: #ecead0;
    --text-strong: #1a1a1a;
    --text: #4a4a4a;
    --text-weak: #8a8a85;
    --accent: #f04d23;
    --shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04);
    --shadow-hover: 0 2px 4px rgba(0,0,0,0.06), 0 12px 28px rgba(0,0,0,0.08);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: 'Commissioner', system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  .page {
    max-width: 1240px;
    margin: 0 auto;
    padding: 56px 32px 96px;
  }
  .header {
    margin-bottom: 40px;
  }
  .eyebrow {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 8px;
  }
  h1 {
    font-size: 32px;
    font-weight: 700;
    color: var(--text-strong);
    margin: 0 0 8px;
    letter-spacing: -0.02em;
  }
  .subtitle {
    font-size: 15px;
    color: var(--text-weak);
    margin: 0;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }
  .board-card {
    display: block;
    background: var(--card-bg);
    border: 1px solid var(--stroke);
    border-radius: 12px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    box-shadow: var(--shadow);
    transition: transform 200ms cubic-bezier(.2,.7,.2,1), box-shadow 200ms cubic-bezier(.2,.7,.2,1);
  }
  .board-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover);
  }
  .board-thumb {
    aspect-ratio: 16 / 10;
    background: #f4f2ec;
    overflow: hidden;
    position: relative;
    border-bottom: 1px solid var(--stroke);
  }
  .board-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
  }
  .board-thumb-empty {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: var(--text-weak);
    font-size: 13px;
  }
  .board-body {
    padding: 16px 18px 18px;
  }
  .board-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-strong);
    letter-spacing: -0.01em;
    margin-bottom: 6px;
    word-break: break-word;
  }
  .board-meta {
    font-size: 12px;
    color: var(--text-weak);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .board-meta .dot {
    opacity: 0.5;
  }
  .board-teaser {
    margin-top: 10px;
    font-size: 13px;
    color: var(--text);
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .empty-state {
    padding: 48px 32px;
    border: 1px dashed var(--stroke);
    border-radius: 12px;
    background: var(--card-bg);
    text-align: center;
  }
  .empty-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-strong);
    margin-bottom: 8px;
  }
  .empty-body {
    font-size: 13px;
    color: var(--text-weak);
    line-height: 1.6;
  }
  code, pre {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  code {
    background: var(--bg);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    color: var(--text-strong);
  }
  pre {
    background: var(--bg);
    padding: 12px 14px;
    border-radius: 8px;
    margin: 12px auto 0;
    display: inline-block;
    text-align: left;
    font-size: 12px;
    color: var(--text-strong);
  }
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="eyebrow">Riffs</div>
      <h1>${boards.length === 0 ? 'No boards yet' : `${boards.length} board${boards.length === 1 ? '' : 's'}`}</h1>
      <p class="subtitle">Divergent design exploration — pick a board to open its compare view.</p>
    </div>
    ${boards.length === 0 ? empty : `<div class="grid">${cards}</div>`}
  </div>
</body>
</html>
`;
}

// Run when invoked directly (not when required by capture.js).
if (require.main === module) {
  const result = buildIndex({ riffDir: __dirname, silent: false });
  if (result.count === 0) {
    console.log('🗂   No boards found — wrote empty index.html.');
  } else {
    console.log(`🗂   Wrote index.html — ${result.count} board${result.count === 1 ? '' : 's'} listed.`);
  }
}

module.exports = { buildIndex };
