from pathlib import Path
from PIL import Image, ImageDraw

files = sorted(Path("tmp/pdfs/rendered").glob("lesson-plan-guide-*.png"))
thumb = (238, 337)
cols = 3
chunk = 7

for start in range(0, len(files), chunk):
    group = files[start:start + chunk]
    rows = (len(group) + cols - 1) // cols
    sheet = Image.new("RGB", (794, 35 + rows * 377), "white")
    draw = ImageDraw.Draw(sheet)
    for offset, filename in enumerate(group):
        x = 20 + (offset % cols) * 258
        y = 35 + (offset // cols) * 377
        image = Image.open(filename).convert("RGB")
        image.thumbnail(thumb)
        sheet.paste(image, (x, y))
        draw.text((x, y - 22), f"Page {start + offset + 1}", fill="black")
    sheet.save(f"tmp/pdfs/contact-{start // chunk + 1}.png")
