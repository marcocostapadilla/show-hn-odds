# Builds og.png from tools/stats.json (output of tools/stats.py). Run: python3 tools/stats.py > tools/stats.json && python3 tools/make_og.py
import json, os
from PIL import Image, ImageDraw, ImageFont
here = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(here, "stats.json")))
F = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"; FB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
f = lambda s, b=False: ImageFont.truetype(FB if b else F, s)
W, H = 1200, 630; OR = (255, 102, 0); BG = (246, 246, 239); FG = (34, 34, 34); MU = (110, 110, 110)
im = Image.new("RGB", (W, H), BG); g = ImageDraw.Draw(im)
g.rectangle([0, 0, W, 14], fill=OR)
g.rectangle([60, 62, 96, 98], fill=OR)
g.text((112, 52), "Show HN odds", font=f(54, True), fill=FG)
g.text((60, 122), "How Show HN launches on Hacker News actually score", font=f(28), fill=MU)
med = d["median"]; med = int(med) if med == int(med) else med
cards = [(str(med), "median points"), ("%.1f%%" % d["p10"], "reach 10+"), ("%.1f%%" % d["p50"], "reach 50+"), ("%.1f%%" % d["p100"], "reach 100+")]
cw, gap, x0, y0 = 255, 20, 60, 190
for i, (v, l) in enumerate(cards):
    x = x0 + i * (cw + gap)
    g.rounded_rectangle([x, y0, x + cw, y0 + 170], 10, fill=(255, 255, 255), outline=(221, 221, 221), width=2)
    tw = g.textlength(v, font=f(64, True)); g.text((x + (cw - tw) / 2, y0 + 25), v, font=f(64, True), fill=OR)
    tw = g.textlength(l, font=f(26)); g.text((x + (cw - tw) / 2, y0 + 115), l, font=f(26), fill=MU)
# mini histogram
hist = d["hist"]; mx = max(c for _, _, c in hist); bx, by, bh = 60, 400, 110; bw = (W - 120) / len(hist)
for i, (a, b, c) in enumerate(hist):
    h = bh * c / mx; x = bx + i * bw
    g.rectangle([x + 6, by + bh - h, x + bw - 6, by + bh], fill=OR if a >= 10 else (190, 190, 190))
    lab = "%d+" % a if b > 100000 else (str(a) if a == b else "%d-%d" % (a, b))
    tw = g.textlength(lab, font=f(18)); g.text((x + (bw - tw) / 2, by + bh + 6), lab, font=f(18), fill=MU)
note = "%d posts, %s to %s. Snapshot %s UTC." % (
    d["n"], d["oldest"][:10], d["newest"][:10], d["fetched_utc"][:16].replace("T", " "))
g.text((60, 570), note, font=f(21), fill=FG)
im.save(os.path.join(here, "..", "og.png"), optimize=True)
print("ok")
