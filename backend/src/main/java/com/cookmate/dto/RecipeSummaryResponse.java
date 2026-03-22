package com.cookmate.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class RecipeSummaryResponse {
    Long id;
    String title;
    String region;
    Integer prepTimeMinutes;
    Integer cookTimeMinutes;
    Integer totalTimeMinutes;
    String difficulty;
    Integer estimatedCost;
    Integer calories;
    Integer proteinGrams;
    Integer carbsGrams;
    Integer fatGrams;
    String imageUrl;
    List<String> allergens;
    List<String> dietaryTags;
    Integer ingredientMatchPercent;
    String recommendationReason;
}
