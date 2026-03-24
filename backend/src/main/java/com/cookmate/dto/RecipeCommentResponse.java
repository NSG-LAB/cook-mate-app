package com.cookmate.dto;

import java.time.LocalDateTime;

public class RecipeCommentResponse {
    private Long id;
    private Long recipeId;
    private Long userId;
    private String userName;
    private String comment;
    private Integer rating;
    private LocalDateTime createdAt;

    public RecipeCommentResponse() {}

    public RecipeCommentResponse(Long id, Long recipeId, Long userId, String userName, String comment, Integer rating, LocalDateTime createdAt) {
        this.id = id;
        this.recipeId = recipeId;
        this.userId = userId;
        this.userName = userName;
        this.comment = comment;
        this.rating = rating;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getRecipeId() { return recipeId; }
    public void setRecipeId(Long recipeId) { this.recipeId = recipeId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
