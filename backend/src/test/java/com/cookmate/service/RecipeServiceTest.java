package com.cookmate.service;

import com.cookmate.dto.RecipeResponse;
import com.cookmate.dto.RecipeRemixRequest;
import com.cookmate.dto.RecipeRemixResponse;
import com.cookmate.dto.RecipeUpdateRequest;
import com.cookmate.dto.RecipeVersionResponse;
import com.cookmate.entity.Recipe;
import com.cookmate.entity.RecipeVersion;
import com.cookmate.repository.RecipeRepository;
import com.cookmate.repository.RecipeVersionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecipeServiceTest {

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private RecipeVersionRepository recipeVersionRepository;

    @InjectMocks
    private RecipeService recipeService;

    @Test
    void updateRecipeIncrementsVersionAndStoresHistory() {
        Recipe existing = Recipe.builder()
                .id(5L)
                .title("Old Title")
                .region("Asian")
                .prepTimeMinutes(5)
                .cookTimeMinutes(10)
                .difficulty("easy")
                .estimatedCost(120)
                .calories(350)
                .imageUrl("https://example.com/x.jpg")
                .videoUrl("https://youtube.com/watch?v=abc")
                .ingredients(List.of("noodles", "butter"))
                .steps(List.of("Step 1", "Step 2"))
                .versionNumber(1)
                .build();

        RecipeUpdateRequest request = new RecipeUpdateRequest();
        request.setTitle("New Title");
        request.setPrepTimeMinutes(9);
        request.setCookTimeMinutes(14);
        request.setDifficulty("medium");
        request.setUpdatedBy("student");

        when(recipeRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(recipeRepository.save(any(Recipe.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RecipeResponse response = recipeService.updateRecipe(5L, request);

        assertEquals("New Title", response.getTitle());
        assertEquals("medium", response.getDifficulty());
        assertEquals(2, response.getVersionNumber());

        ArgumentCaptor<RecipeVersion> versionCaptor = ArgumentCaptor.forClass(RecipeVersion.class);
        verify(recipeVersionRepository).save(versionCaptor.capture());
        assertEquals(1, versionCaptor.getValue().getVersionNumber());
        assertEquals("Old Title", versionCaptor.getValue().getTitle());
    }

    @Test
    void getVersionHistoryMapsRepositoryRows() {
        Recipe existing = Recipe.builder().id(5L).title("Any").cookTimeMinutes(10).build();
        when(recipeRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(recipeVersionRepository.findByRecipeIdOrderByVersionNumberDesc(5L)).thenReturn(List.of(
                RecipeVersion.builder()
                        .recipeId(5L)
                        .versionNumber(3)
                        .title("Latest")
                        .difficulty("hard")
                        .prepTimeMinutes(12)
                        .cookTimeMinutes(20)
                        .updatedBy("student")
                        .build(),
                RecipeVersion.builder()
                        .recipeId(5L)
                        .versionNumber(2)
                        .title("Older")
                        .difficulty("medium")
                        .prepTimeMinutes(8)
                        .cookTimeMinutes(16)
                        .updatedBy("mentor")
                        .build()
        ));

        List<RecipeVersionResponse> rows = recipeService.getVersionHistory(5L);

        assertEquals(2, rows.size());
        assertEquals(3, rows.get(0).getVersionNumber());
        assertEquals("Latest", rows.get(0).getTitle());
        assertFalse(rows.get(1).getUpdatedBy().isBlank());
    }

    @Test
    void cookAgainSuggestionsPreserveInputOrder() {
        Recipe first = Recipe.builder().id(9L).title("Garlic Butter Ramen").cookTimeMinutes(11).estimatedCost(100).calories(300).region("Asian").imageUrl("x").videoUrl("v").ingredients(List.of("a")).steps(List.of("s")).build();
        Recipe second = Recipe.builder().id(4L).title("Chickpea Salad Bowl").cookTimeMinutes(8).estimatedCost(120).calories(280).region("Mediterranean").imageUrl("x").videoUrl("v").ingredients(List.of("a")).steps(List.of("s")).build();

        when(recipeRepository.findAllById(List.of(9L, 4L))).thenReturn(List.of(second, first));

        List<RecipeResponse> results = recipeService.getCookAgainSuggestions(List.of(9L, 4L));

        assertEquals(2, results.size());
        assertEquals(9L, results.get(0).getId());
        assertEquals(4L, results.get(1).getId());
    }

    @Test
    void weatherSuggestionsForColdIncludeWarmRecipe() {
        Recipe ramen = Recipe.builder()
                .id(1L)
                .title("Garlic Butter Ramen")
                .cookTimeMinutes(11)
                .estimatedCost(100)
                .calories(300)
                .region("Asian")
                .imageUrl("x")
                .videoUrl("v")
                .ingredients(List.of("garlic", "butter"))
                .steps(List.of("a"))
                .build();
        Recipe salad = Recipe.builder()
                .id(2L)
                .title("Cold Salad")
                .cookTimeMinutes(4)
                .estimatedCost(80)
                .calories(180)
                .region("Mediterranean")
                .imageUrl("x")
                .videoUrl("v")
                .ingredients(List.of("cucumber"))
                .steps(List.of("a"))
                .build();

        when(recipeRepository.findAll()).thenReturn(List.of(ramen, salad));

        List<RecipeResponse> results = recipeService.getWeatherSuggestions("cold");
        assertTrue(results.stream().anyMatch(r -> "Garlic Butter Ramen".equals(r.getTitle())));
    }

    @Test
    void remixWithoutBaseReturnsFallbackTitle() {
        RecipeRemixRequest request = new RecipeRemixRequest();
        request.setIngredients(List.of());

        RecipeRemixResponse remix = recipeService.generateRecipeRemix(request);

        assertEquals("Quick Pantry Remix", remix.getTitle());
        assertFalse(remix.getGeneratedSteps().isEmpty());
    }
}
