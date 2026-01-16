from PIL import Image
import sys

try:
    img = Image.open('public/cookie-marker-real.png')
    img = img.convert("RGBA")
    datas = img.getdata()
    
    # Get top-left pixel color
    bg_color = img.getpixel((0, 0))
    print(f"Top-left pixel color: {bg_color}")
    
    newData = []
    tolerance = 50 # Tolerance for background color matching

    for item in datas:
        # Check if the pixel is close to the background color (checkerboard white/gray)
        # This is a simple distance check
        if (abs(item[0] - bg_color[0]) < tolerance and 
            abs(item[1] - bg_color[1]) < tolerance and 
            abs(item[2] - bg_color[2]) < tolerance):
            newData.append((255, 255, 255, 0)) # Transparent
        else:
            newData.append(item)

    img.putdata(newData)
    img.save("public/cookie-marker-transparent-final.png", "PNG")
    print("Successfully saved transparent image.")

except Exception as e:
    print(f"Error: {e}")
