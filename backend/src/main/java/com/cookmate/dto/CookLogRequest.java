package com.cookmate.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CookLogRequest {
    private Long recipeId;
    private Integer minutesSpent;
    private Integer rating;
    private String moodTag;
    private String notes;
    private Boolean usedTimer;
    private Integer completedSteps;
    private Integer totalSteps;
    private LocalDateTime cookedAt;
}
