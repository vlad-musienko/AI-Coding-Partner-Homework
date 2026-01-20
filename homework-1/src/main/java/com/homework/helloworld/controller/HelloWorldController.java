package com.homework.helloworld.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller that handles Hello World endpoint
 */
@RestController
public class HelloWorldController {

    /**
     * Simple GET endpoint that returns "Hello World"
     *
     * @return String "Hello World"
     */
    @GetMapping("/hello")
    public String hello() {
        return "Hello World";
    }
}
