import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../public/og-image.png');

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0A0A0F"/>
      <stop offset="100%" stop-color="#12121A"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#6366F1" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#6366F1" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Subtle top glow blob -->
  <ellipse cx="600" cy="0" rx="480" ry="200" fill="url(#glow)"/>

  <!-- Grid lines (subtle) -->
  <line x1="0" y1="210" x2="1200" y2="210" stroke="#1E1E2E" stroke-width="1"/>
  <line x1="0" y1="420" x2="1200" y2="420" stroke="#1E1E2E" stroke-width="1"/>
  <line x1="400" y1="0" x2="400" y2="630" stroke="#1E1E2E" stroke-width="1"/>
  <line x1="800" y1="0" x2="800" y2="630" stroke="#1E1E2E" stroke-width="1"/>

  <!-- Logo icon -->
  <rect x="130" y="200" width="72" height="72" rx="18" fill="#6366F1"/>
  <g transform="translate(148, 216)" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 3H8a2 2 0 00-2 2v28a2 2 0 002 2h20a2 2 0 002-2V11z"/>
    <polyline points="22 3 22 11 30 11"/>
    <line x1="24" y1="21" x2="12" y2="21"/>
    <line x1="24" y1="27" x2="12" y2="27"/>
    <polyline points="16 15 14 15 12 15"/>
  </g>

  <!-- App name -->
  <text x="222" y="233" font-family="Inter, -apple-system, sans-serif" font-size="52" font-weight="700" fill="#F1F1F5">PDF</text>
  <text x="330" y="233" font-family="Inter, -apple-system, sans-serif" font-size="52" font-weight="700" fill="#6366F1">Studio</text>

  <!-- Tagline -->
  <text x="130" y="306" font-family="Inter, -apple-system, sans-serif" font-size="26" font-weight="400" fill="#9CA3AF">Free Unlimited PDF Tools — No Uploads. No Limits. 100% Private.</text>

  <!-- Divider -->
  <line x1="130" y1="340" x2="1070" y2="340" stroke="#1E1E2E" stroke-width="1.5"/>

  <!-- Tool pills row 1 -->
  <g font-family="Inter, -apple-system, sans-serif" font-size="18" font-weight="500">
    <!-- Merge -->
    <rect x="130" y="365" width="120" height="38" rx="10" fill="#1A1A27"/>
    <text x="190" y="389" text-anchor="middle" fill="#9CA3AF">Merge</text>
    <!-- Split -->
    <rect x="264" y="365" width="110" height="38" rx="10" fill="#1A1A27"/>
    <text x="319" y="389" text-anchor="middle" fill="#9CA3AF">Split</text>
    <!-- Compress -->
    <rect x="388" y="365" width="140" height="38" rx="10" fill="#1A1A27"/>
    <text x="458" y="389" text-anchor="middle" fill="#9CA3AF">Compress</text>
    <!-- Protect -->
    <rect x="542" y="365" width="130" height="38" rx="10" fill="#1A1A27"/>
    <text x="607" y="389" text-anchor="middle" fill="#9CA3AF">Protect</text>
    <!-- Sign -->
    <rect x="686" y="365" width="100" height="38" rx="10" fill="#1A1A27"/>
    <text x="736" y="389" text-anchor="middle" fill="#9CA3AF">Sign</text>
    <!-- OCR -->
    <rect x="800" y="365" width="90" height="38" rx="10" fill="#1A1A27"/>
    <text x="845" y="389" text-anchor="middle" fill="#9CA3AF">OCR</text>
    <!-- Watermark -->
    <rect x="904" y="365" width="148" height="38" rx="10" fill="#1A1A27"/>
    <text x="978" y="389" text-anchor="middle" fill="#9CA3AF">Watermark</text>
  </g>

  <!-- Tool pills row 2 -->
  <g font-family="Inter, -apple-system, sans-serif" font-size="18" font-weight="500">
    <!-- Rotate -->
    <rect x="130" y="418" width="110" height="38" rx="10" fill="#1A1A27"/>
    <text x="185" y="442" text-anchor="middle" fill="#9CA3AF">Rotate</text>
    <!-- Crop -->
    <rect x="254" y="418" width="95" height="38" rx="10" fill="#1A1A27"/>
    <text x="301" y="442" text-anchor="middle" fill="#9CA3AF">Crop</text>
    <!-- Image→PDF -->
    <rect x="363" y="418" width="150" height="38" rx="10" fill="#1A1A27"/>
    <text x="438" y="442" text-anchor="middle" fill="#9CA3AF">Image→PDF</text>
    <!-- PDF→Image -->
    <rect x="527" y="418" width="150" height="38" rx="10" fill="#1A1A27"/>
    <text x="602" y="442" text-anchor="middle" fill="#9CA3AF">PDF→Image</text>
    <!-- Annotate -->
    <rect x="691" y="418" width="130" height="38" rx="10" fill="#1A1A27"/>
    <text x="756" y="442" text-anchor="middle" fill="#9CA3AF">Annotate</text>
    <!-- Repair -->
    <rect x="835" y="418" width="110" height="38" rx="10" fill="#1A1A27"/>
    <text x="890" y="442" text-anchor="middle" fill="#9CA3AF">Repair</text>
    <!-- +3 more -->
    <rect x="959" y="418" width="93" height="38" rx="10" fill="#6366F1" fill-opacity="0.15"/>
    <text x="1005" y="442" text-anchor="middle" fill="#6366F1">+3 more</text>
  </g>

  <!-- Bottom badge -->
  <rect x="130" y="494" width="220" height="40" rx="20" fill="#6366F1" fill-opacity="0.12"/>
  <text x="240" y="519" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#6366F1">✦ 100% Free &amp; Private</text>

  <rect x="368" y="494" width="210" height="40" rx="20" fill="#6366F1" fill-opacity="0.12"/>
  <text x="473" y="519" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#6366F1">✦ No File Uploads</text>

  <rect x="596" y="494" width="232" height="40" rx="20" fill="#6366F1" fill-opacity="0.12"/>
  <text x="712" y="519" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#6366F1">✦ No Registration</text>

  <rect x="846" y="494" width="224" height="40" rx="20" fill="#6366F1" fill-opacity="0.12"/>
  <text x="958" y="519" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#6366F1">✦ Unlimited Use</text>

  <!-- Border frame -->
  <rect x="1" y="1" width="1198" height="628" rx="0" fill="none" stroke="#1E1E2E" stroke-width="2"/>
</svg>
`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath);
console.log('OG image generated:', outPath);
