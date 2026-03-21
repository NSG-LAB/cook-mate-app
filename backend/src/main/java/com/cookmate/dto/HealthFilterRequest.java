package com.cookmate.dto;

import lombok.Data;

import java.util.List;

@Data
public class HealthFilterRequest {
    private List<String> goals;
    private List<String> dietaryTags;
    private List<String> excludedAllergens;
    private Integer maxCalories;
    private Integer minProteinGrams;
}
