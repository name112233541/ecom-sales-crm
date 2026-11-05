from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path('installer')
OUT.mkdir(exist_ok=True)


def font(size):
    for name in ['arialbd.ttf', 'segoeuib.ttf', 'C:/Windows/Fonts/arialbd.ttf']:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            pass
    return ImageFont.load_default()


def make_icon(path, letter, color):
    size = 256
    img = Image.new('RGBA', (size, size), (17, 24, 39, 255))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([20, 20, 236, 236], radius=56, fill=color)
    f = font(150)
    bbox = draw.textbbox((0, 0), letter, font=f)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    draw.text(((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1] - 4), letter, font=f, fill='white')
    img.save(path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])


make_icon(OUT / 'crm.ico', 'E', (255, 107, 74, 255))
make_icon(OUT / 'team.ico', 'A', (15, 157, 138, 255))
print('icons generated')
