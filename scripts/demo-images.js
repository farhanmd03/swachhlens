/**
 * SwachhLens — Demo Waste Image Generator
 *
 * Generates 8 distinct, realistic 400x300 pixel JPEG images as raw Base64
 * strings for each waste category.
 *
 * Pure JavaScript using `jpeg-js` with no external network dependencies.
 */

import jpeg from 'jpeg-js';

const WIDTH = 400;
const HEIGHT = 300;

class Canvas {
  constructor(w = WIDTH, h = HEIGHT) {
    this.width = w;
    this.height = h;
    this.buffer = Buffer.alloc(w * h * 4, 255); // RGBA
  }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (Math.floor(y) * this.width + Math.floor(x)) * 4;
    if (a >= 255) {
      this.buffer[idx] = r;
      this.buffer[idx + 1] = g;
      this.buffer[idx + 2] = b;
      this.buffer[idx + 3] = 255;
    } else {
      const alpha = a / 255;
      const invAlpha = 1 - alpha;
      this.buffer[idx] = Math.round(r * alpha + this.buffer[idx] * invAlpha);
      this.buffer[idx + 1] = Math.round(g * alpha + this.buffer[idx + 1] * invAlpha);
      this.buffer[idx + 2] = Math.round(b * alpha + this.buffer[idx + 2] * invAlpha);
      this.buffer[idx + 3] = 255;
    }
  }

  fillRect(x0, y0, w, h, r, g, b, a = 255) {
    const xEnd = Math.min(this.width, x0 + w);
    const yEnd = Math.min(this.height, y0 + h);
    for (let y = Math.max(0, y0); y < yEnd; y++) {
      for (let x = Math.max(0, x0); x < xEnd; x++) {
        this.setPixel(x, y, r, g, b, a);
      }
    }
  }

  fillCircle(cx, cy, radius, r, g, b, a = 255) {
    const r2 = radius * radius;
    const xStart = Math.max(0, Math.floor(cx - radius));
    const xEnd = Math.min(this.width, Math.ceil(cx + radius));
    const yStart = Math.max(0, Math.floor(cy - radius));
    const yEnd = Math.min(this.height, Math.ceil(cy + radius));

    for (let y = yStart; y < yEnd; y++) {
      for (let x = xStart; x < xEnd; x++) {
        const dist2 = (x - cx) ** 2 + (y - cy) ** 2;
        if (dist2 <= r2) {
          this.setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  fillGradientV(y0, y1, c0, c1) {
    for (let y = y0; y < y1; y++) {
      const t = (y - y0) / (y1 - y0);
      const r = Math.round(c0[0] * (1 - t) + c1[0] * t);
      const g = Math.round(c0[1] * (1 - t) + c1[1] * t);
      const b = Math.round(c0[2] * (1 - t) + c1[2] * t);
      for (let x = 0; x < this.width; x++) {
        this.setPixel(x, y, r, g, b);
      }
    }
  }

  toJpegBase64(quality = 85) {
    const rawData = {
      data: this.buffer,
      width: this.width,
      height: this.height,
    };
    const encoded = jpeg.encode(rawData, quality);
    return Buffer.from(encoded.data).toString('base64');
  }
}

// ── 1. Overflowing Bin ──────────────────────────────────────────
export function generateOverflowingBinImage() {
  const c = new Canvas();
  // Urban sky & building wall background
  c.fillGradientV(0, 160, [178, 205, 226], [210, 215, 218]);
  // Sidewalk pavement
  c.fillGradientV(160, 240, [160, 164, 168], [130, 134, 138]);
  // Asphalt road
  c.fillGradientV(240, 300, [65, 68, 72], [48, 50, 54]);

  // Road curb line
  c.fillRect(0, 238, 400, 5, 200, 200, 200);

  // Big Green Municipal Dustbin
  c.fillRect(150, 100, 100, 125, 26, 115, 60); // Bin body
  c.fillRect(145, 90, 110, 15, 18, 90, 45);   // Bin rim

  // Open lid tilted back
  c.fillRect(140, 65, 115, 18, 15, 75, 38);
  c.fillRect(135, 75, 10, 25, 20, 20, 20); // Lid hinge

  // Wheelie bin wheels
  c.fillCircle(155, 228, 14, 30, 30, 30);
  c.fillCircle(245, 228, 14, 30, 30, 30);
  c.fillCircle(155, 228, 5, 160, 160, 160);
  c.fillCircle(245, 228, 5, 160, 160, 160);

  // Spilling white & dark garbage bags from top
  c.fillCircle(175, 85, 22, 235, 235, 235);
  c.fillCircle(210, 80, 24, 45, 45, 45);
  c.fillCircle(195, 70, 18, 240, 240, 240);

  // Ground litter scatter around base
  c.fillCircle(120, 225, 16, 230, 230, 230); // White bag on ground
  c.fillCircle(135, 232, 14, 50, 50, 50);    // Black bag
  c.fillCircle(270, 228, 18, 225, 225, 225); // White bag
  c.fillRect(100, 220, 25, 18, 220, 120, 40); // Orange juice carton
  c.fillRect(285, 235, 28, 12, 40, 140, 220); // Crushed plastic bottle
  c.fillCircle(255, 245, 10, 240, 200, 60);  // Yellow wrapper

  // Badge overlay: "OVERFLOWING BIN"
  c.fillRect(15, 15, 140, 26, 15, 23, 42, 210);
  c.fillRect(15, 15, 4, 26, 217, 119, 6); // Amber bar

  return c.toJpegBase64();
}

// ── 2. Large Garbage Dump ───────────────────────────────────────
export function generateGarbageDumpImage() {
  const c = new Canvas();
  // Cloudy grey sky
  c.fillGradientV(0, 120, [160, 175, 185], [195, 200, 205]);
  // Background concrete boundary wall
  c.fillGradientV(120, 190, [140, 138, 132], [115, 110, 105]);
  // Muddy landfill earth ground
  c.fillGradientV(190, 300, [85, 70, 55], [60, 48, 38]);

  // Large composite garbage heap in foreground
  const piles = [
    { cx: 200, cy: 200, r: 85, col: [50, 48, 45] },
    { cx: 130, cy: 220, r: 65, col: [215, 210, 205] },
    { cx: 270, cy: 215, r: 70, col: [75, 65, 55] },
    { cx: 180, cy: 175, r: 50, col: [225, 220, 215] },
    { cx: 230, cy: 180, r: 55, col: [40, 42, 44] },
    { cx: 90, cy: 245, r: 50, col: [170, 120, 80] },   // Cardboard
    { cx: 320, cy: 240, r: 55, col: [180, 130, 90] },  // Cardboard boxes
    { cx: 160, cy: 235, r: 40, col: [35, 120, 180] },  // Blue tarpaulin
    { cx: 240, cy: 240, r: 45, col: [210, 50, 40] },   // Red plastic sack
  ];

  piles.forEach((p) => c.fillCircle(p.cx, p.cy, p.r, p.col[0], p.col[1], p.col[2]));

  // Scattered surface debris & wrappers
  for (let i = 0; i < 45; i++) {
    const rx = 50 + (i * 17) % 300;
    const ry = 160 + (i * 23) % 120;
    const colors = [
      [240, 240, 240],
      [230, 180, 30],
      [40, 140, 220],
      [220, 70, 50],
      [30, 180, 90],
    ];
    const col = colors[i % colors.length];
    c.fillRect(rx, ry, 12 + (i % 8), 8 + (i % 6), col[0], col[1], col[2]);
  }

  // Badge overlay
  c.fillRect(15, 15, 130, 26, 15, 23, 42, 210);
  c.fillRect(15, 15, 4, 26, 220, 38, 38); // Red bar

  return c.toJpegBase64();
}

// ── 3. Plastic Waste ────────────────────────────────────────────
export function generatePlasticWasteImage() {
  const c = new Canvas();
  // Park greenery & fence
  c.fillGradientV(0, 140, [95, 145, 90], [130, 175, 115]);
  // Dirt roadside & asphalt path
  c.fillGradientV(140, 240, [145, 135, 120], [110, 100, 90]);
  c.fillGradientV(240, 300, [60, 64, 68], [45, 48, 52]);

  // Plastic bottle clusters (Cyan / Blue / Transparent / Red caps)
  const bottles = [
    { x: 120, y: 170, w: 55, h: 22, col: [56, 189, 248] },
    { x: 190, y: 185, w: 60, h: 24, col: [14, 165, 233] },
    { x: 150, y: 205, w: 50, h: 20, col: [186, 230, 253] },
    { x: 260, y: 190, w: 58, h: 22, col: [56, 189, 248] },
    { x: 80, y: 215, w: 52, h: 20, col: [14, 165, 233] },
    { x: 220, y: 225, w: 62, h: 25, col: [186, 230, 253] },
    { x: 170, y: 240, w: 55, h: 22, col: [56, 189, 248] },
    { x: 290, y: 235, w: 48, h: 18, col: [14, 165, 233] },
  ];

  bottles.forEach((b) => {
    c.fillRect(b.x, b.y, b.w, b.h, b.col[0], b.col[1], b.col[2]);
    c.fillRect(b.x + b.w, b.y + 4, 8, b.h - 8, 220, 38, 38); // Red cap
  });

  // Plastic bags & film sacks
  c.fillCircle(110, 190, 26, 240, 240, 240, 200); // White polybag
  c.fillCircle(240, 175, 28, 250, 204, 21, 210);  // Yellow grocery bag
  c.fillCircle(180, 210, 32, 239, 68, 68, 190);   // Red shopping bag

  // Badge overlay
  c.fillRect(15, 15, 130, 26, 15, 23, 42, 210);
  c.fillRect(15, 15, 4, 26, 14, 165, 233); // Blue bar

  return c.toJpegBase64();
}

// ── 4. Construction Debris ──────────────────────────────────────
export function generateConstructionDebrisImage() {
  const c = new Canvas();
  // Construction wall / background hoarding
  c.fillGradientV(0, 130, [190, 180, 165], [160, 150, 135]);
  // Sandy gravel ground
  c.fillGradientV(130, 300, [175, 160, 135], [130, 115, 95]);

  // Red Clay Bricks
  const bricks = [
    { x: 120, y: 180, w: 45, h: 22 },
    { x: 170, y: 175, w: 48, h: 24 },
    { x: 140, y: 155, w: 44, h: 20 },
    { x: 225, y: 185, w: 46, h: 23 },
    { x: 195, y: 160, w: 45, h: 22 },
    { x: 95, y: 205, w: 48, h: 24 },
    { x: 250, y: 200, w: 46, h: 22 },
  ];

  bricks.forEach((b) => {
    c.fillRect(b.x, b.y, b.w, b.h, 185, 65, 45); // Terracotta red
    c.fillRect(b.x, b.y, b.w, 3, 215, 95, 75);  // Highlight edge
  });

  // Grey Concrete Cinder Blocks
  const cinderBlocks = [
    { x: 110, y: 215, w: 60, h: 32 },
    { x: 180, y: 210, w: 65, h: 34 },
    { x: 255, y: 225, w: 58, h: 30 },
  ];

  cinderBlocks.forEach((cb) => {
    c.fillRect(cb.x, cb.y, cb.w, cb.h, 120, 125, 130);
    c.fillRect(cb.x + 8, cb.y + 6, 18, 20, 60, 65, 70); // Hollow core 1
    c.fillRect(cb.x + 34, cb.y + 6, 18, 20, 60, 65, 70); // Hollow core 2
  });

  // Sand mound & cement dust
  c.fillCircle(210, 245, 65, 195, 175, 135);
  c.fillCircle(145, 255, 50, 180, 160, 125);

  // Badge overlay
  c.fillRect(15, 15, 160, 26, 15, 23, 42, 210);
  c.fillRect(15, 15, 4, 26, 180, 83, 9); // Amber-brown bar

  return c.toJpegBase64();
}

// ── 5. E-Waste ──────────────────────────────────────────────────
export function generateEWasteImage() {
  const c = new Canvas();
  // Concrete collection floor
  c.fillGradientV(0, 300, [95, 100, 108], [60, 65, 72]);

  // Broken CRT monitor casing (Grey bezel + dark screen)
  c.fillRect(80, 80, 110, 95, 40, 42, 45);
  c.fillRect(90, 90, 90, 75, 20, 22, 25);
  // Screen crack lines (light blue/white)
  for (let i = 0; i < 30; i++) {
    c.setPixel(110 + i, 110 + Math.floor(i * 0.8), 200, 220, 240);
    c.setPixel(140 - i, 120 + Math.floor(i * 0.5), 200, 220, 240);
  }

  // Green PCB Circuit Boards
  c.fillRect(210, 100, 115, 80, 22, 101, 52); // Main PCB green
  c.fillRect(225, 115, 30, 30, 20, 20, 20);   // Black IC chip
  c.fillRect(270, 120, 22, 22, 20, 20, 20);   // Black IC chip 2

  // Golden / copper circuit traces
  for (let x = 215; x < 320; x += 10) {
    c.fillRect(x, 155, 6, 20, 217, 119, 6);
  }

  // Tangled electrical cables (Red, Blue, Yellow, Black)
  for (let t = 0; t < 150; t++) {
    const cx = 130 + Math.sin(t * 0.08) * 80 + (t * 0.8);
    const cy = 200 + Math.cos(t * 0.06) * 35;
    c.fillCircle(cx, cy, 3, 220, 38, 38); // Red wire
    c.fillCircle(cx + 8, cy + 5, 3, 37, 99, 235); // Blue wire
    c.fillCircle(cx - 5, cy + 8, 3, 234, 179, 8); // Yellow wire
  }

  // Badge overlay
  c.fillRect(15, 15, 110, 26, 15, 23, 42, 210);
  c.fillRect(15, 15, 4, 26, 124, 58, 237); // Purple bar

  return c.toJpegBase64();
}

// ── 6. Drain Blockage ───────────────────────────────────────────
export function generateDrainBlockageImage() {
  const c = new Canvas();
  // Concrete curb & road asphalt
  c.fillGradientV(0, 130, [140, 142, 145], [110, 112, 115]);
  c.fillGradientV(130, 300, [65, 68, 72], [45, 48, 52]);

  // Deep drain gulley trough
  c.fillRect(80, 90, 240, 140, 35, 40, 45);

  // Cast Iron Stormwater Drain Grating
  for (let gx = 95; gx < 310; gx += 18) {
    c.fillRect(gx, 95, 8, 130, 20, 22, 24); // Black iron bars
    c.fillRect(gx + 1, 95, 2, 130, 90, 95, 100); // Bar metallic highlight
  }
  // Cross bars
  c.fillRect(90, 135, 220, 8, 20, 22, 24);
  c.fillRect(90, 185, 220, 8, 20, 22, 24);

  // Murky Stagnant Water Overflow
  c.fillRect(100, 140, 200, 85, 55, 75, 60, 210);

  // Severe Sludge, Muck & Plastic blockage
  c.fillCircle(140, 170, 35, 70, 60, 45);  // Mud / silt mound
  c.fillCircle(200, 180, 40, 50, 45, 35);  // Heavy muck
  c.fillCircle(260, 175, 32, 65, 55, 40);

  // Floating discarded cups & packaging
  c.fillRect(150, 165, 24, 16, 240, 240, 240); // White styrofoam
  c.fillRect(220, 175, 28, 14, 56, 189, 248);  // Blue plastic cup
  c.fillCircle(185, 195, 15, 239, 68, 68);     // Red pouch

  // Overflow spill pooling onto road
  c.fillCircle(200, 245, 70, 45, 65, 55, 170);

  // Badge overlay: "CRITICAL DRAINAGE"
  c.fillRect(15, 15, 150, 26, 15, 23, 42, 210);
  c.fillRect(15, 15, 4, 26, 220, 38, 38); // Urgent red bar

  return c.toJpegBase64();
}

// ── 7. Hazardous Waste ──────────────────────────────────────────
export function generateHazardousWasteImage() {
  const c = new Canvas();
  // Industrial concrete background
  c.fillGradientV(0, 160, [130, 135, 140], [100, 105, 110]);
  c.fillGradientV(160, 300, [60, 62, 65], [40, 42, 45]);

  // Yellow Hazard Drum (Chemical container)
  c.fillRect(130, 90, 140, 145, 245, 158, 11); // Hazard yellow body
  c.fillRect(125, 80, 150, 15, 217, 119, 6);   // Drum lid

  // Diagonal Black Hazard Warning Stripes
  for (let sy = 120; sy < 190; sy += 24) {
    for (let sx = 130; sx < 270; sx++) {
      if ((sx + sy) % 36 < 18) {
        c.setPixel(sx, sy, 20, 20, 20);
        c.setPixel(sx, sy + 1, 20, 20, 20);
        c.setPixel(sx, sy + 2, 20, 20, 20);
      }
    }
  }

  // White Diamond Hazard Warning Label
  c.fillRect(175, 135, 50, 50, 255, 255, 255);
  c.fillRect(177, 137, 46, 46, 220, 38, 38); // Red border
  c.fillCircle(200, 160, 12, 255, 255, 255); // Skull / symbol center
  c.fillCircle(200, 160, 8, 20, 20, 20);

  // Chemical spill puddle around drum base
  c.fillCircle(200, 245, 85, 180, 83, 9, 210); // Amber chemical spill
  c.fillCircle(200, 245, 60, 217, 119, 6, 240);

  // White medical clinical container beside drum
  c.fillRect(80, 180, 45, 55, 245, 245, 245);
  c.fillRect(85, 170, 35, 12, 220, 38, 38); // Red biohazard cap

  // Badge overlay: "HAZARDOUS BIOHAZARD"
  c.fillRect(15, 15, 175, 26, 15, 23, 42, 210);
  c.fillRect(15, 15, 4, 26, 220, 38, 38); // Urgent red bar

  return c.toJpegBase64();
}

// ── 8. Organic / Horticulture Waste ─────────────────────────────
export function generateOrganicWasteImage() {
  const c = new Canvas();
  // Market stall wall / park fence
  c.fillGradientV(0, 140, [180, 170, 155], [150, 140, 125]);
  // Earth / wet pavement
  c.fillGradientV(140, 300, [110, 95, 75], [75, 60, 45]);

  // Wooden vegetable crate
  c.fillRect(90, 130, 80, 55, 146, 64, 14);
  c.fillRect(95, 138, 70, 6, 180, 83, 9);
  c.fillRect(95, 155, 70, 6, 180, 83, 9);

  // Heaps of decomposing vegetables & fruit waste
  const mounds = [
    { cx: 220, cy: 190, r: 65, col: [34, 197, 94] },  // Green foliage
    { cx: 160, cy: 215, r: 50, col: [249, 115, 22] }, // Rotting orange produce
    { cx: 280, cy: 210, r: 55, col: [161, 98, 7] },   // Brown compost
    { cx: 210, cy: 235, r: 45, col: [101, 163, 13] }, // Vegetable stalks
  ];

  mounds.forEach((m) => c.fillCircle(m.cx, m.cy, m.r, m.col[0], m.col[1], m.col[2]));

  // Pruned tree branches and twigs
  for (let b = 0; b < 25; b++) {
    const bx = 120 + (b * 9);
    const by = 210 + (b % 5) * 8;
    c.fillRect(bx, by, 35, 4, 120, 53, 15);
  }

  // Badge overlay
  c.fillRect(15, 15, 130, 26, 15, 23, 42, 210);
  c.fillRect(15, 15, 4, 26, 22, 163, 74); // Green bar

  return c.toJpegBase64();
}

/**
 * Get category demo image base64 string
 */
export function getDemoImageForWasteType(wasteType) {
  switch (wasteType) {
    case 'overflowing_bin':
      return generateOverflowingBinImage();
    case 'garbage_dump':
      return generateGarbageDumpImage();
    case 'plastic_waste':
      return generatePlasticWasteImage();
    case 'construction_debris':
      return generateConstructionDebrisImage();
    case 'e_waste':
      return generateEWasteImage();
    case 'drain_blockage':
      return generateDrainBlockageImage();
    case 'hazardous_waste':
      return generateHazardousWasteImage();
    case 'organic_waste':
    default:
      return generateOrganicWasteImage();
  }
}
