import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const fontURI = (path) =>
  `data:font/woff2;base64,${readFileSync(path).toString("base64")}`;

const body = readFileSync("src/index.html", "utf8")
  .replace("__NEWSREADER_ROMAN__", fontURI("assets/newsreader-roman-latin.woff2"))
  .replace("__NEWSREADER_ITALIC__", fontURI("assets/newsreader-italic-latin.woff2"))
  .replace("__ARCHIVO__", fontURI("assets/archivo-latin.woff2"));

mkdirSync("dist", { recursive: true });

// Version artifact : contenu seul (le publieur ajoute doctype/head/body)
writeFileSync("dist/artifact.html", body);

// Version autonome : page complète ouvrable directement dans un navigateur
const standalone = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${body}
</html>`;
writeFileSync("dist/index.html", standalone);

console.log(`dist/index.html — ${(standalone.length / 1024).toFixed(0)} KB`);
