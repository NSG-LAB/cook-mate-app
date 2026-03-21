package com.cookmate.repository;

import com.cookmate.entity.Recipe;
import com.cookmate.entity.RecipeComment;
import com.cookmate.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecipeCommentRepository extends JpaRepository<RecipeComment, Long> {
    List<RecipeComment> findByRecipeOrderByCreatedAtDesc(Recipe recipe);
    Page<RecipeComment> findByRecipe(Recipe recipe, Pageable pageable);
    List<RecipeComment> findByRecipeAndIdLessThanOrderByIdDesc(Recipe recipe, Long cursor, Pageable pageable);
    long countByRecipe(Recipe recipe);
    long countByUser(User user);
    List<RecipeComment> findTop10ByUserOrderByCreatedAtDesc(User user);
}
