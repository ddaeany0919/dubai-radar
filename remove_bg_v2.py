from PIL import Image, ImageDraw
import sys
import os

def remove_background():
    try:
        input_path = os.path.abspath('public/cookie-marker-real.png')
        output_path = os.path.abspath('public/cookie-marker-transparent-final.png')
        
        print(f"Opening image: {input_path}")
        img = Image.open(input_path)
        img = img.convert("RGBA")
        width, height = img.size
        print(f"Image size: {width}x{height}")

        pixels = img.load()
        
        # We will assume the background touches the corners.
        # We'll identify the "background colors" by sampling the 4 corners.
        corners = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
        bg_colors = set()
        for x, y in corners:
            bg_colors.add(pixels[x, y])
        
        print(f"Background colors found at corners: {bg_colors}")

        # Simple heuristic: If a pixel is white-ish or gray-ish, make it transparent.
        # Checkerboards are usually (255,255,255) and (204,204,204) or similar.
        
        new_data = []
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]
                
                # Check if it's a shade of gray (r~=g~=b) and light enough
                if abs(r-g) < 20 and abs(g-b) < 20 and r > 150:
                    # It's likely a background pixel (white or light gray)
                    new_data.append((0, 0, 0, 0))
                else:
                    new_data.append((r, g, b, a))
        
        img.putdata(new_data)
        img.save(output_path, "PNG")
        print(f"Saved to: {output_path}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    remove_background()
