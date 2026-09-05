Feature: Ensayo de entrega
  Como evaluador
  Quiero clonar el repositorio, seguir el README y levantar el portal con un comando
  Para comprobar que la entrega funciona sin pasos manuales improvisados

  Scenario: README basta
    Given clone fresco y volúmenes borrados
    When sigo README literalmente
    Then app responde 200 en localhost:3000
    And migraciones y seeder corren automáticamente
    And no ejecuto SQL manual

  Scenario: seeder idempotente
    Given stack levantado
    When ejecuto seed otra vez
    Then no duplica categorías ni imágenes
    And termina 0

  Scenario: puertos
    Then local = 3000
    And production = 3100
    And bind real local = 3000

  Scenario: env
    Then .env.example tracked
    And .env NO tracked

  Scenario: un comando
    Then README tiene un comando oficial de up
    And no pide recordar múltiples servicios
