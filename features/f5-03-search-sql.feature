Feature: Búsqueda AND en SQL
  Como anotador
  Quiero imágenes que contengan todas las clases pedidas
  Sin cargar el dataset a memoria

  Scenario: car AND person
    Given una imagen con bbox de "car" y de "person"
    And una imagen solo con "car"
    And una imagen solo con "person"
    When busco "car AND person"
    Then solo regresa la imagen que tiene ambas clases

  Scenario: una sola clase
    When busco "car"
    Then regresan las imágenes que tienen al menos un bbox de car

  Scenario: no hay match
    When busco "car AND clase-inexistente"
    Then el resultado es vacío
    And el total es 0

  Scenario: la consulta es SQL no memoria
    Given el código del buscador
    Then Drizzle/SQL incluye WHERE, HAVING, EXISTS o subqueries por clase
    And no hay findMany de todas las imágenes seguido de filter en JS

  Scenario: input validado con Zod
    When envío un query malformado
    Then se rechaza con error de validación
    And no se ejecuta SQL inseguro concatenando el string crudo
