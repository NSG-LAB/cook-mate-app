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

    @PostMapping("/grocery-list")
    public ResponseEntity<Map<String, List<String>>> grocery(@RequestBody GroceryRequest request) {
        List<String> items = recipeService.generateGroceryList(request.getRecipeIds());
        return ResponseEntity.ok(Map.of("items", items));
    }

    @PostMapping("/nutrition-summary")
    public ResponseEntity<NutritionSummaryResponse> nutrition(@RequestBody GroceryRequest request) {
        return ResponseEntity.ok(recipeService.nutritionSummary(request.getRecipeIds()));
    }
}
