# Miasma

Temná plošinovka pre dospelých (morový lekár s fakľou), postavená na engine Lumenu (`~/vyvoj/lumen`).

- `src/game/` je čistá logika bez PixiJS a DOM (vynútené ESLintom), testy sú vo `tests/`.
- Levely generuje `scripts/build_levels.py` (zapíše `src/game/levels.ts`, potom `npx prettier --write src/game/levels.ts`);
  legenda znakov je v `src/game/level.ts`. Každý level má ručne navrhnutú prvú polovicu a druhú polovicu
  poskladanú z blokov (`Gen.block`, obťažnosť rastie so svetom). Test `tests/levels.test.ts` overuje botom,
  že sa každý level dá prejsť a že smola vystačí aj bez dopĺňania (rezerva aspoň 20 %).
- Nové prvky oproti Lumenu: miazma (`~`, nákaza, spáli ju rozžiarenie), byliny (`h`), horľavé barikády (`x`,
  podpáli iskra alebo rozžiarenie, oheň sa šíri), ukrytie fakle pod plášť (↓: menej svetla, nevidia ťa, tma pohlcuje).
- Obťažnosť: smrť na jeden zásah, prízrak pred výpadom varuje (`windup`), nakazení (`g`) chodia po zemi.
  V kóde ostali názvy z Lumenu: olej = smola fakle, svetluška = uhlík, kryštál = relikvia, lampa = kaplnka,
  vatra = hranica, tieň = prízrak, mora = roj múch, cencúľ = padajúce murivo, huba = plachta.
- Grafika je vektorová v siluetovom štýle a kreslí sa v kóde (`src/render/vector.ts`, postava `src/render/doctor.ts`).
- Texty rozhrania len cez `t()` z `src/ui/i18n.ts` (angličtina — predvolená a základ kľúčov, slovenčina, čeština).
- Myslieť na mobil: dotykové tlačidlá, telefón na šírku, `env(safe-area-inset-*)`.
- Overenie: `npm run typecheck && npm run lint && npm test`.
