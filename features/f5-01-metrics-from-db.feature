Feature: Métricas reales
  Como evaluador
  Quiero ver conteos que cambian si cambia la BD
  Para no puntuar mocks

  Scenario: las métricas coinciden con la BD
    Given el seeder aplicado
    When pido las métricas del dashboard
    Then total de imágenes = COUNT de la tabla imágenes
    And total de anotaciones = COUNT de la tabla anotaciones
    And total de categorías = COUNT de categorías

  Scenario: cambiar datos cambia las métricas
    Given métricas actuales
    When inserto una imagen o una anotación por SQL/seeder de prueba
    And vuelvo a pedir métricas
    Then los números suben acorde
    And no siguen el valor anterior

  Scenario: la UI no trae constantes
    Given los componentes del dashboard
    When busco totales hardcodeados o mocks
    Then no hay valores fijos usados como dato de producción

  Scenario: la UI no consulta la BD
    Given archivos de UI del dashboard
    Then no importan drizzle, mysql ni minio
