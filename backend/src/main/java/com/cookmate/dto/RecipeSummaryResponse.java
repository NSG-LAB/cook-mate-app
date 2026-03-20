package com.cookmate.dto;

import lombok.Builder;
import lombok.Value;

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
    String imageUrl;
    Integer ingredientMatchPercent;
}
