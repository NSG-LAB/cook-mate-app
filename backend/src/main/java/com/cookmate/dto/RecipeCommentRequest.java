package com.cookmate.dto;

import lombok.Data;

@Data
public class RecipeCommentRequest {
    private String comment;
    private Integer rating;
}
