# 🏦 Homework 1: Hello World Java API

> **Student Name**: [Your Name]
> **Date Submitted**: [Date]
> **AI Tools Used**: Claude Code

---

## 📋 Project Overview

This is a simple Java Spring Boot application that implements a REST API with a GET endpoint returning "Hello World". The application demonstrates the basics of setting up a Spring Boot project with Maven and creating a simple REST controller.

## ✨ Features

- Simple GET endpoint at `/hello` that returns "Hello World"
- Built with Spring Boot 3.2.1
- Uses Java 17
- Maven-based project structure
- Configurable server port (default: 8080)

## 🏗️ Architecture

The application follows a simple Spring Boot structure:

```
src/
├── main/
│   ├── java/com/homework/helloworld/
│   │   ├── Application.java              # Main Spring Boot application class
│   │   └── controller/
│   │       └── HelloWorldController.java # REST controller with GET endpoint
│   └── resources/
│       └── application.properties        # Application configuration
```

## 🚀 Technology Stack

- **Java 17**: Programming language
- **Spring Boot 3.2.1**: Framework for building the REST API
- **Maven**: Build tool and dependency management

## 📝 API Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/hello` | Returns a simple greeting | `Hello World` |

## 🧪 Testing the API

### Example Request:
```bash
curl http://localhost:8080/hello
```

### Expected Response:
```
Hello World
```

## 📦 Project Structure

```
homework-1/
├── pom.xml                              # Maven configuration
├── .gitignore                           # Git ignore rules
├── README.md                            # This file
├── HOWTORUN.md                          # Detailed run instructions
└── src/
    └── main/
        ├── java/com/homework/helloworld/
        │   ├── Application.java
        │   └── controller/
        │       └── HelloWorldController.java
        └── resources/
            └── application.properties
```

## 🤖 AI Tools Usage

This project was developed with assistance from **Claude Code**. The AI helped with:
- Setting up the Maven project structure
- Creating the Spring Boot application configuration
- Implementing the REST controller with proper annotations
- Writing comprehensive documentation

<div align="center">

*This project was completed as part of the AI-Assisted Development course.*

</div>
