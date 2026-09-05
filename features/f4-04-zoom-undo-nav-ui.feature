Feature: Zoom, undo y navegación en anotación
  Como anotador
  Quiero ajustar la vista, deshacer acciones y navegar imágenes
  Para anotar varias imágenes sin perder persistencia

  Scenario: zoom no cambia coordenadas persistidas
    Given una imagen seleccionada con cajas existentes
    When aumento o reduzco el zoom
    Then la imagen y sus cajas se escalan visualmente alineadas
    And no se envía actualización de coordenadas al servidor por solo hacer zoom

  Scenario: undo de creación elimina la caja persistida
    Given una imagen y categoría seleccionadas
    And creo una bounding box
    When presiono Undo
    Then la caja desaparece del canvas
    And se elimina mediante DELETE /annotations/:id

  Scenario: undo de movimiento restaura coordenadas
    Given una bounding box existente
    When la muevo y queda persistida
    And presiono Undo
    Then vuelve a su posición anterior
    And esas coordenadas anteriores se persisten mediante PUT /annotations/:id

  Scenario: navegación carga anotaciones por imagen
    Given hay más de una imagen cargada
    When uso Anterior o Siguiente
    Then el portal cambia la imagen seleccionada
    And carga sus cajas con GET /annotations/image/:imageId

  Scenario: guardar y siguiente avanza sin duplicar guardados
    Given una imagen seleccionada con anotaciones ya persistidas
    When presiono Guardar y siguiente
    Then no crea una caja nueva
    And abre la siguiente imagen disponible

  Scenario: última imagen muestra mensaje claro
    Given estoy en la última imagen
    When presiono Siguiente o Guardar y siguiente
    Then sigo en la misma imagen
    And veo un mensaje indicando que ya estoy en la última imagen
