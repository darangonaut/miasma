# Lumen

- `src/game/` je čistá logika bez PixiJS a DOM (vynútené ESLintom), testy sú vo `tests/`.
- Levely sú ASCII mapy v `src/game/levels.ts`; legenda znakov je v `src/game/level.ts`.
  Test `tests/levels.test.ts` overuje botom, že sa každý level dá prejsť.
- Grafika je vektorová v siluetovom štýle a kreslí sa v kóde (`src/render/vector.ts`: Canvas 2D
  textúry vo vysokom rozlíšení, terén ako PixiJS `Graphics`), žiadne obrázky.
- Texty rozhrania len cez `t()` z `src/ui/i18n.ts` (angličtina — predvolená a základ kľúčov, slovenčina, čeština).
- Myslieť na mobil: dotykové tlačidlá, telefón na šírku, `env(safe-area-inset-*)`.
- Overenie: `npm run typecheck && npm run lint && npm test`.
