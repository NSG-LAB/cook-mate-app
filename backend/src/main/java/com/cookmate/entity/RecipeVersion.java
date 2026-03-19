package com.cookmate.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "recipe_versions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long recipeId;

    @Column(nullable = false)
    private Integer versionNumber;

    @Column(nullable = false)
    private String title;

    private String difficulty;

    private Integer prepTimeMinutes;

    private Integer cookTimeMinutes;

    @Column(nullable = false)
    private String updatedBy;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
