/**
 * Morový lekár: klobúk so širokou strechou, maska so zobákom, dlhý plášť a fakľa v ruke.
 * Kreslí sa v súradniciach 14 × 17 (otočený doprava, chodidlá na y = 15.4); používa ho
 * hra aj úvodná obrazovka. Plameň fakle kreslí renderer zvlášť (horí nad tmou).
 */
export const DOCTOR_INK = '#05060b';

/** Vrch fakle, odkiaľ šľahá plameň. */
export const DOCTOR_TORCH = { x: 12.1, y: 9.3 };

export interface DoctorPose {
  /** Nohy: [x bedra, vychýlenie chodidla]. */
  legs: [number, number][];
  /** Výška chodidiel (pri skoku pokrčené). */
  legEnd: number;
  /** Nadýchnutie: posun hornej časti tela. */
  dy: number;
  /** Viajúci plášť (-1 až 1). */
  wave: number;
}

export function drawDoctor(ctx: CanvasRenderingContext2D, pose: DoctorPose): void {
  const { legs, legEnd, dy, wave } = pose;
  ctx.fillStyle = DOCTOR_INK;
  ctx.strokeStyle = DOCTOR_INK;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Nohy v čižmách.
  ctx.lineWidth = 1;
  for (const [x, lean] of legs) {
    ctx.beginPath();
    ctx.moveTo(x, 12.4);
    ctx.lineTo(x + lean, legEnd - 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + lean + 0.45, legEnd - 0.35, 0.95, 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dlhý plášť: vpredu rovný, chvost za ním viaje a je potrhaný.
  const tail = 3.1 - wave * 1.1;
  ctx.beginPath();
  ctx.moveTo(5.2, 6.5 + dy);
  ctx.lineTo(8, 6.5 + dy);
  ctx.quadraticCurveTo(9, 9.4, 9.5, 13.1);
  ctx.lineTo(8.2, 12.8);
  ctx.lineTo(7.4, 13.4);
  ctx.lineTo(6.3, 12.9);
  ctx.lineTo(5.2, 13.5);
  ctx.lineTo(4.4, 13 + wave * 0.2);
  ctx.lineTo(tail, 13.6 + wave * 0.3);
  ctx.quadraticCurveTo(3.6, 9.6, 5.2, 6.5 + dy);
  ctx.fill();
  // Pelerína cez plecia.
  ctx.beginPath();
  ctx.moveTo(4.6, 6.3 + dy);
  ctx.quadraticCurveTo(6.6, 5.6 + dy, 8.6, 6.3 + dy);
  ctx.lineTo(9, 8.6 + dy);
  ctx.quadraticCurveTo(6.4, 9.4 + dy, 4, 8.6 + dy - wave * 0.3);
  ctx.closePath();
  ctx.fill();

  // Hlava v kapucni a zobák masky (zahnutý nadol).
  ctx.beginPath();
  ctx.arc(6.5, 4.7 + dy, 1.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(7.4, 3.9 + dy);
  ctx.quadraticCurveTo(10.6, 4.3 + dy, 12.9, 6.9 + dy);
  ctx.quadraticCurveTo(10.4, 6.1 + dy, 7.6, 6.1 + dy);
  ctx.closePath();
  ctx.fill();

  // Klobúk so širokou strechou.
  ctx.beginPath();
  ctx.ellipse(6.4, 3.05 + dy, 3.75, 0.55, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(4.85, 3.1 + dy);
  ctx.lineTo(5.15, 0.75 + dy);
  ctx.quadraticCurveTo(6.5, 0.45 + dy, 7.85, 0.75 + dy);
  ctx.lineTo(8.05, 3.1 + dy);
  ctx.closePath();
  ctx.fill();

  // Ruka s fakľou.
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(7.6, 7.3 + dy);
  ctx.lineTo(10.7, 10.3 + dy);
  ctx.stroke();
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(10, 12.6 + dy);
  ctx.lineTo(DOCTOR_TORCH.x, DOCTOR_TORCH.y + 1 + dy);
  ctx.stroke();
  // Omotaná hlavica fakle.
  ctx.beginPath();
  ctx.roundRect(DOCTOR_TORCH.x - 0.75, DOCTOR_TORCH.y - 0.1 + dy, 1.5, 1.4, 0.4);
  ctx.fill();

  // Sklo masky: jediná farebná vec na postave (odráža svetlo fakle).
  ctx.fillStyle = '#d8c890';
  ctx.beginPath();
  ctx.arc(7.35, 4.35 + dy, 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = DOCTOR_INK;
  ctx.beginPath();
  ctx.arc(7.5, 4.3 + dy, 0.2, 0, Math.PI * 2);
  ctx.fill();
}
