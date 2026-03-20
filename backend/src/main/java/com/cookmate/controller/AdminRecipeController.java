package com.cookmate.controller;

import com.cookmate.dto.RecipeModerationRequest;
import com.cookmate.dto.RecipeResponse;
import com.cookmate.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/recipes")
@RequiredArgsConstructor
public class AdminRecipeController {

    private final RecipeService recipeService;

    @GetMapping("/pending")
    public ResponseEntity<List<RecipeResponse>> pending() {
        return ResponseEntity.ok(recipeService.getPendingSubmissions());
    }

    @PostMapping("/{id}/moderation")
    public ResponseEntity<RecipeResponse> moderate(@PathVariable Long id,
                                                   @RequestBody RecipeModerationRequest request) {
        return ResponseEntity.ok(recipeService.moderateRecipe(id, request));
    }
}
