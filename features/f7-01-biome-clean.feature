Feature: Biome limpio
  Como equipo de entrega
  Quiero que Biome y TypeScript terminen sin errores
  Para cerrar el proyecto con evidencia de calidad consistente

  Scenario: biome.json y script versionados
    Given biome.json está versionado en Git
    And package.json está versionado en Git
    Then package.json conserva el script de Biome check

  Scenario: check del repo completo
    When ejecuto npx biome check .
    Then termina con exit code 0
    And reporta 0 errors
    And reporta 0 warnings

  Scenario: no hay ignore masivo
    Given reviso biome.json
    Then no excluye src completa
    And no excluye public completa
    And no excluye carpetas funcionales solo para pasar Biome
    And no hay proliferación de biome-ignore
