import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const dataURI = (path, mime) =>
  `data:${mime};base64,${readFileSync(path).toString("base64")}`;

// Le site livré est intégré tel quel : il s'ouvre depuis l'offre,
// sans dépendre d'un nom de domaine configuré.
const siteExemple = readFileSync("assets/site-exemple.html", "utf8");

const body = readFileSync("src/index.html", "utf8")
  .replace("__SITE_EXEMPLE__", () => siteExemple)
  .replace("__NEWSREADER_ROMAN__", dataURI("assets/newsreader-roman-latin.woff2", "font/woff2"))
  .replace("__NEWSREADER_ITALIC__", dataURI("assets/newsreader-italic-latin.woff2", "font/woff2"))
  .replace("__ARCHIVO__", dataURI("assets/archivo-latin.woff2", "font/woff2"))
  .replace("__EXEMPLE_DESKTOP__", dataURI("assets/exemple-desktop.jpg", "image/jpeg"))
  .replace("__EXEMPLE_MOBILE__", dataURI("assets/exemple-mobile.jpg", "image/jpeg"));

mkdirSync("dist", { recursive: true });
writeFileSync("dist/artifact.html", body);
writeFileSync(
  "dist/index.html",
  `<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${body}\n</html>`
);
console.log(`dist/index.html — ${(body.length / 1024).toFixed(0)} KB`);
