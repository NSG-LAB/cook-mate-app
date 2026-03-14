package com.cookmate.dto;

import lombok.Data;

import java.util.List;

@Data
public class GroceryRequest {
    private List<Long> recipeIds;
}
