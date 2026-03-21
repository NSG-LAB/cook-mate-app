package com.cookmate.dto;

import com.cookmate.entity.RecipeModerationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class RecipeResponse {
    private Long id;
    private String title;
    private String region;
    private Integer prepTimeMinutes;
    private Integer cookTimeMinutes;
    private String difficulty;
    private Integer totalTimeMinutes;
    private Integer estimatedCost;
    private Integer calories;
    private Integer proteinGrams;
    private Integer carbsGrams;
    private Integer fatGrams;
    private String imageUrl;
    private String videoUrl;
    private List<String> ingredients;
    private List<String> substitutionSuggestions;
    private List<String> allergens;
    private List<String> dietaryTags;
    private List<String> steps;
    private List<VideoStepLinkResponse> videoStepLinks;
    private Integer versionNumber;
    private Integer ingredientMatchPercent;
    private RecipeModerationStatus moderationStatus;
    private Boolean communitySubmitted;
    private String submittedBy;
    private String moderationNotes;
    private String moderationDecisionBy;
    private LocalDateTime moderationDecisionAt;
}
