package com.cookmate.controller;

import com.cookmate.dto.CookLogRequest;
import com.cookmate.dto.CookLogResponse;
import com.cookmate.dto.CookLogSummaryResponse;
import com.cookmate.security.JwtAuthFilter;
import com.cookmate.service.CookLogService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CookLogController.class)
@AutoConfigureMockMvc(addFilters = false)
class CookLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CookLogService cookLogService;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

        @Test
        void logCookEndpointPersistsEntry() throws Exception {
        CookLogResponse response = CookLogResponse.builder()
                .id(1L)
                .recipeId(5L)
                .recipeTitle("One Pot Pasta")
                .minutesSpent(22)
                .rating(5)
                .build();
        when(cookLogService.logCook(any(CookLogRequest.class))).thenReturn(response);

        CookLogRequest payload = new CookLogRequest();
        payload.setRecipeId(5L);
        payload.setMinutesSpent(20);

        mockMvc.perform(post("/api/cook-log")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recipeId").value(5))
                .andExpect(jsonPath("$.minutesSpent").value(22));
    }

        @Test
        void summaryEndpointReturnsStats() throws Exception {
        CookLogResponse recent = CookLogResponse.builder()
                .id(7L)
                .recipeId(9L)
                .recipeTitle("Tofu Stir Fry")
                .cookedAt(LocalDateTime.now())
                .build();
        CookLogSummaryResponse summary = CookLogSummaryResponse.builder()
                .sessionsThisWeek(3)
                .minutesThisWeek(95)
                .streakDays(4)
                .favoriteRegion("Asian")
                .recentEntries(List.of(recent))
                .build();

        when(cookLogService.getSummary()).thenReturn(summary);

        mockMvc.perform(get("/api/cook-log/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionsThisWeek").value(3))
                .andExpect(jsonPath("$.recentEntries[0].recipeTitle").value("Tofu Stir Fry"));
    }
}
