import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const dataURI = (path, mime) =>
  `data:${mime};base64,${readFileSync(path).toString("base64")}`;

const html = readFileSync("src/index.html", "utf8")
  .replace("__NEWSREADER__", dataURI("assets/newsreader-roman-latin.woff2", "font/woff2"))
  .replace("__ARCHIVO__", dataURI("assets/archivo-latin.woff2", "font/woff2"))
  .replace("__EXEMPLE__", dataURI("assets/exemple-desktop.jpg", "image/jpeg"));

mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.html", html);
console.log(`dist/index.html — ${(html.length / 1024).toFixed(0)} KB`);
