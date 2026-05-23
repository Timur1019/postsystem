# ============================================================
#  Multi-stage Dockerfile — Spring Boot Backend
#  (deb-based images: работает на Apple Silicon без alpine manifest)
# ============================================================

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -q

COPY src ./src
RUN mvn clean package -DskipTests -q

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && groupadd -r pos && useradd -r -g pos pos \
  && mkdir -p /app/uploads/orders /app/logs \
  && chown -R pos:pos /app/uploads /app/logs \
  && rm -rf /var/lib/apt/lists/*

USER pos

COPY --from=build /app/target/*.jar app.jar

ENV ORDERS_UPLOAD_DIR=/app/uploads/orders \
    LOG_PATH=/app/logs

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
