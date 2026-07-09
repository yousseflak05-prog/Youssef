import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const js = await build({
  entryPoints: ["src/app.jsx"],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  target: "es2019",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
});

const fontURI = (path) =>
  `data:font/woff2;base64,${readFileSync(path).toString("base64")}`;

const css = readFileSync("src/styles.css", "utf8")
  .replace("__MARCELLUS__", fontURI("assets/marcellus-latin.woff2"))
  .replace("__ARCHIVO__", fontURI("assets/archivo-latin.woff2"));

const html = `<title>Atlas — Portail Client</title>
<style>
${css}
</style>
<div id="root"></div>
<script>
${js.outputFiles[0].text}
</script>
`;

mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.html", html);
console.log(`dist/index.html — ${(html.length / 1024).toFixed(0)} KB`);
