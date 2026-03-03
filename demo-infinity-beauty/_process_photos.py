"""Process screenshots: crop UI elements, resize for web, optimize quality"""
from PIL import Image, ImageFilter, ImageEnhance
from pathlib import Path

img_dir = Path(__file__).resolve().parent / "img"

def process(filename, crop_box=None, target_size=(800, 800), quality=88):
    """Crop, resize and save as optimized JPEG"""
    path = img_dir / filename
    if not path.exists():
        print(f"  SKIP {filename}")
        return

    img = Image.open(path).convert("RGB")
    w, h = img.size
    print(f"  {filename}: {w}x{h}", end="")

    # Crop if specified (left, top, right, bottom as fractions 0-1)
    if crop_box:
        l, t, r, b = crop_box
        img = img.crop((int(w*l), int(h*t), int(w*r), int(h*b)))
        print(f" -> crop {img.size[0]}x{img.size[1]}", end="")

    # Resize maintaining aspect ratio
    img.thumbnail(target_size, Image.LANCZOS)

    # Slight sharpening
    img = ImageEnhance.Sharpness(img).enhance(1.15)

    # Save as JPEG
    out = path.with_suffix('.jpg')
    img.save(out, "JPEG", quality=quality, optimize=True)
    print(f" -> saved {out.name} ({out.stat().st_size // 1024}KB)")

print("Processing photos...")

# Storefront - Google Maps photos (crop watermarks at bottom)
process("storefront.png", crop_box=(0, 0, 1, 0.95), target_size=(900, 600))
process("storefront2.png", crop_box=(0, 0, 1, 0.95), target_size=(1400, 900))
process("storefront3.png", crop_box=(0, 0, 1, 0.95), target_size=(900, 600))

# Interior - crop Google Maps watermark
process("interior.png", crop_box=(0, 0, 1, 0.94), target_size=(900, 700))

# Nails - crop navigation arrows and watermark
process("nails-nude.png", crop_box=(0.05, 0.05, 0.95, 0.92), target_size=(700, 700))
process("nails-blue.png", crop_box=(0.02, 0.02, 0.98, 0.95), target_size=(700, 700))

# Brows before/after - crop UI
process("brows.png", crop_box=(0.02, 0.02, 0.95, 0.95), target_size=(700, 700))

# Lashes - crop edges
process("lashes.png", crop_box=(0, 0.03, 1, 0.95), target_size=(700, 700))

# Pedicure - crop Instagram watermark/timer
process("pedicure.png", crop_box=(0, 0.02, 1, 0.92), target_size=(700, 700))
process("pedicure-blue.png", crop_box=(0, 0, 1, 0.95), target_size=(700, 700))

# Hair keratin - crop watermark
process("hair-keratin.png", crop_box=(0, 0.02, 1, 0.95), target_size=(700, 900))

# Sugaring promo - crop timer
process("sugaring.png", crop_box=(0, 0, 0.95, 0.94), target_size=(700, 700))

# Products
process("products.png", crop_box=(0.02, 0.02, 0.98, 0.92), target_size=(700, 700))

print("\nDone! Cleaning up PNGs...")
# Remove original PNGs (keep only JPGs for web)
for f in img_dir.glob("*.png"):
    # Keep price screenshots and instagram screenshots as-is
    if "price" in f.name or "instagram" in f.name:
        continue
    f.unlink()
    print(f"  Deleted {f.name}")

print("\nFinal files:")
for f in sorted(img_dir.iterdir()):
    print(f"  {f.name} ({f.stat().st_size // 1024}KB)")
