package com.cookmate.dto;

public class RecipeCommentRequest {
    private String comment;
    private Integer rating;

    public RecipeCommentRequest() {}

    public RecipeCommentRequest(String comment, Integer rating) {
        this.comment = comment;
        this.rating = rating;
    }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
}
