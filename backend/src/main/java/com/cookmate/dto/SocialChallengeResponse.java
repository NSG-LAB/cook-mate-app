package com.cookmate.dto;

import java.time.LocalDate;

public class SocialChallengeResponse {
    private Long challengeId;
    private String title;
    private String description;
    private LocalDate weekStartDate;
    private LocalDate weekEndDate;
    private Long featuredRecipeId;
    private String featuredRecipeTitle;
    private String featuredRecipeImage;
    private boolean participated;

    public SocialChallengeResponse() {}

    public SocialChallengeResponse(Long challengeId, String title, String description, LocalDate weekStartDate, LocalDate weekEndDate, Long featuredRecipeId, String featuredRecipeTitle, String featuredRecipeImage, boolean participated) {
        this.challengeId = challengeId;
        this.title = title;
        this.description = description;
        this.weekStartDate = weekStartDate;
        this.weekEndDate = weekEndDate;
        this.featuredRecipeId = featuredRecipeId;
        this.featuredRecipeTitle = featuredRecipeTitle;
        this.featuredRecipeImage = featuredRecipeImage;
        this.participated = participated;
    }

    public Long getChallengeId() { return challengeId; }
    public void setChallengeId(Long challengeId) { this.challengeId = challengeId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getWeekStartDate() { return weekStartDate; }
    public void setWeekStartDate(LocalDate weekStartDate) { this.weekStartDate = weekStartDate; }

    public LocalDate getWeekEndDate() { return weekEndDate; }
    public void setWeekEndDate(LocalDate weekEndDate) { this.weekEndDate = weekEndDate; }

    public Long getFeaturedRecipeId() { return featuredRecipeId; }
    public void setFeaturedRecipeId(Long featuredRecipeId) { this.featuredRecipeId = featuredRecipeId; }

    public String getFeaturedRecipeTitle() { return featuredRecipeTitle; }
    public void setFeaturedRecipeTitle(String featuredRecipeTitle) { this.featuredRecipeTitle = featuredRecipeTitle; }

    public String getFeaturedRecipeImage() { return featuredRecipeImage; }
    public void setFeaturedRecipeImage(String featuredRecipeImage) { this.featuredRecipeImage = featuredRecipeImage; }

    public boolean isParticipated() { return participated; }
    public void setParticipated(boolean participated) { this.participated = participated; }
}
