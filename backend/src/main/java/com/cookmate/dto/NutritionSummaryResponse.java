package com.cookmate.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class NutritionSummaryResponse {
    private int totalCalories;
    private int recipeCount;
    private double avgCalories;
}
