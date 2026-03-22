package com.cookmate.controller;

import com.cookmate.dto.RecipeResponse;
import com.cookmate.entity.RecipeModerationStatus;
import com.cookmate.security.JwtAuthFilter;
import com.cookmate.service.RecipeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.any;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminRecipeController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminRecipeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private RecipeService recipeService;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @Test
    void pendingEndpointReturnsPendingList() throws Exception {
        RecipeResponse pending = RecipeResponse.builder()
                .id(42L)
                .title("Community Curry")
                .moderationStatus(RecipeModerationStatus.PENDING_REVIEW)
                .build();
        when(recipeService.getPendingSubmissions()).thenReturn(List.of(pending));

        mockMvc.perform(get("/api/admin/recipes/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(42))
                .andExpect(jsonPath("$[0].moderationStatus").value("PENDING_REVIEW"));
    }

    @Test
    void moderationEndpointUpdatesStatus() throws Exception {
        RecipeResponse approved = RecipeResponse.builder()
                .id(5L)
                .title("Budget Tomato Pasta")
                .moderationStatus(RecipeModerationStatus.PUBLISHED)
                .build();
        when(recipeService.moderateRecipe(eq(5L), any())).thenReturn(approved);

        String payload = objectMapper.writeValueAsString(new ModerationPayload("PUBLISHED", "Looks good", "admin@cookmate.test"));

        mockMvc.perform(post("/api/admin/recipes/5/moderation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.moderationStatus").value("PUBLISHED"));
    }

    private record ModerationPayload(String status, String moderationNotes, String reviewer) {}
}
