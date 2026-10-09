# Contact sheet of a frame folder: python3 tools/video/sheet.py <dir> <out.jpg> [cols] [fps]
import sys, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
fps = float(sys.argv[4]) if len(sys.argv) > 4 else 24
fs = sorted(f for f in os.listdir(d) if f.endswith('.jpg'))
ims = [Image.open(os.path.join(d, f)) for f in fs]
w, h = ims[0].size
s = 320 / w
tw, th = int(w * s), int(h * s)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * th), (0, 0, 0))
dr = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(fs, ims)):
    x, y = (i % cols) * tw, (i // cols) * th
    sheet.paste(im.resize((tw, th)), (x, y))
    dr.text((x + 4, y + 4), '%.2fs' % (int(f[1:6]) / fps), fill=(255, 255, 0))
sheet.save(out, quality=85)
print(out, len(ims))
