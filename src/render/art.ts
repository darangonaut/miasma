import type { Container, Texture } from 'pixi.js';
import type { Level, World } from '@/game/level';
import type { PlayerFrame } from './common';

/**
 * Sada kreslenia: všetky textúry a terén. Rozmery textúr sú v jednotkách sveta
 * (políčko = 16), renderer s nimi zaobchádza ako so spritmi.
 */
/** Vlastnosti sveta pre renderer: sila tmy, mesiac a častice vo vzduchu. */
export interface WorldInfo {
  darkness: number;
  moon: boolean;
  /** Farba mesiaca (krvavý nad mestom, chorobne zelený nad cintorínom). */
  moonTint: number;
  ambient: 'motes' | 'wisps' | 'snow' | 'dust' | 'embers' | 'rain';
}

export interface Art {
  info(world: World): WorldInfo;
  terrain(level: Level): Container;
  player(frame: PlayerFrame | 'breathe'): Texture;
  shade(frame: number, burning: boolean): Texture;
  eyes(): Texture;
  ghoul(frame: number, burning: boolean): Texture;
  ghoulEyes(): Texture;
  firefly(): Texture;
  crystal(): Texture;
  lantern(lit: boolean): Texture;
  post(height: number): Texture;
  flame(variant: number): Texture;
  campfire(): Texture;
  sign(): Texture;
  lightTile(): Texture;
  rat(frame: number): Texture;
  cane(): Texture;
  spark(): Texture;
  water(frame: number, world: World): Texture;
  bounce(squash: boolean): Texture;
  icicle(): Texture;
  mover(): Texture;
  crumble(): Texture;
  barricade(): Texture;
  herb(): Texture;
  fogPuff(): Texture;
  moon(): Texture;
  /** Okrúhla častica danej farby a priemeru. */
  dot(color: string, size: number): Texture;
  sky(world: World): Texture;
  far(world: World): Texture;
  near(world: World): Texture;
}
