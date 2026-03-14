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
    private Integer cookTimeMinutes;
    private Integer estimatedCost;
    private Integer calories;
    private String imageUrl;
    private String videoUrl;
    private List<String> ingredients;
    private List<String> steps;
    private Integer ingredientMatchPercent;
}
