#!/usr/bin/env python3
"""Session-7 composites: reference (left) vs clone (right), stacked labels."""
import sys
from PIL import Image, ImageDraw

PAIRS = [
    ("01-login", "Login"),
    ("02-dashboard", "Dashboard"),
    ("03-submit-ticket", "Submit Ticket"),
    ("04-my-tickets", "My Tickets"),
    ("05-ticket-detail", "Ticket Detail"),
    ("06-mobile-dashboard", "Mobile Dashboard"),
    ("07-mobile-menu-open", "Mobile Menu"),
]

REF = "/tmp/s7-ref-shots"
CLONE = "docs/screenshots"
OUT = "docs/compare-s7"

import os
os.makedirs(OUT, exist_ok=True)

for name, label in PAIRS:
    ref = Image.open(f"{REF}/{name}.png")
    clo = Image.open(f"{CLONE}/{name}.png")
    h = min(ref.height, clo.height)
    ref = ref.crop((0, 0, ref.width, h))
    clo = clo.crop((0, 0, clo.width, h))
    gap = 12
    canvas = Image.new("RGB", (ref.width + clo.width + gap, h + 36), (24, 24, 24))
    canvas.paste(ref, (0, 36))
    canvas.paste(clo, (ref.width + gap, 36))
    d = ImageDraw.Draw(canvas)
    d.text((10, 8), f"REFERENCE - {label}", fill=(255, 255, 255))
    d.text((ref.width + gap + 10, 8), f"CLONE - {label}", fill=(255, 255, 255))
    canvas.save(f"{OUT}/{name}.png")
    print(f"composite: {name} ({canvas.width}x{canvas.height})")
