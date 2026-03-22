package com.cookmate.graphql;

import com.cookmate.dto.RecipeResponse;
import com.cookmate.dto.RecipeSummaryResponse;
import com.cookmate.service.RecipeService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class RecipeGraphqlController {

    private final RecipeService recipeService;

    @QueryMapping
    public RecipeResponse recipeById(@Argument Long id) {
        return recipeService.getById(id);
    }

    @QueryMapping
    public List<RecipeSummaryResponse> allRecipes(@Argument String region) {
        return recipeService.getAll(region);
    }
}
