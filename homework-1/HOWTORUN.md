# ▶️ How to Run the Application

## Prerequisites

Before running this application, ensure you have the following installed:

- **Java Development Kit (JDK) 17 or higher**
  - Check version: `java -version`
  - Download from: https://adoptium.net/
- **Maven 3.6+**
  - Check version: `mvn -version`
  - Download from: https://maven.apache.org/download.cgi

## Running the Application

### Option 1: Using Maven (Recommended)

1. Navigate to the homework-1 directory:
   ```bash
   cd homework-1
   ```

2. Run the application using Maven:
   ```bash
   mvn spring-boot:run
   ```

3. The application will start on port 8080. You should see output like:
   ```
   Started Application in X.XXX seconds
   ```

### Option 2: Building and Running JAR

1. Navigate to the homework-1 directory:
   ```bash
   cd homework-1
   ```

2. Build the application:
   ```bash
   mvn clean package
   ```

3. Run the generated JAR file:
   ```bash
   java -jar target/hello-world-api-1.0.0.jar
   ```

## Testing the Endpoint

Once the application is running, you can test the Hello World endpoint using any of these methods:

### Using curl:
```bash
curl http://localhost:8080/hello
```

### Using a web browser:
Navigate to: http://localhost:8080/hello

### Using Postman or similar tools:
- Method: GET
- URL: http://localhost:8080/hello

### Expected Response:
```
Hello World
```

## Stopping the Application

Press `Ctrl+C` in the terminal where the application is running.

## Troubleshooting

**Port already in use:**
If port 8080 is already in use, you can change it by:
1. Edit `src/main/resources/application.properties`
2. Change `server.port=8080` to another port (e.g., `server.port=8081`)
3. Restart the application

**Build failures:**
- Ensure you have Java 17 or higher installed
- Ensure Maven is properly configured
- Try running `mvn clean install` to refresh dependencies