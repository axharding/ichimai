// Inlines the engine, catalog and UI scripts into one page.
//   index.html       – page body for a Claude artifact (the host adds <head>)
//   dist/index.html  – standalone page for any static host
const fs = require('fs');
const path = require('path');
const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');

const body = src('index.src.html')
  .replace('/*ENGINE*/', () => src('engine.js'))
  .replace('/*MODELS*/', () => src('models.js'))
  .replace('/*APP*/', () => src('app.js'));
fs.writeFileSync(path.join(__dirname, 'index.html'), body);

const title = body.match(/<title>.*?<\/title>/)[0];
const standalone = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${title}
<style>body{margin:0}[hidden]{display:none!important}</style>
</head>
<body>
${body.replace(title, '')}
</body>
</html>
`;
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), standalone);

// optional: preview copy for local screenshots
if (process.argv[2]) fs.writeFileSync(process.argv[2], standalone);
