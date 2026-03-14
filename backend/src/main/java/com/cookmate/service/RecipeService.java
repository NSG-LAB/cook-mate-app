package com.cookmate.service;

import com.cookmate.dto.NutritionSummaryResponse;
import com.cookmate.dto.RecipeResponse;
import com.cookmate.entity.Recipe;
import com.cookmate.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;

    public List<RecipeResponse> getAll(String region) {
        List<Recipe> recipes = (region == null || region.isBlank())
                ? recipeRepository.findAll()
                : recipeRepository.findByRegionIgnoreCase(region);
        return recipes.stream().map(recipe -> toResponse(recipe, null)).toList();
    }

    public List<RecipeResponse> getByBudget(Integer budget, String region, boolean quickOnly) {
        return getAll(region).stream()
                .filter(r -> budget == null || r.getEstimatedCost() <= budget)
                .filter(r -> !quickOnly || r.getCookTimeMinutes() <= 15)
                .sorted(Comparator.comparingInt(RecipeResponse::getEstimatedCost))
                .toList();
    }

    public List<RecipeResponse> getByIngredients(List<String> ingredients) {
        Set<String> lower = ingredients == null ? Set.of() : ingredients.stream()
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        return recipeRepository.findAll().stream()
                .map(recipe -> toResponse(recipe, lower))
                .filter(r -> r.getIngredientMatchPercent() != null && r.getIngredientMatchPercent() > 0)
                .sorted(Comparator.comparingInt(RecipeResponse::getIngredientMatchPercent).reversed())
                .toList();
    }

    public List<String> generateGroceryList(List<Long> recipeIds) {
        if (recipeIds == null || recipeIds.isEmpty()) {
            return List.of();
        }

        return recipeRepository.findAllById(recipeIds)
                .stream()
                .flatMap(recipe -> recipe.getIngredients().stream())
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toCollection(TreeSet::new))
                .stream()
                .toList();
    }

    public NutritionSummaryResponse nutritionSummary(List<Long> recipeIds) {
        List<Recipe> recipes = recipeIds == null || recipeIds.isEmpty()
                ? List.of()
                : recipeRepository.findAllById(recipeIds);

        int total = recipes.stream().mapToInt(Recipe::getCalories).sum();
        int count = recipes.size();
        double avg = count == 0 ? 0 : (double) total / count;
        return new NutritionSummaryResponse(total, count, avg);
    }

    public RecipeResponse getById(Long id) {
        Recipe recipe = recipeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NoSuchElementException("Recipe not found"));
        return toResponse(recipe, null);
    }

    private RecipeResponse toResponse(Recipe recipe, Set<String> fridgeIngredients) {
        Integer matchPercent = null;
        if (fridgeIngredients != null && !recipe.getIngredients().isEmpty()) {
            long matched = recipe.getIngredients().stream()
                    .map(String::toLowerCase)
                    .filter(fridgeIngredients::contains)
                    .count();
            matchPercent = (int) Math.round((matched * 100.0) / recipe.getIngredients().size());
        }

        return RecipeResponse.builder()
                .id(recipe.getId())
                .title(recipe.getTitle())
                .region(recipe.getRegion())
                .cookTimeMinutes(recipe.getCookTimeMinutes())
                .estimatedCost(recipe.getEstimatedCost())
                .calories(recipe.getCalories())
                .imageUrl(recipe.getImageUrl())
                .videoUrl(recipe.getVideoUrl())
                .ingredients(recipe.getIngredients())
                .steps(recipe.getSteps())
                .ingredientMatchPercent(matchPercent)
                .build();
    }
}
