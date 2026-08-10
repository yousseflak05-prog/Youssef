#!/usr/bin/env node
/**
 * tools/build-single-file.js
 *
 * Bundles the whole game into one self-contained .html file: the CSS, all
 * eighteen game scripts and Phaser itself are inlined in the same order
 * index.html loads them, so the result runs from a double-click, a USB stick,
 * an email attachment or any static host — with no other files beside it.
 *
 *   node tools/build-single-file.js [outfile]
 *
 * Defaults to dist/hunter-ascension.html. Nothing is minified: the point is a
 * portable build, and the source stays readable if you want to hack on the
 * single file directly.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'dist', 'hunter-ascension.html');

const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

/**
 * Inlining is only safe because no source file contains the byte sequence
 * `</script`, which would otherwise close the tag early. Verify rather than
 * assume — a future dependency could break it silently.
 */
function assertInlinable(relative, source) {
  if (/<\/script/i.test(source)) {
    throw new Error(
      `${relative} contains "</script" and cannot be inlined verbatim. ` +
        'Escape it as "<\\/script" before bundling.'
    );
  }
}

function build() {
  let html = read('index.html');
  const inlined = [];

  // 1. stylesheet -> <style>
  html = html.replace(
    /[ \t]*<link rel="stylesheet" href="([^"]+)"\s*\/?>/,
    (match, href) => {
      const css = read(href);
      inlined.push(`${href} (${(css.length / 1024).toFixed(1)} KB)`);
      return `  <style>\n${css}\n  </style>`;
    }
  );

  // 2. every <script src="..."> -> inline <script>, load order preserved
  html = html.replace(
    /[ \t]*<script src="([^"]+)"><\/script>/g,
    (match, src) => {
      const js = read(src);
      assertInlinable(src, js);
      inlined.push(`${src} (${(js.length / 1024).toFixed(1)} KB)`);
      return `  <script>\n${js}\n  </script>`;
    }
  );

  if (/<script src=|<link rel="stylesheet"/.test(html)) {
    throw new Error('Some external references were not inlined — check index.html markup.');
  }

  // A build stamp, so a stray copy can be traced back to a commit.
  html = html.replace(
    '</head>',
    `  <!-- Hunter Ascension — single-file build, ${new Date().toISOString()} -->\n</head>`
  );

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, html);

  console.log(`Inlined ${inlined.length} files:`);
  for (const entry of inlined) console.log(`  ${entry}`);
  console.log(`\nWrote ${OUT} (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
}

build();
