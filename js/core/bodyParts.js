export const BODY_PARTS = {
  head: {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#0d2233';
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, -8, 28, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0d2233';
      ctx.beginPath();
      ctx.roundRect(-18, 14, 36, 12, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#001a0d';
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(-9, -10, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(9, -10, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#00ffcc';
      ctx.beginPath();
      ctx.arc(-9, -10, 2.5, 0, Math.PI * 2);
      ctx.arc(9, -10, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0f7f0';
      ctx.beginPath();
      ctx.arc(-8, -11, 1, 0, Math.PI * 2);
      ctx.arc(10, -11, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-3, 2);
      ctx.quadraticCurveTo(0, 8, 3, 2);
      ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-8, 16);
      ctx.quadraticCurveTo(0, 21, 8, 16);
      ctx.stroke();
      ctx.fillStyle = '#0d2233';
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(-29, -4, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(29, -4, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 26,
    width: 56,
    height: 62
  },
  'head-right': {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#0d2233';
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, -8, 28, 32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0d2233';
      ctx.beginPath();
      ctx.roundRect(-18, 14, 36, 12, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#001a0d';
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(9, -10, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-9, -10, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#00ffcc';
      ctx.beginPath();
      ctx.arc(9, -10, 2.5, 0, Math.PI * 2);
      ctx.arc(-9, -10, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0f7f0';
      ctx.beginPath();
      ctx.arc(8, -11, 1, 0, Math.PI * 2);
      ctx.arc(-10, -11, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-3, 2);
      ctx.quadraticCurveTo(0, 8, 3, 2);
      ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-8, 16);
      ctx.quadraticCurveTo(0, 21, 8, 16);
      ctx.stroke();
      ctx.fillStyle = '#0d2233';
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(-29, -4, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(29, -4, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 26,
    width: 56,
    height: 62
  },
  neck: {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#112233';
      ctx.strokeStyle = '#4499cc';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-10, -18, 20, 36, 6);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#4499cc';
      ctx.globalAlpha = alpha * 0.5;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(8, -4);
      ctx.moveTo(-8, 4);
      ctx.lineTo(8, 4);
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 18,
    width: 20,
    height: 36
  },
  torso: {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#0d2233';
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-38, -52);
      ctx.lineTo(38, -52);
      ctx.lineTo(28, 52);
      ctx.lineTo(-28, 52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#00d9ff';
      ctx.globalAlpha = alpha * 0.6;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-28, -30);
      ctx.quadraticCurveTo(-14, -18, 0, -30);
      ctx.quadraticCurveTo(14, -18, 28, -30);
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.4;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-16, -10);
      ctx.lineTo(16, -10);
      ctx.moveTo(-18, 6);
      ctx.lineTo(18, 6);
      ctx.moveTo(-20, 22);
      ctx.lineTo(20, 22);
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.3;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(0, 52);
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 52,
    width: 76,
    height: 104
  },
  pelvis: {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#0d2233';
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-32, -20);
      ctx.quadraticCurveTo(-40, 0, -26, 20);
      ctx.lineTo(26, 20);
      ctx.quadraticCurveTo(40, 0, 32, -20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#00d9ff';
      ctx.globalAlpha = alpha * 0.4;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-28, 0);
      ctx.lineTo(28, 0);
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 20,
    width: 64,
    height: 40
  },
  'upper-arm-l': {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#0055aa';
      ctx.strokeStyle = '#0088ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-12, -44);
      ctx.lineTo(12, -44);
      ctx.lineTo(8, 44);
      ctx.lineTo(-8, 44);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#3399ff';
      ctx.globalAlpha = alpha * 0.4;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-6, -44);
      ctx.lineTo(-4, 44);
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 44,
    width: 24,
    height: 88
  },
  'upper-arm-r': {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#005533';
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-12, -44);
      ctx.lineTo(12, -44);
      ctx.lineTo(8, 44);
      ctx.lineTo(-8, 44);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#00ff88';
      ctx.globalAlpha = alpha * 0.4;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(6, -44);
      ctx.lineTo(4, 44);
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 44,
    width: 24,
    height: 88
  },
  'lower-arm-l': {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#003d80';
      ctx.strokeStyle = '#0088ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-10, -36);
      ctx.lineTo(10, -36);
      ctx.lineTo(6, 36);
      ctx.lineTo(-6, 36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#3399ff';
      ctx.globalAlpha = alpha * 0.3;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-5, -36);
      ctx.lineTo(-3, 36);
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 36,
    width: 20,
    height: 72
  },
  'lower-arm-r': {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#003d26';
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-10, -36);
      ctx.lineTo(10, -36);
      ctx.lineTo(6, 36);
      ctx.lineTo(-6, 36);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#00ff88';
      ctx.globalAlpha = alpha * 0.3;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(5, -36);
      ctx.lineTo(3, 36);
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 36,
    width: 20,
    height: 72
  },
  'hand-l': {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#0044aa';
      ctx.strokeStyle = '#0088ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-14, -10, 28, 20, 6);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-12, -24, 6, 16, 3);
      ctx.roundRect(-4, -27, 6, 19, 3);
      ctx.roundRect(4, -26, 6, 18, 3);
      ctx.roundRect(12, -22, 6, 14, 3);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(-22, -6, 10, 14, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 10,
    width: 34,
    height: 38
  },
  'hand-r': {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#004422';
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-14, -10, 28, 20, 6);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-12, -24, 6, 16, 3);
      ctx.roundRect(-4, -27, 6, 19, 3);
      ctx.roundRect(4, -26, 6, 18, 3);
      ctx.roundRect(12, -22, 6, 14, 3);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(-22, -6, 10, 14, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 10,
    width: 34,
    height: 38
  },
  'upper-leg-l': {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#0044cc';
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-14, -52);
      ctx.lineTo(14, -52);
      ctx.lineTo(10, 52);
      ctx.lineTo(-10, 52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#3366ff';
      ctx.globalAlpha = alpha * 0.35;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-7, -52);
      ctx.lineTo(-5, 52);
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 52,
    width: 28,
    height: 104
  },
  'upper-leg-r': {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#006644';
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-14, -52);
      ctx.lineTo(14, -52);
      ctx.lineTo(10, 52);
      ctx.lineTo(-10, 52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#00ff88';
      ctx.globalAlpha = alpha * 0.35;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(7, -52);
      ctx.lineTo(5, 52);
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 52,
    width: 28,
    height: 104
  },
  'lower-leg-l': {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#003399';
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-10, -50);
      ctx.lineTo(10, -50);
      ctx.quadraticCurveTo(14, -20, 10, 50);
      ctx.lineTo(-10, 50);
      ctx.quadraticCurveTo(-12, -20, -10, -50);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#3366ff';
      ctx.globalAlpha = alpha * 0.3;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-5, -50);
      ctx.quadraticCurveTo(-6, -20, -5, 50);
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 50,
    width: 24,
    height: 100
  },
  'lower-leg-r': {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#004d33';
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-10, -50);
      ctx.lineTo(10, -50);
      ctx.quadraticCurveTo(14, -20, 10, 50);
      ctx.lineTo(-10, 50);
      ctx.quadraticCurveTo(-12, -20, -10, -50);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#00ff88';
      ctx.globalAlpha = alpha * 0.3;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(5, -50);
      ctx.quadraticCurveTo(6, -20, 5, 50);
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 50,
    width: 24,
    height: 100
  },
  'foot-l': {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#002266';
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-14, -10, 14, 20, 5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(-14, 4, 44, 12, 5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(20, -6, 16, 22, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 10,
    width: 46,
    height: 32
  },
  'foot-r': {
    draw: (ctx, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#003322';
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-14, -10, 14, 20, 5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(-14, 4, 44, 12, 5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(20, -6, 16, 22, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
    pivotY: 10,
    width: 46,
    height: 32
  }
};

export function drawBodyPart(ctx, partId, alpha = 1) {
  const part = BODY_PARTS[partId];
  if (part) {
    part.draw(ctx, alpha);
  }
}

export function getPartInfo(partId) {
  return BODY_PARTS[partId] || null;
}
