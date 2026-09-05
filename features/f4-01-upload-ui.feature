Feature: Upload en el portal con feedback
Como anotador
Quiero subir una imagen y ver si pasó o por qué falló
Para no quedarme sin mensaje

Scenario: upload válido se ve en el portal
Given el portal abierto en :3000
And estoy autenticado o en el flujo local del proyecto
When subo un JPEG/PNG dentro del tamaño máximo
Then veo confirmación de éxito
And la imagen se muestra para anotar
And recargar la página sigue mostrando esa imagen en la lista o el visor

Scenario: tipo inválido muestra error al usuario
When subo un .txt o un mime no permitido
Then veo un mensaje de tipo inválido en la UI
And no se agrega la imagen al visor
And no quedó objeto nuevo en MinIO ni fila nueva

Scenario: tamaño excedido muestra error al usuario
When subo un archivo de mime válido más grande que el máximo
Then veo un mensaje de tamaño excedido en la UI
And no persiste

Scenario: quitar el accept del input no salta la validación
Given un archivo inválido enviado igual al endpoint de upload
Then el servidor rechaza
And la UI muestra el error del servidor
