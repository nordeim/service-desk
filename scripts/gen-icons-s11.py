#!/usr/bin/env python3
"""Session 11 (G2/G3): generate the PWA icon set from the app logo.

The reference's manifest declares 192x192 + 512x512 icons against ONE
480x480 JPEG (byte-identical to our src/app/icon.png, fetched from them in
session 2). We ship honest metadata instead: real size-correct PNGs from
the same source — public/icon-192.png + public/icon-512.png for the
manifest, and src/app/apple-icon.png (180x180, Apple's touch-icon size)
which makes Next emit the apple-touch-icon link (the icon.png favicon
mechanism, session 7).

Idempotent: re-running overwrites the outputs with identical bytes.
"""
from PIL import Image

SRC = "/home/z/my-project/service-desk/src/app/icon.png"
OUTS = [
    ("/home/z/my-project/service-desk/public/icon-192.png", 192),
    ("/home/z/my-project/service-desk/public/icon-512.png", 512),
    ("/home/z/my-project/service-desk/src/app/apple-icon.png", 180),
]

src = Image.open(SRC).convert("RGB")
for out, size in OUTS:
    img = src.resize((size, size), Image.LANCZOS)
    img.save(out, "PNG", optimize=True)
    print(f"wrote {out} ({size}x{size})")
