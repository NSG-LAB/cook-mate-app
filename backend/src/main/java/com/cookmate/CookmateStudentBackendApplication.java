package com.cookmate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class CookmateStudentBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(CookmateStudentBackendApplication.class, args);
    }
}
