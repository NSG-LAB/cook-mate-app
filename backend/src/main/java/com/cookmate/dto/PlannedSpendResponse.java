package com.cookmate.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PlannedSpendResponse {
    private int totalEstimatedCost;
    private int recipeCount;
}
