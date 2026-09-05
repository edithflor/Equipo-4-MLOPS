Feature: Categoría obligatoria y color en UI
Como anotador
Quiero asignar una clase con color a cada caja
Para no generar COCO inválido

Scenario: el listado muestra color
Given categorías del seeder
When abro el portal de anotación
Then cada categoría se ve con su nombre y color

Scenario: la caja usa el color de su clase
Given una categoría seleccionada
When creo una caja
Then el borde o relleno usa ese color
And al recargar sigue esa clase y color

Scenario: no se puede guardar caja sin clase
Given ninguna categoría seleccionada
When intento dibujar o guardar una caja
Then la UI lo impide o muestra error
And no hay fila nueva en MariaDB

Scenario: el servidor también rechaza
When llamo el API de create bbox sin category_id
Then responde error
And no persiste
