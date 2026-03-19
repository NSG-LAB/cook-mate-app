package com.cookmate.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class RecipeRemixResponse {
    private String title;
    private String baseRecipeTitle;
    private String summary;
    private List<String> generatedSteps;
}
