package com.cookmate.repository;

import com.cookmate.entity.Recipe;
import com.cookmate.entity.RecipeModerationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findByRegionIgnoreCase(String region);
    List<Recipe> findByModerationStatus(RecipeModerationStatus status);
    List<Recipe> findByRegionIgnoreCaseAndModerationStatus(String region, RecipeModerationStatus status);
    List<Recipe> findByModerationStatusOrderByIdAsc(RecipeModerationStatus status);

    Page<Recipe> findByModerationStatus(RecipeModerationStatus status, Pageable pageable);

    @Query("""
        SELECT r FROM Recipe r
        WHERE r.moderationStatus = :status
        AND (:region IS NULL OR LOWER(r.region) = LOWER(:region))
        AND (:budget IS NULL OR r.estimatedCost <= :budget)
        AND (:maxCookTime IS NULL OR r.cookTimeMinutes <= :maxCookTime)
        """)
    List<Recipe> searchPublishedRecipes(
            @Param("region") String region,
            @Param("budget") Integer budget,
            @Param("maxCookTime") Integer maxCookTime,
            @Param("status") RecipeModerationStatus status,
            Pageable pageable
    );

    @Query("""
        SELECT DISTINCT r FROM Recipe r
        JOIN r.ingredients ingredient
        WHERE r.moderationStatus = :status
        AND LOWER(ingredient) IN :ingredients
        """)
    List<Recipe> findPublishedByIngredients(
            @Param("ingredients") Collection<String> ingredients,
            @Param("status") RecipeModerationStatus status,
            Pageable pageable
    );
}
