# Miasma

Temná plošinovka pre dospelých (morový lekár s fakľou), postavená na engine Lumenu (`~/vyvoj/lumen`).

- `src/game/` je čistá logika bez PixiJS a DOM (vynútené ESLintom), testy sú vo `tests/`.
- Levely generuje `scripts/build_levels.py` (zapíše `src/game/levels.ts`, potom `npx prettier --write src/game/levels.ts`);
  legenda znakov je v `src/game/level.ts`. Každý level má ručne navrhnutú prvú polovicu a druhú polovicu
  poskladanú z blokov (`Gen.block`, obťažnosť rastie so svetom). Test `tests/levels.test.ts` overuje botom,
  že sa každý level dá prejsť a že smola vystačí aj bez dopĺňania (rezerva aspoň 20 %).
- Odlíšenie od Lumenu: svetlo prezrádza (dohľad nakazených rastie s polomerom, rozžiarenie ich privolá,
  zhasnutá iskra a oheň lákajú), potkany (`r`) sa boja svetla a útočia pri ukrytej fakli/bez smoly,
  palica (V/E, `swingCane`, odpálenie do priepasti), morové hniezda (`n`, bez nich sa hranica nezapáli),
  morový zvon (`updateBell`, besnenie), preživší (`u`) a byliny v brašni (Q), kľúče/dvere/groše (`k`, `D`, `$`)
  v pivniciach a domoch, lekáreň a výbava (`src/game/save.ts`), denník a tri konce (`src/game/story.ts`).
  Staršie prvky: miazma (`~`), barikády (`x`), ukrytie fakle (↓).
- Obťažnosť: smrť na jeden zásah, prízrak pred výpadom varuje (`windup`), nakazení (`g`) chodia po zemi.
  V kóde ostali názvy z Lumenu: olej = smola fakle, svetluška = uhlík, kryštál = strana denníka, lampa = kaplnka,
  vatra = hranica, tieň = prízrak, cencúľ = padajúce murivo, huba = plachta.
- Grafika je vektorová (`src/render/vector.ts`, postava `src/render/doctor.ts`) a celú scénu aj úvodnú obrazovku
  prekreslí drevorezový shader (`src/render/woodcut.ts`, `?classic` ho vypne). Hudba je chorál (`src/audio/music.ts`).
- Texty rozhrania len cez `t()` z `src/ui/i18n.ts` (angličtina — predvolená a základ kľúčov, slovenčina, čeština).
- Myslieť na mobil: dotykové tlačidlá, telefón na šírku, `env(safe-area-inset-*)`.
- Overenie: `npm run typecheck && npm run lint && npm test` (typecheck je `tsc -b`; `tsc -p .` nekontroluje nič).
