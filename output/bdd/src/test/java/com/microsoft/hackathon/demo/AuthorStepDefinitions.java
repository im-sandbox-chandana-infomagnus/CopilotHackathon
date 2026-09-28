package com.microsoft.hackathon.demo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.microsoft.hackathon.demo.model.Author;
import com.microsoft.hackathon.demo.repository.AuthorRepository;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class AuthorStepDefinitions {

    @Autowired
    private AuthorRepository authorRepository;

    @Autowired
    private TestRestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private ResponseEntity<String> response;
    private Long currentAuthorId;

    @Before
    public void clearAuthors() {
        authorRepository.deleteAll();
        response = null;
        currentAuthorId = null;
    }

    @Given("the author store is empty")
    public void theAuthorStoreIsEmpty() {
        assertTrue(authorRepository.findAll().isEmpty());
    }

    @Given("an author named {string} exists")
    public void anAuthorNamedExists(String name) {
        Author author = restTemplate.postForObject("/authors", new Author(name), Author.class);
        currentAuthorId = author.getId();
    }

    @When("I create an author named {string}")
    public void iCreateAnAuthorNamed(String name) {
        response = restTemplate.postForEntity("/authors", new Author(name), String.class);
    }

    @When("I request all authors")
    public void iRequestAllAuthors() {
        response = restTemplate.getForEntity("/authors", String.class);
    }

    @When("I request that author")
    public void iRequestThatAuthor() {
        response = restTemplate.getForEntity("/authors/{id}", String.class, currentAuthorId);
    }

    @When("I request author id {long}")
    public void iRequestAuthorId(Long id) {
        response = restTemplate.getForEntity("/authors/{id}", String.class, id);
    }

    @When("I update that author name to {string}")
    public void iUpdateThatAuthorNameTo(String name) {
        response = restTemplate.exchange(
                "/authors/{id}",
                HttpMethod.PUT,
                new HttpEntity<>(new Author(name)),
                String.class,
                currentAuthorId);
    }

    @When("I delete that author")
    public void iDeleteThatAuthor() {
        response = restTemplate.exchange(
                "/authors/{id}", HttpMethod.DELETE, HttpEntity.EMPTY, String.class, currentAuthorId);
    }

    @Then("the response status should be {int}")
    public void theResponseStatusShouldBe(int status) {
        assertEquals(status, response.getStatusCode().value());
    }

    @Then("the response should contain an author named {string}")
    public void theResponseShouldContainAnAuthorNamed(String name) throws IOException {
        JsonNode body = objectMapper.readTree(response.getBody());
        if (body.isArray()) {
            assertTrue(containsName(body, name));
        } else {
            assertEquals(name, body.get("name").asText());
        }
    }

    @Then("the response should contain {int} authors")
    public void theResponseShouldContainAuthors(int count) throws IOException {
        assertEquals(count, objectMapper.readTree(response.getBody()).size());
    }

    private boolean containsName(JsonNode authors, String expectedName) {
        for (JsonNode author : authors) {
            if (expectedName.equals(author.get("name").asText())) {
                return true;
            }
        }
        return false;
    }
}