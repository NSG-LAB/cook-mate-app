package com.cookmate.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "cook_log_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CookLogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    @Column(nullable = false)
    private LocalDateTime cookedAt;

    private Integer minutesSpent;

    private Integer rating;

    @Column(length = 50)
    private String moodTag;

    @Column(length = 1000)
    private String notes;

    private Boolean usedTimer;

    private Integer completedSteps;

    private Integer totalSteps;

    @Column(nullable = false)
    private String recipeTitleSnapshot;

    private String recipeImageSnapshot;
}
