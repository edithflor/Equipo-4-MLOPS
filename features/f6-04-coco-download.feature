Feature: Descarga COCO completa
  Como usuario del portal
  Quiero descargar el dataset completo en JSON COCO
  Para entregar las anotaciones a consumidores compatibles con COCO

  Scenario: endpoint descarga JSON COCO
    Given imágenes, anotaciones y categorías persistidas
    When solicito GET /export/coco
    Then responde 200
    And Content-Type es application/json
    And Content-Disposition descarga coco-dataset.json
    And el body cumple el contrato COCO

  Scenario: descarga contiene todo el dataset
    Given la BD tiene N imágenes, M anotaciones y K categorías
    When descargo el JSON COCO
    Then images.length es N
    And annotations.length es M
    And categories.length es K
    And no depende de búsqueda, dashboard, imagen seleccionada ni paginación

  Scenario: botón del portal dispara la API
    Given el portal abierto en localhost:3000
    When presiono Descargar COCO
    Then el navegador solicita /export/coco
    And la UI no construye images, annotations, categories, bbox ni area
