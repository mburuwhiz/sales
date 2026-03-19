# Image Background Assets

The application uses custom background images to decorate the frontend customer and public pages with the Earth-tone greenish Glassmorphism theme.

To ensure the backgrounds load correctly, place the background images inside the `public/images/` directory at the root of Service A.

## Required Image Files

You need to provide the following background images:

*   **`public/images/wide.png`**
    *   **Usage:** Used as the background image for desktop screens and wider viewports.
    *   **Style:** Should be a high-resolution image matching the Earth-tone forest theme (deep greens, moss, rich browns).
*   **`public/images/narrow.png`**
    *   **Usage:** Used as the background image for mobile screens and narrower viewports (max-width: 768px).
    *   **Style:** Should be a vertically oriented image matching the same Earth-tone forest theme, optimized for mobile display.

## Fallback Behavior

If these images are missing from the `public/images/` directory, the application will automatically fall back to a CSS linear gradient:

```css
linear-gradient(135deg, #1a3622 0%, #0d1a10 100%)
```

This ensures the user interface remains readable and maintains its dark green/black aesthetic even if the images fail to load or have not been added yet.

## Image Processing & Products

Note: For admin product uploads, the application crops product images to a perfect square (1:1 ratio) on the frontend using Cropper.js before uploading them as Base64 data to Cloudinary. This behavior does *not* apply to the background images mentioned above, which are loaded statically from the public directory.
