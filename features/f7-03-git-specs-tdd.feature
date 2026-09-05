Feature: Git, SPECs, TDD y trazabilidad
  Como equipo de entrega
  Quiero auditar ramas, archivos versionados, trazabilidad y mutaciones criticas
  Para demostrar evidencia real sin reescribir historial ni fabricar TDD

  Scenario: main default y estable
    Given origin default = main
    When reviso la evidencia de entrega
    Then main pasa typecheck
    And main pasa arranque F7-02

  Scenario: gitignore
    When audito archivos tracked
    Then no contiene node_modules
    And no contiene .env
    And no contiene .png
    And no contiene .jpg
    And no contiene .jpeg

  Scenario: participacion
    When ejecuto git shortlog -sne --all
    Then Mau tiene al menos un commit
    And Heri tiene al menos un commit
    And Bryan tiene al menos un commit

  Scenario: INDEX
    Given las reglas upload, bbox sin clase, COCO bbox y busqueda AND SQL
    When reviso specs/INDEX.md
    Then cada regla tiene SPEC
    And cada regla tiene feature
    And cada regla tiene test

  Scenario: mutacion anotacion
    Given permito temporalmente bbox sin categoria
    When ejecuto el test relevante
    Then la suite falla
    And restauro el codigo

  Scenario: mutacion COCO
    Given invierto width y height temporalmente solo en export
    When ejecuto la suite COCO
    Then la suite falla
    And restauro el codigo
