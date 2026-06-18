// build.js — stitches landing/sections/*.html into the final index.html
//
// Lives inside /public/landing along with everything else the landing page
// needs: index.template.html, sections/ (one HTML file per section),
// styles/ (one matching CSS file per section), and scripts/landing.js. The
// ONE thing that stays outside this folder is the built index.html itself
// — it has to sit at the project root because that's what the live site
// serves by default.
//
// Each section file under landing/sections/ is ALSO a complete, openable
// HTML page on its own (double-click it, it loads its own CSS via <base
// href="../../../">) so you can preview just that one section while editing it.
//
// Edit the section file you need (only the part between the
// ===SECTION-CONTENT-START/END=== markers — leave the <head>/<base> stuff
// alone, that's preview-only), then run from inside public/landing/:
//
//     node build.js
//
// This reads index.template.html, replaces each
//   <!-- include:sectionname.html -->
// marker with that section's CONTENT MARKERS region only (its preview-only
// <head>/<base>/CSS-links wrapper is stripped — index.html already has all
// CSS linked once in its own <head>), and writes the result to ../../index.html
// (project root).
//
// No server, no fetch(), no file:// issues — index.html stays a normal
// flat HTML file you can open directly or deploy as-is.

const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, 'index.template.html');
const SECTIONS_DIR = path.join(__dirname, 'sections');
const OUTPUT_PATH = path.join(__dirname, '..', '..', 'index.html'); // project root — required for live site

const START_MARKER = '<!-- ===SECTION-CONTENT-START=== -->';
const END_MARKER = '<!-- ===SECTION-CONTENT-END=== -->';

function extractSectionContent(fileText, filename) {
  const startIdx = fileText.indexOf(START_MARKER);
  const endIdx = fileText.indexOf(END_MARKER);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    // Fallback: no markers found, treat whole file as content (legacy/plain fragment file)
    return fileText.replace(/\n$/, '');
  }
  return fileText.slice(startIdx + START_MARKER.length, endIdx).trim();
}

function build() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('Missing index.template.html — nothing to build from.');
    process.exit(1);
  }

  let template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const includePattern = /<!--\s*include:([a-zA-Z0-9_\-]+\.html)\s*-->/g;

  let missing = [];
  const result = template.replace(includePattern, (match, filename) => {
    const filePath = path.join(SECTIONS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      missing.push(filename);
      return match; // leave the marker untouched so it's easy to spot
    }
    const fileText = fs.readFileSync(filePath, 'utf8');
    return extractSectionContent(fileText, filename);
  });

  if (missing.length) {
    console.error('Missing section file(s), build aborted:');
    missing.forEach(f => console.error('  - sections/' + f));
    process.exit(1);
  }

  fs.writeFileSync(OUTPUT_PATH, result, 'utf8');
  console.log('Built index.html from ' + (result.match(/<!--\s*include:/g) || []).length + ' remaining markers (should be 0) — done.');
}

build();

