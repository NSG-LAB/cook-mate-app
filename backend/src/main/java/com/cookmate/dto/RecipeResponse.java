package com.cookmate.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class RecipeResponse {
    private Long id;
    private String title;
    private String region;
    private Integer prepTimeMinutes;
    private Integer cookTimeMinutes;
    private String difficulty;
    private Integer totalTimeMinutes;
    private Integer estimatedCost;
    private Integer calories;
    private String imageUrl;
    private String videoUrl;
    private List<String> ingredients;
    private List<String> substitutionSuggestions;
    private List<String> steps;
    private List<VideoStepLinkResponse> videoStepLinks;
    private Integer versionNumber;
    private Integer ingredientMatchPercent;
}
