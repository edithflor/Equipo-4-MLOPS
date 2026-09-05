Feature: Geometría COCO
  Como consumidor del dataset
  Quiero bbox, area e iscrowd correctos
  Para que las anotaciones exportadas sean compatibles con COCO

  Scenario: bbox usa píxeles absolutos persistidos
    Given la BD contiene x 10, y 20, width 30 y height 40
    When exporto el dataset COCO
    Then bbox es exactamente [10, 20, 30, 40]
    And bbox no es [10, 20, 40, 60]
    And bbox no está normalizado contra el tamaño de imagen

  Scenario: area es width por height
    Given una bbox con width 30 y height 40
    When exporto el dataset COCO
    Then area es 1200

  Scenario: iscrowd existe con default cero
    Given una anotación normal del portal
    When exporto el dataset COCO
    Then iscrowd está presente
    And iscrowd es 0

  Scenario: mutaciones de geometría fallan
    Given un exporter mutado
    When usa x + width, y + height, bbox normalizado, width y height intercambiados o sin iscrowd
    Then la suite de contrato COCO falla
