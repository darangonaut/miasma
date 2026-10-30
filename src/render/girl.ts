/**
 * Postavička: drobné útle dievčatko s copom, v šatôčkach, s lampášom v ruke.
 * Kreslí sa v súradniciach 14 × 17 (otočené doprava, chodidlá na y = 15.4);
 * používa ju hra aj úvodná obrazovka.
 */
export const GIRL_INK = '#05060b';

/** Stred skla lampáša (kvôli žiare na úvodnej obrazovke). */
export const GIRL_LANTERN = { x: 10.9, y: 11.9 };

export interface GirlPose {
  /** Nohy: [x bedra, vychýlenie chodidla]. */
  legs: [number, number][];
  /** Výška chodidiel (pri skoku pokrčené). */
  legEnd: number;
  /** Nadýchnutie: posun hornej časti tela. */
  dy: number;
  /** Vejúci cop (-1 až 1). */
  wave: number;
}

export function drawGirl(ctx: CanvasRenderingContext2D, pose: GirlPose): void {
  const { legs, legEnd, dy, wave } = pose;
  ctx.fillStyle = GIRL_INK;
  ctx.strokeStyle = GIRL_INK;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Tenké nožičky.
  ctx.lineWidth = 0.95;
  for (const [x, lean] of legs) {
    ctx.beginPath();
    ctx.moveTo(x, 11.8);
    ctx.lineTo(x + lean, legEnd);
    ctx.stroke();
  }

  // Šatôčky v tvare A s mierne zvlneným lemom.
  ctx.beginPath();
  ctx.moveTo(5.7, 7.3 + dy);
  ctx.lineTo(7.7, 7.3 + dy);
  ctx.quadraticCurveTo(8.6, 9.6, 9.4, 12.3);
  ctx.quadraticCurveTo(8.3, 12.8, 7.2, 12.4);
  ctx.quadraticCurveTo(6.1, 12.8, 5, 12.4);
  ctx.quadraticCurveTo(4.4, 12.6, 3.9, 12.3);
  ctx.quadraticCurveTo(4.7, 9.6, 5.7, 7.3 + dy);
  ctx.fill();

  // Krk a hlava.
  ctx.fillRect(6.3, 6.4 + dy, 0.9, 1.2);
  ctx.beginPath();
  ctx.arc(6.9, 4.6 + dy, 2.45, 0, Math.PI * 2);
  ctx.fill();

  // Cop: od temena dozadu, vejúci vo vetre.
  ctx.beginPath();
  ctx.moveTo(5.4, 3 + dy);
  ctx.quadraticCurveTo(3.6, 3 + dy, 3 + wave * 0.3, 4.8 + dy);
  ctx.quadraticCurveTo(2.2 + wave * 0.6, 6.4 + dy, 1.2 + wave, 7.6 + dy);
  ctx.quadraticCurveTo(2.9 + wave * 0.4, 7 + dy, 3.8, 5.8 + dy);
  ctx.quadraticCurveTo(4.6, 5 + dy, 5.4, 5.2 + dy);
  ctx.closePath();
  ctx.fill();
  // Mašľa.
  ctx.beginPath();
  ctx.ellipse(4.3, 3.3 + dy, 0.9, 0.55, -0.6, 0, Math.PI * 2);
  ctx.fill();

  // Tenká ručička s lampášom.
  ctx.lineWidth = 0.85;
  ctx.beginPath();
  ctx.moveTo(7.6, 8 + dy);
  ctx.lineTo(10.2, 9.3 + dy);
  ctx.stroke();
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(10.4, 9.3 + dy);
  ctx.lineTo(10.8, 10.2 + dy);
  ctx.stroke();
  ctx.fillRect(9.9, 10.2 + dy, 2, 3.2);
  ctx.fillRect(10.2, 9.9 + dy, 1.4, 0.5);
  const glass = ctx.createLinearGradient(0, 10.7 + dy, 0, 13 + dy);
  glass.addColorStop(0, '#fff6c8');
  glass.addColorStop(1, '#ffd35a');
  ctx.fillStyle = glass;
  ctx.fillRect(10.3, 10.6 + dy, 1.2, 2.4);

  // Oko.
  ctx.fillStyle = '#e8f4ff';
  ctx.beginPath();
  ctx.arc(8.1, 4.4 + dy, 0.45, 0, Math.PI * 2);
  ctx.fill();
}
