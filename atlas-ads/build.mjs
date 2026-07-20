import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const fontURI = (p) => `data:font/woff2;base64,${readFileSync(p).toString("base64")}`;

const html = readFileSync("src/ads.html", "utf8")
  .replace("__ARCHIVO_BLACK__", fontURI("assets/archivo-black-latin.woff2"))
  .replace("__ARCHIVO__", fontURI("assets/archivo-latin.woff2"))
  .replace("__NEWSREADER_ITALIC__", fontURI("assets/newsreader-italic-latin.woff2"));

mkdirSync("dist", { recursive: true });
writeFileSync("dist/ads.html", `<!doctype html>\n<html lang="fr">\n${html}\n</html>`);
console.log("dist/ads.html prêt");
