package com.cookmate.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "recipes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String region;

    private Integer prepTimeMinutes;

    @Column(nullable = false)
    private Integer cookTimeMinutes;

    private String difficulty;

    @Column(nullable = false)
    private Integer estimatedCost;

    @Column(nullable = false)
    private Integer calories;

    @Column(nullable = false)
    private String imageUrl;

    @Column(nullable = false)
    private String videoUrl;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "recipe_ingredients", joinColumns = @JoinColumn(name = "recipe_id"))
    @Column(name = "ingredient")
    private List<String> ingredients;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "recipe_substitutions", joinColumns = @JoinColumn(name = "recipe_id"))
    @Column(name = "substitution_text", length = 500)
    private List<String> substitutionSuggestions;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "recipe_steps", joinColumns = @JoinColumn(name = "recipe_id"))
    @Column(name = "step_text", length = 1000)
    private List<String> steps;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "recipe_step_timestamps", joinColumns = @JoinColumn(name = "recipe_id"))
    @Column(name = "timestamp_seconds")
    private List<Integer> stepVideoTimestampsSeconds;

    private Integer versionNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RecipeModerationStatus moderationStatus = RecipeModerationStatus.PUBLISHED;

    @Column(nullable = false)
    @Builder.Default
    private boolean communitySubmitted = false;

    private String submittedBy;

    @Column(length = 1000)
    private String moderationNotes;

    private String moderationDecisionBy;

    private LocalDateTime moderationDecisionAt;
}
