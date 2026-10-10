const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const SRC_APP_DIR = path.join(ROOT_DIR, 'src', 'app');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// 1. Master Brand Icon SVG (Crisp 512x512 Master Vector)
const masterSvg512 = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Midnight Slate-Navy Squircle Background Gradient -->
    <linearGradient id="cq-bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0B132B" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>

    <!-- Trust Sapphire to Cyan Arc Gradient -->
    <linearGradient id="cq-arc" x1="96" y1="396" x2="332" y2="96" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1E40AF" />
      <stop offset="35%" stop-color="#2563EB" />
      <stop offset="70%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>

    <!-- Upward Growth Dynamic Gradient (Crediqly Emerald & Mint) -->
    <linearGradient id="cq-growth" x1="230" y1="282" x2="365" y2="147" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0D9488" />
      <stop offset="50%" stop-color="#14B8A6" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>

    <!-- Apex Beacon Node Gradient -->
    <linearGradient id="cq-beacon" x1="345" y1="127" x2="385" y2="167" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="100%" stop-color="#6EE7B7" />
    </linearGradient>
  </defs>

  <!-- Deep Obsidian-Navy Squircle Container with Precision Curvature -->
  <rect width="512" height="512" rx="128" fill="url(#cq-bg)" />
  <rect x="4" y="4" width="504" height="504" rx="124" stroke="rgba(255, 255, 255, 0.14)" stroke-width="8" />

  <!-- The Foundation 'C' Arc (Business Credit Base) -->
  <path d="M 332 352 C 300 390 253 406 198 390 C 134 371 96 310 96 243 C 96 176 134 115 198 96 C 253 80 300 96 332 134" 
        stroke="url(#cq-arc)" 
        stroke-width="48" 
        stroke-linecap="round" />

  <!-- The Ascendant Capital Vector (45-degree Financial Growth Surge) -->
  <path d="M 230 282 L 365 147 M 365 147 L 269 147 M 365 147 L 365 243" 
        stroke="url(#cq-growth)" 
        stroke-width="46" 
        stroke-linecap="round" 
        stroke-linejoin="round" />

  <!-- Milestone Beacon Dot -->
  <circle cx="365" cy="147" r="23" fill="url(#cq-beacon)" />
</svg>`;

// 2. Favicon Scalable SVG (Optimized viewBox="0 0 40 40" with calibrated stroke weight for small viewports)
const faviconSvg = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cq-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0B132B" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <linearGradient id="cq-arc" x1="7.5" y1="31" x2="26" y2="7.5" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#2563EB" />
      <stop offset="50%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>
    <linearGradient id="cq-growth" x1="18" y1="22" x2="28.5" y2="11.5" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0D9488" />
      <stop offset="50%" stop-color="#14B8A6" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>
  </defs>

  <rect width="40" height="40" rx="10" fill="url(#cq-bg)" />
  <rect x="0.5" y="0.5" width="39" height="39" rx="9.5" stroke="rgba(255, 255, 255, 0.16)" stroke-width="1" />

  <!-- Foundation 'C' Arc -->
  <path d="M 26 27.5 C 23.5 30.5 19.8 31.8 15.5 30.5 C 10.5 29 7.5 24.2 7.5 19 C 7.5 13.8 10.5 9 15.5 7.5 C 19.8 6.2 23.5 7.5 26 10.5" 
        stroke="url(#cq-arc)" 
        stroke-width="3.8" 
        stroke-linecap="round" />

  <!-- Ascendant Growth Arrow -->
  <path d="M 18 22 L 28.5 11.5 M 28.5 11.5 L 21 11.5 M 28.5 11.5 L 28.5 19" 
        stroke="url(#cq-growth)" 
        stroke-width="3.6" 
        stroke-linecap="round" 
        stroke-linejoin="round" />

  <!-- Milestone Beacon Dot -->
  <circle cx="28.5" cy="11.5" r="1.8" fill="#34D399" />
</svg>`;

// Write master SVG files
const masterSvgPath = path.join(PUBLIC_DIR, 'icon.svg');
const faviconSvgPath = path.join(PUBLIC_DIR, 'favicon.svg');
const appIconSvgPath = path.join(SRC_APP_DIR, 'icon.svg');

fs.writeFileSync(masterSvgPath, masterSvg512);
fs.writeFileSync(faviconSvgPath, faviconSvg);
fs.writeFileSync(appIconSvgPath, faviconSvg);

console.log('Saved SVG assets in public/ and src/app/');

// Generate PNG variants using sips
const temp512Path = path.join(PUBLIC_DIR, 'icon-512.png');
execSync(`sips -s format png "${masterSvgPath}" --out "${temp512Path}"`, { stdio: 'inherit' });

// Create sizes: 192, 180, 48, 32, 16
const sizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 48, name: 'icon-48.png' },
  { size: 32, name: 'icon-32.png' },
  { size: 16, name: 'icon-16.png' },
];

for (const s of sizes) {
  const destPath = path.join(PUBLIC_DIR, s.name);
  execSync(`sips -z ${s.size} ${s.size} "${temp512Path}" --out "${destPath}"`, { stdio: 'ignore' });
  console.log(`Generated ${s.name} (${s.size}x${s.size})`);
}

// Copy apple-touch-icon to src/app/apple-icon.png
fs.copyFileSync(
  path.join(PUBLIC_DIR, 'apple-touch-icon.png'),
  path.join(SRC_APP_DIR, 'apple-icon.png')
);
console.log('Copied apple-icon.png to src/app/');

// Generate binary .ico file with embedded 32x32 and 16x16 PNG frames
const png32 = fs.readFileSync(path.join(PUBLIC_DIR, 'icon-32.png'));
const png16 = fs.readFileSync(path.join(PUBLIC_DIR, 'icon-16.png'));

function createIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO Type
  header.writeUInt16LE(count, 4); // Count

  let offset = 6 + count * 16;
  const dirEntries = [];
  const buffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width, 0);
    entry.writeUInt8(img.height, 1);
    entry.writeUInt8(0, 2); // Colors
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Planes
    entry.writeUInt16LE(32, 6); // BPP
    entry.writeUInt32LE(img.buffer.length, 8); // Size
    entry.writeUInt32LE(offset, 12); // Offset

    dirEntries.push(entry);
    buffers.push(img.buffer);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...buffers]);
}

const icoBuffer = createIco([
  { width: 32, height: 32, buffer: png32 },
  { width: 16, height: 16, buffer: png16 },
]);

fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), icoBuffer);
fs.writeFileSync(path.join(SRC_APP_DIR, 'favicon.ico'), icoBuffer);

console.log('Saved favicon.ico in public/ and src/app/');

// 4. Create Web App Manifest
const manifest = {
  name: 'Crediqly — Business Credit & Funding Readiness',
  short_name: 'Crediqly',
  description: 'Build business credit and prepare for commercial funding opportunities with Crediqly.',
  start_url: '/',
  display: 'standalone',
  background_color: '#0b132b',
  theme_color: '#0b132b',
  icons: [
    {
      src: '/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable',
    },
    {
      src: '/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable',
    },
    {
      src: '/icon.svg',
      sizes: 'any',
      type: 'image/svg+xml',
    },
  ],
};

fs.writeFileSync(path.join(PUBLIC_DIR, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
console.log('Saved site.webmanifest in public/');
