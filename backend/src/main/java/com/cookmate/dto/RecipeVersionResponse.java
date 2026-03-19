package com.cookmate.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RecipeVersionResponse {
    private Integer versionNumber;
    private String title;
    private String difficulty;
    private Integer prepTimeMinutes;
    private Integer cookTimeMinutes;
    private String updatedBy;
    private LocalDateTime updatedAt;
}
