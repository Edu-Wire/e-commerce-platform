import sharp from 'sharp';

// ─── Product category signals ─────────────────────────────────────────────────

interface CategorySignal {
  keywords: string[];
  // pixel analysis hints
  likelyAspectRatios?: Array<'portrait' | 'landscape' | 'square'>;
  likelyDarkBorder?: boolean;   // devices have dark bezels
  likelyBrightCenter?: boolean; // screens show bright content in center
}

const CATEGORY_SIGNALS: CategorySignal[] = [
  {
    keywords: ['mobile', 'phone', 'smartphone'],
    likelyAspectRatios: ['portrait'],
    likelyDarkBorder: true,
    likelyBrightCenter: true,
  },
  {
    keywords: ['tv', 'television', 'screen'],
    likelyAspectRatios: ['landscape'],
    likelyDarkBorder: true,
    likelyBrightCenter: true,
  },
  {
    keywords: ['laptop', 'notebook', 'computer'],
    likelyAspectRatios: ['landscape', 'square'],
    likelyDarkBorder: true,
    likelyBrightCenter: true,
  },
  {
    keywords: ['watch', 'smartwatch'],
    likelyAspectRatios: ['square', 'portrait'],
    likelyDarkBorder: true,
    likelyBrightCenter: false,
  },
  {
    keywords: ['shoes', 'sneakers', 'footwear'],
    likelyAspectRatios: ['landscape', 'square'],
    likelyDarkBorder: false,
    likelyBrightCenter: false,
  },
  {
    keywords: ['t-shirt', 'shirt', 'clothing'],
    likelyAspectRatios: ['portrait', 'square'],
    likelyDarkBorder: false,
    likelyBrightCenter: false,
  },
  {
    keywords: ['headphones', 'earphones', 'audio'],
    likelyAspectRatios: ['portrait', 'square'],
    likelyDarkBorder: false,
    likelyBrightCenter: false,
  },
  {
    keywords: ['bag', 'backpack', 'handbag'],
    likelyAspectRatios: ['portrait', 'square'],
    likelyDarkBorder: false,
    likelyBrightCenter: false,
  },
];

// Filename keyword → product keywords map
const FILENAME_MAP: Record<string, string[]> = {
  mobile: ['mobile', 'phone', 'smartphone'],
  phone: ['mobile', 'phone', 'smartphone'],
  iphone: ['mobile', 'iphone', 'phone', 'apple', 'smartphone'],
  samsung: ['mobile', 'samsung', 'phone', 'smartphone'],
  oneplus: ['mobile', 'oneplus', 'phone'],
  pixel: ['mobile', 'google', 'phone'],
  redmi: ['mobile', 'redmi', 'phone', 'xiaomi'],
  realme: ['mobile', 'realme', 'phone'],
  oppo: ['mobile', 'oppo', 'phone'],
  vivo: ['mobile', 'vivo', 'phone'],
  laptop: ['laptop', 'notebook', 'computer'],
  macbook: ['laptop', 'macbook', 'apple'],
  lenovo: ['laptop', 'lenovo'],
  dell: ['laptop', 'dell'],
  hp: ['laptop', 'hp'],
  tv: ['tv', 'television'],
  television: ['tv', 'television'],
  headphone: ['headphones', 'earphones', 'audio'],
  earphone: ['headphones', 'earphones', 'audio'],
  airpod: ['earphones', 'apple', 'audio', 'headphones'],
  shoe: ['shoes', 'footwear', 'sneakers'],
  sneaker: ['shoes', 'sneakers', 'footwear'],
  tshirt: ['t-shirt', 'clothing', 'shirt'],
  shirt: ['shirt', 'clothing'],
  jeans: ['jeans', 'denim', 'pants'],
  dress: ['dress', 'clothing', 'ethnic'],
  kurti: ['kurti', 'clothing', 'ethnic'],
  watch: ['watch', 'smartwatch'],
  camera: ['camera', 'dslr'],
  bag: ['bag', 'backpack'],
  sunglasses: ['sunglasses', 'eyewear'],
};

// Color palette groups
const COLOR_HINTS: Array<{ name: string; check: (r: number, g: number, b: number) => boolean }> = [
  { name: 'black', check: (r, g, b) => r < 50 && g < 50 && b < 50 },
  { name: 'white', check: (r, g, b) => r > 200 && g > 200 && b > 200 },
  { name: 'silver', check: (r, g, b) => Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && r > 100 && r < 200 },
  { name: 'blue', check: (r, g, b) => b > r + 30 && b > g + 20 },
  { name: 'red', check: (r, g, b) => r > g + 40 && r > b + 40 },
  { name: 'green', check: (r, g, b) => g > r + 30 && g > b + 30 },
  { name: 'yellow', check: (r, g, b) => r > 180 && g > 180 && b < 100 },
  { name: 'gold', check: (r, g, b) => r > 180 && g > 140 && b < 80 },
];

// ─── Main export ──────────────────────────────────────────────────────────────

