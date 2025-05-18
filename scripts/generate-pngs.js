const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Define icon sizes
const ICON_SIZES = [16, 48, 128];

// SVG icon content
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4285F4" />
      <stop offset="100%" stop-color="#34A853" />
    </linearGradient>
  </defs>
  <rect x="10" y="10" width="108" height="108" rx="20" ry="20" fill="url(#gradient)" />
  <path d="M30 40 L50 40 L50 88 L30 88 Z" fill="white" />
  <path d="M60 40 L98 40 L98 52 L60 52 Z" fill="white" />
  <path d="M60 58 L88 58 L88 70 L60 70 Z" fill="white" />
  <path d="M60 76 L78 76 L78 88 L60 88 Z" fill="white" />
</svg>
`;

// Ensure assets directory exists
const assetsDir = path.join(__dirname, '..', 'extension', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Save SVG file
const svgPath = path.join(assetsDir, 'icon.svg');
fs.writeFileSync(svgPath, svgIcon);
console.log(`SVG icon saved to ${svgPath}`);

// Generate PNG files for each size
async function generatePNGs() {
  try {
    for (const size of ICON_SIZES) {
      const pngPath = path.join(assetsDir, `icon${size}.png`);
      
      await sharp(Buffer.from(svgIcon))
        .resize(size, size)
        .png()
        .toFile(pngPath);
      
      console.log(`PNG icon (${size}x${size}) saved to ${pngPath}`);
    }
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

// Run the generation
generatePNGs();
