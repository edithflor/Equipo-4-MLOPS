Feature: Application health
  The service exposes a health response so deployment checks can confirm it is alive.

  Scenario: Request health status in the test environment
    Given the application environment is "test"
    When the health response is generated
    Then the response status should be "ok"
    And the response name should be "equipo-4-mlops"
    And the response environment should be "test"
