Feature: Secciones COCO e IDs
  Como consumidor del dataset
  Quiero que el exporter produzca secciones COCO con IDs coherentes
  Para poder validar referencias antes de exportar geometría completa

  Scenario: dataset normal contiene tres secciones
    Given imágenes, categorías y bboxes persistidas
    When exporto el dataset COCO
    Then contiene images, annotations y categories

  Scenario: imágenes conservan IDs y file_name
    Given una imagen persistida con ID y filename conocidos
    When exporto el dataset COCO
    Then la imagen COCO usa el mismo id
    And file_name coincide con el filename persistido

  Scenario: categorías conservan IDs y nombres
    Given categorías persistidas
    When exporto el dataset COCO
    Then cada categoría conserva su id
    And cada categoría conserva su name

  Scenario: anotaciones referencian IDs existentes
    Given una bbox persistida para una imagen y categoría existentes
    When exporto el dataset COCO
    Then annotation.image_id existe en images
    And annotation.category_id existe en categories

  Scenario: dataset vacío es válido
    Given no hay imágenes, anotaciones ni categorías
    When exporto el dataset COCO
    Then images, annotations y categories son arreglos vacíos
