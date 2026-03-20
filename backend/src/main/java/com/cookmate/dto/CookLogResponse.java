package com.cookmate.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class CookLogResponse {
    Long id;
    Long recipeId;
    String recipeTitle;
    String recipeImage;
    LocalDateTime cookedAt;
    Integer minutesSpent;
    Integer rating;
    String moodTag;
    String notes;
    Boolean usedTimer;
    Integer completedSteps;
    Integer totalSteps;
    Integer completionPercent;
}
