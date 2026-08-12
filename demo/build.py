#!/usr/bin/env python3
"""Assemble the single-file demo site.

    python3 demo/build.py

Reads  demo/src/page.html   (markup + styles, with /*@FONTS@*/ and <!--@SCRIPT@--> markers)
       demo/src/fonts.css   (base64 @font-face rules, latin + arabic subsets)
       demo/src/script.html (behaviour, content data and FR/AR/EN strings)

Writes two builds, both fully self-contained (no external requests):
  demo/index.html            — body fragment, for hosts that supply <head> themselves
  demo/clinique-nacre.html   — complete document, for any ordinary web host
"""

import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "src"

FAVICON = (
    "data:image/svg+xml,"
    "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E"
    "%3Crect width='40' height='40' fill='%230C2B2A'/%3E"
    "%3Cpath d='M20 8c5 0 8.5 3.4 8.5 8.2 0 4.1-1.3 7.6-2.6 11.4-1 2.9-1.6 6.6-3.4 6.6"
    "-1.4 0-1.4-3.4-2.5-3.4s-1.1 3.4-2.5 3.4c-1.8 0-2.4-3.7-3.4-6.6-1.3-3.8-2.6-7.3-2.6-11.4"
    "C11.5 11.4 15 8 20 8Z' fill='%23F3F5F3'/%3E"
    "%3Ccircle cx='27.4' cy='13.9' r='2.6' fill='%23A9762F'/%3E%3C/svg%3E"
)

SHELL = """<!doctype html>
<html lang="fr" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Clinique dentaire à Casablanca-Anfa : implantologie, aligneurs invisibles, esthétique dentaire et urgences. Devis chiffré avant tout soin, prise de rendez-vous en ligne.">
<meta name="theme-color" content="#0C2B2A">
<meta property="og:type" content="website">
<meta property="og:title" content="Clinique Nacre — Cabinet dentaire à Casablanca">
<meta property="og:description" content="Le soin dentaire, sans appréhension. Diagnostic 3D, devis chiffré, rendez-vous en ligne.">
<meta property="og:locale" content="fr_MA">
<link rel="icon" href="{favicon}">
<style>*,*::before,*::after{{box-sizing:border-box}}body{{margin:0}}</style>
{head}
</head>
<body>
{body}
</body>
</html>
"""


def build() -> pathlib.Path:
    page = (SRC / "page.html").read_text(encoding="utf-8")
    fonts = (SRC / "fonts.css").read_text(encoding="utf-8")
    script = (SRC / "script.html").read_text(encoding="utf-8")

    for marker in ("/*@FONTS@*/", "<!--@SCRIPT@-->"):
        if marker not in page:
            sys.exit(f"marker {marker} missing from src/page.html")

    out = page.replace("/*@FONTS@*/", fonts).replace("<!--@SCRIPT@-->", script)

    fragment = HERE / "index.html"
    fragment.write_text(out, encoding="utf-8")

    # Complete document: <title> and <style> move into a real <head>.
    split = out.index("</style>") + len("</style>")
    standalone = HERE / "clinique-nacre.html"
    standalone.write_text(
        SHELL.format(favicon=FAVICON, head=out[:split].strip(), body=out[split:].strip()),
        encoding="utf-8",
    )
    return fragment, standalone


if __name__ == "__main__":
    for path in build():
        print(f"{path} — {path.stat().st_size / 1024:.0f} KB")
