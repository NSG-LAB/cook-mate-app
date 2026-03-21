package com.cookmate.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class RecipeNutritionComparisonResponse {
    Long id;
    String title;
    Integer calories;
    Integer proteinGrams;
    Integer carbsGrams;
    Integer fatGrams;
}
