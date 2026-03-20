package com.cookmate.service;

import com.cookmate.dto.CookLogRequest;
import com.cookmate.dto.CookLogResponse;
import com.cookmate.dto.CookLogSummaryResponse;
import com.cookmate.dto.PagedResponse;
import com.cookmate.entity.CookLogEntry;
import com.cookmate.entity.Recipe;
import com.cookmate.entity.User;
import com.cookmate.repository.CookLogRepository;
import com.cookmate.repository.RecipeRepository;
import com.cookmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CookLogService {

    private final CookLogRepository cookLogRepository;
    private final RecipeRepository recipeRepository;
    private final UserRepository userRepository;

    @Transactional
    public CookLogResponse logCook(CookLogRequest request) {
        Objects.requireNonNull(request, "Cook log request is required");
        Long recipeId = request.getRecipeId();
        if (recipeId == null) {
            throw new IllegalArgumentException("recipeId is required");
        }

        User user = resolveCurrentUser();
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new IllegalArgumentException("Recipe not found"));

        LocalDateTime cookedAt = request.getCookedAt() == null ? LocalDateTime.now() : request.getCookedAt();
        Integer minutesSpent = sanitizePositive(request.getMinutesSpent());
        Integer rating = sanitizeRating(request.getRating());
        Integer completedSteps = sanitizePositive(request.getCompletedSteps());
        Integer totalSteps = sanitizePositive(request.getTotalSteps());

        CookLogEntry entry = CookLogEntry.builder()
                .user(user)
                .recipe(recipe)
                .cookedAt(cookedAt)
                .minutesSpent(minutesSpent)
                .rating(rating)
                .moodTag(normalizeText(request.getMoodTag(), 40))
                .notes(normalizeText(request.getNotes(), 900))
                .usedTimer(Boolean.TRUE.equals(request.getUsedTimer()))
                .completedSteps(completedSteps)
                .totalSteps(totalSteps)
                .recipeTitleSnapshot(recipe.getTitle())
                .recipeImageSnapshot(recipe.getImageUrl())
                .build();

        CookLogEntry saved = cookLogRepository.save(Objects.requireNonNull(entry));
        return toResponse(saved);
    }

        @Transactional(readOnly = true)
        public PagedResponse<CookLogResponse> getHistory(int page, int size) {
        User user = resolveCurrentUser();
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "cookedAt"));

        Page<CookLogEntry> historyPage = cookLogRepository.findByUserOrderByCookedAtDesc(user, pageable);
        List<CookLogResponse> items = historyPage.getContent().stream()
            .map(this::toResponse)
            .toList();

        return PagedResponse.<CookLogResponse>builder()
            .items(items)
            .page(historyPage.getNumber())
            .size(historyPage.getSize())
            .totalElements(historyPage.getTotalElements())
            .hasNext(historyPage.hasNext())
            .build();
        }

    @Transactional(readOnly = true)
    public CookLogSummaryResponse getSummary() {
        User user = resolveCurrentUser();
        List<CookLogEntry> entries = cookLogRepository.findByUserOrderByCookedAtDesc(user);
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);

        int sessionsThisWeek = (int) entries.stream()
                .filter(entry -> entry.getCookedAt() != null && entry.getCookedAt().isAfter(weekAgo))
                .count();

        int minutesThisWeek = entries.stream()
                .filter(entry -> entry.getCookedAt() != null && entry.getCookedAt().isAfter(weekAgo))
                .map(CookLogEntry::getMinutesSpent)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();

        Double averageRating = entries.stream()
                .map(CookLogEntry::getRating)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(Double.NaN);

        String favoriteRegion = entries.stream()
                .map(entry -> Optional.ofNullable(entry.getRecipe())
                        .map(Recipe::getRegion)
                        .orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(region -> region, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        int streak = calculateStreak(entries);

        List<CookLogResponse> recentEntries = entries.stream()
                .sorted(Comparator.comparing(CookLogEntry::getCookedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(10)
                .map(this::toResponse)
                .toList();

        return CookLogSummaryResponse.builder()
                .sessionsThisWeek(sessionsThisWeek)
                .minutesThisWeek(minutesThisWeek)
                .streakDays(streak)
                .averageRating(Double.isNaN(averageRating) ? null : Math.round(averageRating * 10.0) / 10.0)
                .favoriteRegion(favoriteRegion)
                .recentEntries(recentEntries)
                .build();
    }

    private CookLogResponse toResponse(CookLogEntry entry) {
        Integer completionPercent = null;
        if (entry.getTotalSteps() != null && entry.getTotalSteps() > 0 && entry.getCompletedSteps() != null) {
            completionPercent = (int) Math.round((entry.getCompletedSteps() * 100.0) / entry.getTotalSteps());
        }

        return CookLogResponse.builder()
                .id(entry.getId())
                .recipeId(entry.getRecipe() != null ? entry.getRecipe().getId() : null)
                .recipeTitle(entry.getRecipeTitleSnapshot())
            .recipeImage(entry.getRecipeImageSnapshot() != null
                ? entry.getRecipeImageSnapshot()
                : Optional.ofNullable(entry.getRecipe()).map(Recipe::getImageUrl).orElse(null))
                .cookedAt(entry.getCookedAt())
                .minutesSpent(entry.getMinutesSpent())
                .rating(entry.getRating())
                .moodTag(entry.getMoodTag())
                .notes(entry.getNotes())
                .usedTimer(Boolean.TRUE.equals(entry.getUsedTimer()))
                .completedSteps(entry.getCompletedSteps())
                .totalSteps(entry.getTotalSteps())
                .completionPercent(completionPercent)
                .build();
    }

    private int calculateStreak(List<CookLogEntry> entries) {
        if (entries.isEmpty()) {
            return 0;
        }

        Map<LocalDate, Long> cookedDays = entries.stream()
                .filter(entry -> entry.getCookedAt() != null)
                .collect(Collectors.groupingBy(entry -> entry.getCookedAt().toLocalDate(), Collectors.counting()));

        int streak = 0;
        while (true) {
            LocalDate targetDate = LocalDate.now().minusDays(streak);
            if (cookedDays.containsKey(targetDate)) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    private Integer sanitizePositive(Integer value) {
        if (value == null) {
            return null;
        }
        return Math.max(0, value);
    }

    private Integer sanitizeRating(Integer rating) {
        if (rating == null) {
            return null;
        }
        int normalized = Math.max(1, Math.min(5, rating));
        return normalized;
    }

    private String normalizeText(String input, int maxLength) {
        if (input == null) {
            return null;
        }
        String trimmed = input.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }

    private User resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("Missing authenticated user");
        }

        String email;
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else {
            email = String.valueOf(principal);
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }
}
