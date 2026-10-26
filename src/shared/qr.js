import qrcode from 'qrcode-generator';

/** 把文本编码成 0/1 矩阵（true = 深色模块） */
export function qrMatrix(text, ecc = 'H') {
  const qr = qrcode(0, ecc);
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const rows = [];
  for (let r = 0; r < n; r++) {
    const row = [];
    for (let c = 0; c < n; c++) row.push(qr.isDark(r, c));
    rows.push(row);
  }
  return rows;
}

const fmt = (v) => Math.round(v * 1000) / 1000;

function inFinder(r, c, n) {
  const top = r <= 6;
  const bottom = r >= n - 7;
  const left = c <= 6;
  const right = c >= n - 7;
  return (top && left) || (top && right) || (bottom && left);
}

/**
 * 生成圆形二维码 SVG。
 *
 * 设计要点：外层是圆形白色底板，二维码矩阵本身保持正方形并居中，
 * 只有数据模块画成圆点。定位图形用圆角方块保留，保证可扫性。
 */
export function renderQrSvg(text, options = {}) {
  const {
    pixelSize = 512,
    style = 'dot',
    dark = '#111111',
    light = '#ffffff',
    ecc = 'H',
    ariaLabel = '车辆挪车二维码',
  } = options;

  const matrix = qrMatrix(text, ecc);
  const n = matrix.length;

  const VB = 120;             // viewBox 尺寸
  const square = 72;          // 二维码矩阵边长，四周留出静区（圆形底板的四角余量为静区）
  const offset = (VB - square) / 2;
  const cell = square / n;

  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB} ${VB}" width="${pixelSize}" height="${pixelSize}" role="img" aria-label="${ariaLabel}">`
  );
  parts.push(`<circle cx="60" cy="60" r="60" fill="${light}"/>`);

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!matrix[r][c] || inFinder(r, c, n)) continue;
      const x = offset + c * cell;
      const y = offset + r * cell;
      if (style === 'square') {
        parts.push(
          `<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(cell)}" height="${fmt(cell)}" fill="${dark}"/>`
        );
      } else {
        parts.push(
          `<circle cx="${fmt(x + cell / 2)}" cy="${fmt(y + cell / 2)}" r="${fmt(cell * 0.48)}" fill="${dark}"/>`
        );
      }
    }
  }

  // 三个定位图形：外层深色圆角块 → 中间白色圆角块 → 中心深色圆角块
  const finderOrigins = [
    [0, 0],
    [0, n - 7],
    [n - 7, 0],
  ];
  for (const [fr, fc] of finderOrigins) {
    const x = offset + fc * cell;
    const y = offset + fr * cell;
    parts.push(`<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(cell * 7)}" height="${fmt(cell * 7)}" rx="${fmt(cell * 1.6)}" fill="${dark}"/>`);
    parts.push(`<rect x="${fmt(x + cell)}" y="${fmt(y + cell)}" width="${fmt(cell * 5)}" height="${fmt(cell * 5)}" rx="${fmt(cell * 1.1)}" fill="${light}"/>`);
    parts.push(`<rect x="${fmt(x + cell * 2)}" y="${fmt(y + cell * 2)}" width="${fmt(cell * 3)}" height="${fmt(cell * 3)}" rx="${fmt(cell * 0.9)}" fill="${dark}"/>`);
  }

  parts.push('</svg>');
  return parts.join('');
}
