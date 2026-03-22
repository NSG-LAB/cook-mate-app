package com.cookmate.controller;

import com.cookmate.dto.*;
import com.cookmate.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    @GetMapping
    public ResponseEntity<List<RecipeSummaryResponse>> all(@RequestParam(required = false) String region) {
        return ResponseEntity.ok(recipeService.getAll(region));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecipeResponse> byId(@PathVariable Long id) {
        return ResponseEntity.ok(recipeService.getById(id));
    }

    @PostMapping
    public ResponseEntity<RecipeResponse> create(@RequestBody RecipeUpdateRequest request) {
        return ResponseEntity.ok(recipeService.createRecipe(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RecipeResponse> update(@PathVariable Long id, @RequestBody RecipeUpdateRequest request) {
        return ResponseEntity.ok(recipeService.updateRecipe(id, request));
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<List<RecipeVersionResponse>> versions(@PathVariable Long id) {
        return ResponseEntity.ok(recipeService.getVersionHistory(id));
    }

    @GetMapping("/{id}/print")
    public ResponseEntity<RecipePrintResponse> printView(@PathVariable Long id) {
        return ResponseEntity.ok(recipeService.getPrintView(id));
    }

    @GetMapping("/budget")
    public ResponseEntity<List<RecipeSummaryResponse>> byBudget(
            @RequestParam(required = false) Integer budget,
            @RequestParam(required = false) String region,
            @RequestParam(defaultValue = "false") boolean quickOnly
    ) {
        return ResponseEntity.ok(recipeService.getByBudget(budget, region, quickOnly));
    }

    @PostMapping("/fridge-match")
    public ResponseEntity<List<RecipeSummaryResponse>> byFridge(@RequestBody FridgeRequest request) {
        return ResponseEntity.ok(recipeService.getByIngredients(request.getIngredients()));
    }

    @PostMapping("/cook-again")
    public ResponseEntity<List<RecipeSummaryResponse>> cookAgain(@RequestBody GroceryRequest request) {
        return ResponseEntity.ok(recipeService.getCookAgainSuggestions(request.getRecipeIds()));
    }

    @GetMapping("/personalized")
    public ResponseEntity<List<RecipeSummaryResponse>> personalized(@RequestParam(defaultValue = "12") Integer limit) {
        return ResponseEntity.ok(recipeService.getPersonalizedSuggestions(limit));
    }

    @GetMapping("/seasonal")
    public ResponseEntity<List<RecipeSummaryResponse>> seasonal(@RequestParam(required = false) String season) {
        return ResponseEntity.ok(recipeService.getSeasonalSuggestions(season));
    }

    @GetMapping("/weather")
    public ResponseEntity<List<RecipeSummaryResponse>> weather(@RequestParam(defaultValue = "mild") String type) {
        return ResponseEntity.ok(recipeService.getWeatherSuggestions(type));
    }

    @GetMapping("/occasion")
    public ResponseEntity<List<RecipeSummaryResponse>> occasion(@RequestParam(defaultValue = "everyday") String type) {
        return ResponseEntity.ok(recipeService.getOccasionSuggestions(type));
    }

    @PostMapping("/remix")
    public ResponseEntity<RecipeRemixResponse> remix(@RequestBody RecipeRemixRequest request) {
        return ResponseEntity.ok(recipeService.generateRecipeRemix(request));
    }

    @PostMapping("/grocery-list")
    public ResponseEntity<PagedResponse<String>> grocery(
            @RequestBody GroceryRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        return ResponseEntity.ok(recipeService.generateGroceryListPage(request.getRecipeIds(), page, size));
    }

    @PostMapping("/grocery-list-grouped")
    public ResponseEntity<Map<String, List<String>>> groceryGrouped(@RequestBody GroceryRequest request) {
        return ResponseEntity.ok(recipeService.generateGroceryListByAisle(request.getRecipeIds()));
    }

    @PostMapping("/planned-spend")
    public ResponseEntity<PlannedSpendResponse> plannedSpend(@RequestBody GroceryRequest request) {
        int total = recipeService.plannedSpend(request.getRecipeIds());
        int count = request.getRecipeIds() == null ? 0 : request.getRecipeIds().size();
        return ResponseEntity.ok(new PlannedSpendResponse(total, count));
    }

    @PostMapping("/nutrition-summary")
    public ResponseEntity<NutritionSummaryResponse> nutrition(@RequestBody GroceryRequest request) {
        return ResponseEntity.ok(recipeService.nutritionSummary(request.getRecipeIds()));
    }

    @PostMapping("/nutrition-comparison")
    public ResponseEntity<List<RecipeNutritionComparisonResponse>> nutritionComparison(@RequestBody GroceryRequest request) {
        return ResponseEntity.ok(recipeService.nutritionComparison(request.getRecipeIds()));
    }

    @PostMapping("/health-filter")
    public ResponseEntity<List<RecipeSummaryResponse>> healthFilter(@RequestBody HealthFilterRequest request) {
        return ResponseEntity.ok(recipeService.getByHealthFilters(request));
    }
}
