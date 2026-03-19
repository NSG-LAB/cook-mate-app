package com.cookmate.dto;

import lombok.Data;

import java.util.List;

@Data
public class RecipeUpdateRequest {
    private String title;
    private String region;
    private Integer prepTimeMinutes;
    private Integer cookTimeMinutes;
    private String difficulty;
    private Integer estimatedCost;
    private Integer calories;
    private String imageUrl;
    private String videoUrl;
    private List<String> ingredients;
    private List<String> substitutionSuggestions;
    private List<String> steps;
    private List<Integer> stepVideoTimestampsSeconds;
    private String updatedBy;
}
