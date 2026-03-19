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
    public ResponseEntity<List<RecipeResponse>> all(@RequestParam(required = false) String region) {
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
    public ResponseEntity<List<RecipeResponse>> byBudget(
            @RequestParam(required = false) Integer budget,
            @RequestParam(required = false) String region,
            @RequestParam(defaultValue = "false") boolean quickOnly
    ) {
        return ResponseEntity.ok(recipeService.getByBudget(budget, region, quickOnly));
    }

    @PostMapping("/fridge-match")
    public ResponseEntity<List<RecipeResponse>> byFridge(@RequestBody FridgeRequest request) {
        return ResponseEntity.ok(recipeService.getByIngredients(request.getIngredients()));
    }

    @PostMapping("/cook-again")
    public ResponseEntity<List<RecipeResponse>> cookAgain(@RequestBody GroceryRequest request) {
        return ResponseEntity.ok(recipeService.getCookAgainSuggestions(request.getRecipeIds()));
    }

    @GetMapping("/seasonal")
    public ResponseEntity<List<RecipeResponse>> seasonal(@RequestParam(required = false) String season) {
        return ResponseEntity.ok(recipeService.getSeasonalSuggestions(season));
    }

    @GetMapping("/weather")
    public ResponseEntity<List<RecipeResponse>> weather(@RequestParam(defaultValue = "mild") String type) {
        return ResponseEntity.ok(recipeService.getWeatherSuggestions(type));
    }

    @GetMapping("/occasion")
    public ResponseEntity<List<RecipeResponse>> occasion(@RequestParam(defaultValue = "everyday") String type) {
        return ResponseEntity.ok(recipeService.getOccasionSuggestions(type));
    }

    @PostMapping("/remix")
    public ResponseEntity<RecipeRemixResponse> remix(@RequestBody RecipeRemixRequest request) {
        return ResponseEntity.ok(recipeService.generateRecipeRemix(request));
    }

    @PostMapping("/grocery-list")
    public ResponseEntity<Map<String, List<String>>> grocery(@RequestBody GroceryRequest request) {
        List<String> items = recipeService.generateGroceryList(request.getRecipeIds());
        return ResponseEntity.ok(Map.of("items", items));
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
}
