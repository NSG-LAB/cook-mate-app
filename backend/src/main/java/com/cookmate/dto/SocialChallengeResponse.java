package com.cookmate.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;

@Value
@Builder
public class SocialChallengeResponse {
    Long challengeId;
    String title;
    String description;
    LocalDate weekStartDate;
    LocalDate weekEndDate;
    Long featuredRecipeId;
    String featuredRecipeTitle;
    String featuredRecipeImage;
    boolean participated;
}
