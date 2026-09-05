# SPEC Traceability Index

Este indice documenta evidencia real de trazabilidad para el cierre F7-03. No reemplaza los tests ni los features; solo conecta reglas evaluables con archivos versionados.

| Regla | SPEC | Feature | Test |
| --- | --- | --- | --- |
| Upload JPEG/PNG con validacion server-side | SPEC-F4-01 / F3-01 | `features/f4-01-upload-ui.feature` | `tests/uploadImage.test.ts`, `tests/dataBoundaries.test.ts` |
| BBox requiere categoria | SPEC-F4-03 / F3-03 | `features/f4-03-category-ui.feature` | `tests/categoryInvariant.test.ts`, `tests/dataBoundaries.test.ts` |
| COCO ids, bbox, area e iscrowd | SPEC-F6-01, SPEC-F6-02, SPEC-F6-03 | `features/f6-01-coco-contract.feature`, `features/f6-02-coco-sections-ids.feature`, `features/f6-03-coco-bbox-area-iscrowd.feature` | `tests/cocoContract.test.ts`, `tests/cocoSectionsIds.test.ts`, `tests/cocoGeometry.test.ts` |
| Busqueda AND SQL | SPEC-F5-03 | `features/f5-03-search-sql.feature` | `tests/searchSql.test.ts` |

## TDD Evidence

Estos ciclos existen en el historial y no fueron reescritos para F7-03.

| Ciclo | RED / Test | GREEN / Implementacion |
| --- | --- | --- |
| COCO contract | `73e50c1 test: add F6-01 COCO contract` | `e0e5c84 feat: implement F6-02 COCO dataset exporter`, `02cdd6c feat: implement F6-03 COCO bbox geometry` |
| COCO download | `73e50c1 test: add F6-01 COCO contract` | `08d6615 feat: implement F6-04 COCO dataset download` |
| Biome delivery guard | `13c1bc5 test: add F7-01 Biome delivery checks` | `552b5d9 test: add F7-02 delivery bootstrap audit` |
