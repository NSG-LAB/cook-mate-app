package com.cookmate.controller;

import com.cookmate.dto.RecipeResponse;
import com.cookmate.dto.RecipeRemixRequest;
import com.cookmate.dto.RecipeRemixResponse;
import com.cookmate.dto.RecipeUpdateRequest;
import com.cookmate.dto.RecipeVersionResponse;
import com.cookmate.security.JwtAuthFilter;
import com.cookmate.service.RecipeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

@WebMvcTest(RecipeController.class)
@AutoConfigureMockMvc(addFilters = false)
class RecipeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

        @MockitoBean
        private RecipeService recipeService;

        @MockitoBean
        private JwtAuthFilter jwtAuthFilter;

    @Test
    void updateEndpointReturnsUpdatedRecipe() throws Exception {
        RecipeUpdateRequest request = new RecipeUpdateRequest();
        request.setTitle("Updated Ramen");
        request.setDifficulty("medium");

        RecipeResponse response = RecipeResponse.builder()
                .id(9L)
                .title("Updated Ramen")
                .difficulty("medium")
                .versionNumber(2)
                .build();

        when(recipeService.updateRecipe(eq(9L), any(RecipeUpdateRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/recipes/9")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(9L))
                .andExpect(jsonPath("$.title").value("Updated Ramen"))
                .andExpect(jsonPath("$.difficulty").value("medium"))
                .andExpect(jsonPath("$.versionNumber").value(2));
    }

    @Test
    void versionsEndpointReturnsHistoryList() throws Exception {
        RecipeVersionResponse v1 = RecipeVersionResponse.builder()
                .versionNumber(2)
                .title("Updated Ramen")
                .difficulty("medium")
                .prepTimeMinutes(6)
                .cookTimeMinutes(11)
                .updatedBy("student")
                .updatedAt(LocalDateTime.of(2026, 3, 19, 20, 30))
                .build();

        RecipeVersionResponse v2 = RecipeVersionResponse.builder()
                .versionNumber(1)
                .title("Garlic Butter Ramen")
                .difficulty("easy")
                .prepTimeMinutes(6)
                .cookTimeMinutes(11)
                .updatedBy("seed")
                .updatedAt(LocalDateTime.of(2026, 3, 18, 10, 0))
                .build();

        when(recipeService.getVersionHistory(9L)).thenReturn(List.of(v1, v2));

        mockMvc.perform(get("/api/recipes/9/versions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].versionNumber").value(2))
                .andExpect(jsonPath("$[0].title").value("Updated Ramen"))
                .andExpect(jsonPath("$[1].versionNumber").value(1));
    }

    @Test
    void cookAgainEndpointReturnsCookedHistoryOrder() throws Exception {
        RecipeResponse r1 = RecipeResponse.builder().id(9L).title("Garlic Butter Ramen").build();
        RecipeResponse r2 = RecipeResponse.builder().id(4L).title("Chickpea Salad Bowl").build();

        when(recipeService.getCookAgainSuggestions(List.of(9L, 4L))).thenReturn(List.of(r1, r2));

        mockMvc.perform(post("/api/recipes/cook-again")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"recipeIds\":[9,4]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(9))
                .andExpect(jsonPath("$[1].id").value(4));
    }

    @Test
    void seasonalEndpointReturnsSeasonalRecipes() throws Exception {
        when(recipeService.getSeasonalSuggestions("summer")).thenReturn(List.of(
                RecipeResponse.builder().id(2L).title("Chickpea Salad Bowl").build()
        ));

        mockMvc.perform(get("/api/recipes/seasonal").param("season", "summer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Chickpea Salad Bowl"));
    }

    @Test
    void weatherEndpointReturnsWeatherBasedRecipes() throws Exception {
        when(recipeService.getWeatherSuggestions("cold")).thenReturn(List.of(
                RecipeResponse.builder().id(1L).title("Garlic Butter Ramen").build()
        ));

        mockMvc.perform(get("/api/recipes/weather").param("type", "cold"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Garlic Butter Ramen"));
    }

    @Test
    void occasionEndpointReturnsOccasionRecipes() throws Exception {
        when(recipeService.getOccasionSuggestions("date-night")).thenReturn(List.of(
                RecipeResponse.builder().id(5L).title("Budget Tomato Pasta").build()
        ));

        mockMvc.perform(get("/api/recipes/occasion").param("type", "date-night"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Budget Tomato Pasta"));
    }

    @Test
    void remixEndpointReturnsGeneratedVariation() throws Exception {
        RecipeRemixRequest request = new RecipeRemixRequest();
        request.setBaseRecipeId(9L);
        request.setIngredients(List.of("egg", "noodles", "garlic"));

        RecipeRemixResponse response = RecipeRemixResponse.builder()
                .title("Garlic Butter Ramen Remix")
                .baseRecipeTitle("Garlic Butter Ramen")
                .summary("AI-style remix generated from what you have at home.")
                .generatedSteps(List.of("Step A", "Step B"))
                .build();

        when(recipeService.generateRecipeRemix(any(RecipeRemixRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/recipes/remix")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Garlic Butter Ramen Remix"))
                .andExpect(jsonPath("$.baseRecipeTitle").value("Garlic Butter Ramen"))
                .andExpect(jsonPath("$.generatedSteps[0]").value("Step A"));
    }

        @Test
        void groceryGroupedEndpointReturnsAisleMap() throws Exception {
                Map<String, List<String>> grouped = Map.of(
                                "Produce", List.of("tomato"),
                                "Pantry and Grains", List.of("rice")
                );
                when(recipeService.generateGroceryListByAisle(List.of(1L, 2L))).thenReturn(grouped);

                mockMvc.perform(post("/api/recipes/grocery-list-grouped")
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content("{\"recipeIds\":[1,2]}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.Produce[0]").value("tomato"))
                                .andExpect(jsonPath("$.['Pantry and Grains'][0]").value("rice"));
        }

        @Test
        void plannedSpendEndpointReturnsTotalAndCount() throws Exception {
                when(recipeService.plannedSpend(List.of(1L, 2L, 3L))).thenReturn(360);

                mockMvc.perform(post("/api/recipes/planned-spend")
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content("{\"recipeIds\":[1,2,3]}"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.totalEstimatedCost").value(360))
                                .andExpect(jsonPath("$.recipeCount").value(3));
        }

                    @Test
                    void groceryGroupedAndPlannedSpendStayConsistentInSingleFlow() throws Exception {
                        List<Long> recipeIds = List.of(2L, 5L);
                        when(recipeService.generateGroceryListByAisle(recipeIds)).thenReturn(Map.of(
                                "Produce", List.of("tomato", "onion"),
                                "Pantry and Grains", List.of("rice")
                        ));
                        when(recipeService.plannedSpend(recipeIds)).thenReturn(230);

                        String payload = objectMapper.writeValueAsString(Map.of("recipeIds", recipeIds));

                        mockMvc.perform(post("/api/recipes/grocery-list-grouped")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(payload))
                                .andExpect(status().isOk())
                                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.Produce[0]").value("tomato"))
                                .andExpect(jsonPath("$.['Pantry and Grains'][0]").value("rice"));

                        mockMvc.perform(post("/api/recipes/planned-spend")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(payload))
                                .andExpect(status().isOk())
                                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                                .andExpect(jsonPath("$.totalEstimatedCost").value(230))
                                .andExpect(jsonPath("$.recipeCount").value(2));
                    }
}
