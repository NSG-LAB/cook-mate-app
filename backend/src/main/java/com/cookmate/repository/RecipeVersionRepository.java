package com.cookmate.repository;

import com.cookmate.entity.RecipeVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecipeVersionRepository extends JpaRepository<RecipeVersion, Long> {
    List<RecipeVersion> findByRecipeIdOrderByVersionNumberDesc(Long recipeId);
}
