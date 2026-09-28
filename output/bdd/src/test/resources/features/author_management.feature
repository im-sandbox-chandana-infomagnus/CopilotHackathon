Feature: Author management
  As a user
  I want to manage authors through the REST API
  So that author details remain current

  Background:
    Given the author store is empty

  Scenario: Create an author
    When I create an author named "Jane Austen"
    Then the response status should be 200
    And the response should contain an author named "Jane Austen"

  Scenario: Retrieve all authors
    Given an author named "George Orwell" exists
    And an author named "Virginia Woolf" exists
    When I request all authors
    Then the response status should be 200
    And the response should contain 2 authors
    And the response should contain an author named "George Orwell"
    And the response should contain an author named "Virginia Woolf"

  Scenario: Retrieve an author by id
    Given an author named "Toni Morrison" exists
    When I request that author
    Then the response status should be 200
    And the response should contain an author named "Toni Morrison"

  Scenario: Update an author
    Given an author named "Samuel Clemens" exists
    When I update that author name to "Mark Twain"
    Then the response status should be 200
    And the response should contain an author named "Mark Twain"

  Scenario: Delete an author
    Given an author named "Mary Shelley" exists
    When I delete that author
    Then the response status should be 200
    When I request that author
    Then the response status should be 404

  Scenario: Return not found for an unknown author
    When I request author id 999999
    Then the response status should be 404