Feature: Filtros combinables y paginación
  Como anotador
  Quiero filtrar el lote y paginar sin números inventados
  Para recorrer resultados reales

  Scenario: filtro por clase
    When filtro por categoría "car"
    Then solo imágenes con al menos un bbox car
    And el total reportado = ese conjunto

  Scenario: filtro por estado
    When filtro por estado "anotada"
    Then solo imágenes que cumplen esa definición
    And el total cuadra

  Scenario: filtro por rango de fechas
    Given imágenes con created_at distintos
    When filtro from/to
    Then solo entran las del rango
    And fechas fuera no aparecen

  Scenario: filtros combinados
    When filtro clase + estado + rango a la vez
    Then el resultado cumple los tres
    And el total es el COUNT con los mismos WHERE
    And no se aplica un filtro en JS después de traer de más

  Scenario: paginación
    Given más imágenes que el page size
    When pido página 1 con limit N
    Then vienen como máximo N filas
    And el SQL usa LIMIT/OFFSET o cursor
    When pido página 2
    Then no se repiten ids
    And total no cambia entre páginas

  Scenario: página vacía
    When pido una página más allá del total
    Then lista vacía
    And total sigue siendo correcto
