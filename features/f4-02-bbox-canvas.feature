Feature: Canvas de bounding boxes persistente
Como anotador
Quiero crear y editar bounding boxes
Para que mis anotaciones permanezcan guardadas

Scenario: crear una caja
Given una imagen seleccionada
And una categoría seleccionada
When dibujo una bounding box sobre la imagen
Then la caja aparece en el canvas
And se persiste mediante POST /annotations

Scenario: mover una caja
Given una bounding box existente
When la arrastro a otra posición
Then cambia su posición
And las nuevas coordenadas se persisten

Scenario: redimensionar una caja
Given una bounding box existente
When modifico su tamaño
Then width y height cambian
And la nueva geometría se persiste

Scenario: eliminar una caja
Given una bounding box existente
When la elimino
Then desaparece del canvas
And se elimina de MariaDB mediante DELETE /annotations/:id

Scenario: persistencia después de recargar
Given bounding boxes guardadas
When recargo la página
Then aparecen las mismas cajas
And mantienen posición, tamaño y categoría
