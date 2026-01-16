
from PIL import Image
import os

def split_cookies():
    img_path = 'public/image_example.png'
    if not os.path.exists(img_path):
        print(f"Error: {img_path} not found")
        return

    img = Image.open(img_path)
    width, height = img.size
    
    # Assuming 2x2 grid
    w_half = width // 2
    h_half = height // 2
    
    # (left, top, right, bottom)
    coords = {
        'cookie-marker-happy.png': (0, 0, w_half, h_half),
        'cookie-marker-normal.png': (w_half, 0, width, h_half),
        'cookie-marker-worried.png': (0, h_half, w_half, height),
        'cookie-marker-sad.png': (w_half, h_half, width, height)
    }
    
    for filename, box in coords.items():
        cropped = img.crop(box).convert("RGBA")
        
        # Background removal logic
        # The checkered background is usually light gray and white
        datas = cropped.getdata()
        new_data = []
        for item in datas:
            # If the pixel is very light (white/gray checkered pattern), make it transparent
            # Checkered colors are typically around (200-255, 200-255, 200-255)
            if item[0] > 180 and item[1] > 180 and item[2] > 180:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        
        cropped.putdata(new_data)
        
        # Resize and save
        cropped = cropped.resize((256, 256), Image.Resampling.LANCZOS)
        cropped.save(f'public/{filename}')
        print(f"Saved public/{filename} (Transparent)")

if __name__ == "__main__":
    split_cookies()
