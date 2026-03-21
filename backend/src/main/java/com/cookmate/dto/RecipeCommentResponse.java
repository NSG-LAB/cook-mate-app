package com.cookmate.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class RecipeCommentResponse {
    Long id;
    Long recipeId;
    Long userId;
    String userName;
    String comment;
    Integer rating;
    LocalDateTime createdAt;
}
