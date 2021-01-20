const { join, resolve } = require('path');
const { copy, remove } = require('fs-extra');
const { build } = require('./build');
const chromeLaunch = require('chrome-launch');
const webExt = require('web-ext');

const isFirefox = process.env.BROWSER_ENV == 'firefox';

async function main() {
  let dest;
  if (isFirefox) {
    dest = resolve('dist/firefox-extension');
  } else {
    dest = resolve('dist/chrome-extension');
  }
  await remove(dest);

  const parcel = await build({
    entries: [
      'devtools/src/devtools/pane.{html,js}',
      'devtools/src/devtools/panel.{html,js}',
      'devtools/src/devtools/main.{html,js}',
      'devtools/src/content-script/contentScript.js',
      'devtools/src/background/background.js',
      'devtools/src/window/testing-library.js',
    ],
    dest,
  });

  await copy('devtools/src/manifest.json', join(dest, 'manifest.json'));

  // copy icons that are declared in manifest.json#icons from /public dir
  const manifest = require(join(dest, 'manifest.json'));

  await Promise.all(
    Object.values(manifest.icons).map((icon) =>
      copy(icon.replace(/^icons/, 'public'), join(dest, icon)),
    ),
  );

  if (parcel.watching) {
    if (isFirefox) {
      webExt.cmd.run({
        sourceDir: dest,
      });
    } else {
      chromeLaunch('https://google.com', {
        args: [`--load-extension=${dest}`, '--auto-open-devtools-for-tabs'],
      });
    }
  }
}

main();
