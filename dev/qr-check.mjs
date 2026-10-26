import { renderQrSvg, qrMatrix } from '../src/shared/qr.js';

const url = 'https://move.example.com/p/g4ybhszv';
const svg = renderQrSvg(url, { pixelSize: 1024 });
const circles = (svg.match(/<circle/g) || []).length;
const rects = (svg.match(/<rect/g) || []).length;
const matrix = qrMatrix(url, 'H');

console.log('矩阵尺寸     ', matrix.length + 'x' + matrix[0].length);
console.log('圆点数量     ', circles);
console.log('圆角块数量   ', rects, '（3 个定位图形 × 3 层）');
console.log('SVG 大小     ', (svg.length / 1024).toFixed(1) + ' KB');
console.log('白色圆形底板 ', svg.includes('r="60"'));
console.log('定位图形完整 ', rects === 9);

// 校验数据模块的绘制数量与矩阵深色点数（扣除三个定位区域）一致
const n = matrix.length;
function inFinder(r, c) {
  const top = r <= 6, bottom = r >= n - 7, left = c <= 6, right = c >= n - 7;
  return (top && left) || (top && right) || (bottom && left);
}
let dark = 0;
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (matrix[r][c] && !inFinder(r, c, n)) dark++;
console.log('数据点数     ', dark, '（应等于圆点数量减 1）');
console.log('一致性       ', circles - 1 === dark ? '通过' : '失败');
