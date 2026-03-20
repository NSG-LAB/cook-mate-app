package com.cookmate.repository;

import com.cookmate.entity.Recipe;
import com.cookmate.entity.RecipeModerationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findByRegionIgnoreCase(String region);
    List<Recipe> findByModerationStatus(RecipeModerationStatus status);
    List<Recipe> findByRegionIgnoreCaseAndModerationStatus(String region, RecipeModerationStatus status);
    List<Recipe> findByModerationStatusOrderByIdAsc(RecipeModerationStatus status);
}
