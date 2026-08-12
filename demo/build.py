#!/usr/bin/env python3
"""Assemble the single-file demo site.

    python3 demo/build.py

Reads  demo/src/page.html   (markup + styles, with /*@FONTS@*/ and <!--@SCRIPT@--> markers)
       demo/src/fonts.css   (base64 @font-face rules, latin + arabic subsets)
       demo/src/script.html (behaviour, content data and FR/AR/EN strings)
Writes demo/index.html      — fully self-contained, no external requests.
"""

import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / "src"


def build() -> pathlib.Path:
    page = (SRC / "page.html").read_text(encoding="utf-8")
    fonts = (SRC / "fonts.css").read_text(encoding="utf-8")
    script = (SRC / "script.html").read_text(encoding="utf-8")

    for marker in ("/*@FONTS@*/", "<!--@SCRIPT@-->"):
        if marker not in page:
            sys.exit(f"marker {marker} missing from src/page.html")

    out = page.replace("/*@FONTS@*/", fonts).replace("<!--@SCRIPT@-->", script)

    target = HERE / "index.html"
    target.write_text(out, encoding="utf-8")
    return target


if __name__ == "__main__":
    path = build()
    print(f"{path} — {path.stat().st_size / 1024:.0f} KB")
