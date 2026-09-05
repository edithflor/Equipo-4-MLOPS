Feature: Gráficas con datos reales
  Como evaluador
  Quiero ver objetos por clase y progreso
  Calculados en BD, no series inventadas

  Scenario: objetos por clase
    Given anotaciones de al menos 2 categorías
    When pido/abro la gráfica de objetos por clase
    Then cada barra/slice coincide con COUNT de anotaciones GROUP BY category_id
    And los nombres/colores coinciden con las categorías

  Scenario: progreso de anotación
    Given imágenes con y sin anotaciones
    When pido/abro la gráfica de progreso
    Then los segmentos coinciden con el conteo de imágenes anotadas vs pendientes
    And la suma de segmentos = total de imágenes

  Scenario: mutar la BD mueve las gráficas
    Given valores actuales
    When agrego bboxes de una clase y anoto una imagen vacía
    Then objetos por clase de esa clase sube
    And el progreso de anotadas sube
