#use an official lightweght OpenJDk runtime as a parent image
FROM eclipse-temurin:17-jdk

#set the working directory inide the container
WORKDIR / app

RUN apt-get update && apt-get install -y maven

COPY . .

RUN mun clean package-DskipTests

EXPOSE 8080

CMD["sh","-c","java-jar target/*.jar"]