export async function analyzeImage(buffer: Buffer, filename: string): Promise<string[]> {
  const keywords: string[] = [];

  // ── 1. Filename keywords (high confidence) ────────────────────────────────
  const nameLower = filename.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [hint, kws] of Object.entries(FILENAME_MAP)) {
    if (nameLower.includes(hint)) {
      keywords.push(...kws);
    }
  }

  // ── 2. Visual pixel analysis via sharp ───────────────────────────────────
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const { width = 1, height = 1 } = metadata;

    const ratio = width / height;

    // ── 2a. Aspect ratio classification ──────────────────────────────────
    let aspectClass: 'portrait' | 'landscape' | 'square';
    if (ratio < 0.75) {
      aspectClass = 'portrait';  // tall → phone, clothing, bag
    } else if (ratio > 1.4) {
      aspectClass = 'landscape'; // wide → TV, laptop, shoes
    } else {
      aspectClass = 'square';
    }

    // ── 2b. Sample a 16×16 downscaled version for color analysis ─────────
    const sampleW = 16;
    const sampleH = 16;
    const { data: pixels } = await image
      .resize(sampleW, sampleH, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channelCount = pixels.length / (sampleW * sampleH); // 3 or 4

    // ── 2c. Calculate corner darkness (bezel detection) ───────────────────
    const cornerPixelIndices = [
      0,                                         // top-left
      (sampleW - 1) * channelCount,             // top-right
      (sampleH - 1) * sampleW * channelCount,   // bottom-left
      ((sampleH - 1) * sampleW + sampleW - 1) * channelCount, // bottom-right
    ];

    let cornerDarknessSum = 0;
    for (const idx of cornerPixelIndices) {
      const r = pixels[idx] ?? 0;
      const g = pixels[idx + 1] ?? 0;
      const b = pixels[idx + 2] ?? 0;
      cornerDarknessSum += (r + g + b) / 3;
    }
    const avgCornerBrightness = cornerDarknessSum / 4;
    const hasDarkCorners = avgCornerBrightness < 80; // dark corners → device bezel likely

    // ── 2d. Center brightness ─────────────────────────────────────────────
    const centerIdx = (Math.floor(sampleH / 2) * sampleW + Math.floor(sampleW / 2)) * channelCount;
    const cr = pixels[centerIdx] ?? 0;
    const cg = pixels[centerIdx + 1] ?? 0;
    const cb = pixels[centerIdx + 2] ?? 0;
    const centerBrightness = (cr + cg + cb) / 3;
    const hasBrightCenter = centerBrightness > 140;

    // ── 2e. Dominant color across full image ─────────────────────────────
    const colorCounts: Record<string, number> = {};
    for (let i = 0; i < pixels.length; i += channelCount) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      for (const colorHint of COLOR_HINTS) {
        if (colorHint.check(r, g, b)) {
          colorCounts[colorHint.name] = (colorCounts[colorHint.name] || 0) + 1;
          break;
        }
      }
    }
    const dominantColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'white';
    keywords.push(dominantColor);

    // ── 2f. Score each product category ──────────────────────────────────
    if (keywords.length === 0 || (keywords.length === 1 && COLOR_HINTS.some(c => c.name === keywords[0]))) {
      // No filename keywords → use visual signals to infer category
      interface Score { signal: CategorySignal; score: number }
      const scores: Score[] = CATEGORY_SIGNALS.map(signal => {
        let score = 0;

        // Aspect ratio match
        if (signal.likelyAspectRatios?.includes(aspectClass)) score += 3;

        // Dark border match (device screen)
        if (signal.likelyDarkBorder && hasDarkCorners) score += 4;
        if (signal.likelyDarkBorder === false && !hasDarkCorners) score += 2;

        // Bright center match (screen content)
        if (signal.likelyBrightCenter && hasBrightCenter) score += 3;
        if (signal.likelyBrightCenter === false && !hasBrightCenter) score += 1;

        return { signal, score };
      });

      scores.sort((a, b) => b.score - a.score);
      const best = scores[0];

      // Only use visual signal if it has meaningful confidence
      if (best && best.score >= 5) {
        console.log(`[VisualSearch] Visual analysis → category: "${best.signal.keywords[0]}", score: ${best.score}, aspect: ${aspectClass}, darkCorners: ${hasDarkCorners}, brightCenter: ${hasBrightCenter}`);
        keywords.push(...best.signal.keywords);
      } else {
        // Low confidence: push generic signals based on aspect + color
        console.log(`[VisualSearch] Low confidence (${best?.score ?? 0}). Aspect: ${aspectClass}, dominant color: ${dominantColor}`);
        if (aspectClass === 'portrait' && hasDarkCorners) {
          keywords.push('mobile', 'phone', 'smartphone');
        } else if (aspectClass === 'landscape' && hasDarkCorners) {
          keywords.push('tv', 'television', 'laptop');
        } else if (aspectClass === 'portrait') {
          keywords.push('clothing', 'shoes', 'bag');
        }
      }
    } else {
      console.log(`[VisualSearch] Filename match found: ${keywords.join(', ')}`);
    }

  } catch (err) {
    console.error('[VisualSearch] Sharp analysis error:', err);
  }

  return Array.from(new Set(keywords)).filter(Boolean);
}
