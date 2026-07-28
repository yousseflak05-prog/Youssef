import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const dataURI = (path, mime) =>
  `data:${mime};base64,${readFileSync(path).toString("base64")}`;

// Lien vers la réalisation montrée en exemple.
const LIEN_SITE = "https://jhsudtravaux.com";

const body = readFileSync("src/index.html", "utf8")
  .replaceAll("__LIEN_SITE__", LIEN_SITE)
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
