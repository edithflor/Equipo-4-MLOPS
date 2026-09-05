Feature: Contrato COCO
  Como equipo de anotación
  Quiero definir el JSON COCO esperado
  Para que el exporter posterior tenga una suite de contrato en RED antes de implementarse

  Scenario: JSON parseable con secciones COCO
    Given un fixture controlado con una imagen, una categoría y una anotación
    When exporto el dataset a JSON COCO
    Then el JSON es parseable
    And contiene images, annotations y categories

  Scenario: referencias de anotación existen
    Given un dataset COCO exportado desde el fixture controlado
    Then cada annotation.image_id existe en images[].id
    And cada annotation.category_id existe en categories[].id

  Scenario: ids únicos por colección
    Given un dataset COCO exportado desde el fixture controlado
    Then images tiene ids únicos
    And annotations tiene ids únicos
    And categories tiene ids únicos

  Scenario: bbox usa width y height absolutos
    Given una anotación con x 10, y 20, width 30 y height 40
    When exporto el dataset a JSON COCO
    Then bbox es [10, 20, 30, 40]
    And bbox no es [10, 20, 40, 60]
    And bbox no está normalizado entre 0 y 1

  Scenario: area e iscrowd cumplen COCO
    Given una anotación con width 30 y height 40
    When exporto el dataset a JSON COCO
    Then area es aproximadamente 1200
    And iscrowd está presente
    And iscrowd es 0 o 1

  Scenario: mutación de geometría rompe contrato
    Given un exporter mutado que usa [x1, y1, x2, y2]
    When la suite valida el contrato COCO
    Then la suite falla
