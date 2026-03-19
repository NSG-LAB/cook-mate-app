package com.cookmate.dto;

import lombok.Data;

import java.util.List;

@Data
public class RecipeRemixRequest {
    private Long baseRecipeId;
    private List<String> ingredients;
}
