package com.cookmate.service;

import com.cookmate.dto.NutritionSummaryResponse;
import com.cookmate.dto.PagedResponse;
import com.cookmate.dto.HealthFilterRequest;
import com.cookmate.dto.RecipeModerationRequest;
import com.cookmate.dto.RecipeNutritionComparisonResponse;
import com.cookmate.dto.RecipePrintResponse;
import com.cookmate.dto.RecipeRemixRequest;
import com.cookmate.dto.RecipeRemixResponse;
import com.cookmate.dto.RecipeResponse;
import com.cookmate.dto.RecipeSummaryResponse;
import com.cookmate.dto.RecipeUpdateRequest;
import com.cookmate.dto.RecipeVersionResponse;
import com.cookmate.dto.VideoStepLinkResponse;
import com.cookmate.entity.CookLogEntry;
import com.cookmate.entity.Recipe;
import com.cookmate.entity.RecipeModerationStatus;
import com.cookmate.entity.RecipeVersion;
import com.cookmate.entity.User;
import com.cookmate.repository.CookLogRepository;
import com.cookmate.repository.RecipeRepository;
import com.cookmate.repository.RecipeVersionRepository;
import com.cookmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final RecipeVersionRepository recipeVersionRepository;
    private final CookLogRepository cookLogRepository;
    private final UserRepository userRepository;
    private static final int MAX_SUGGESTION_CANDIDATES = 200;

    @Cacheable(cacheNames = "recipes:list", key = "#region == null || #region.isBlank() ? 'all' : #region.toLowerCase()")
    public List<RecipeSummaryResponse> getAll(String region) {
        List<Recipe> recipes = (region == null || region.isBlank())
            ? recipeRepository.findByModerationStatus(RecipeModerationStatus.PUBLISHED)
            : recipeRepository.findByRegionIgnoreCaseAndModerationStatus(region, RecipeModerationStatus.PUBLISHED);
        return recipes.stream().map(recipe -> toSummaryResponse(recipe, null)).toList();
    }

    @Cacheable(cacheNames = "recipes:budget", key = "T(String).valueOf(#budget) + ':' + (#region == null ? '' : #region.toLowerCase()) + ':' + #quickOnly")
    public List<RecipeSummaryResponse> getByBudget(Integer budget, String region, boolean quickOnly) {
        Integer maxCookTime = quickOnly ? 15 : null;
        String normalizedRegion = normalizeRegion(region);
        Pageable pageable = PageRequest.of(0, MAX_SUGGESTION_CANDIDATES, Sort.by(Sort.Direction.ASC, "estimatedCost"));

        List<Recipe> recipes = recipeRepository.searchPublishedRecipes(
            normalizedRegion,
            budget,
            maxCookTime,
            RecipeModerationStatus.PUBLISHED,
            pageable
        );

        return recipes.stream()
            .map(recipe -> toSummaryResponse(recipe, null))
            .sorted(Comparator.comparingInt(RecipeSummaryResponse::getEstimatedCost))
            .toList();
    }

    public List<RecipeSummaryResponse> getByIngredients(List<String> ingredients) {
        Set<String> lower = ingredients == null ? Set.of() : ingredients.stream()
            .map(String::trim)
            .map(String::toLowerCase)
            .filter(s -> !s.isBlank())
            .collect(Collectors.toSet());

        if (lower.isEmpty()) {
            return List.of();
        }

        Pageable pageable = PageRequest.of(0, MAX_SUGGESTION_CANDIDATES, Sort.by(Sort.Direction.DESC, "id"));
        List<Recipe> matches = recipeRepository.findPublishedByIngredients(
            lower,
            RecipeModerationStatus.PUBLISHED,
            pageable
        );

        return matches.stream()
            .map(recipe -> toSummaryResponse(recipe, lower))
            .filter(r -> r.getIngredientMatchPercent() != null && r.getIngredientMatchPercent() > 0)
            .sorted(Comparator.comparingInt(RecipeSummaryResponse::getIngredientMatchPercent).reversed())
            .toList();
    }

            @Transactional(readOnly = true)
            public List<RecipeSummaryResponse> getPersonalizedSuggestions(Integer limitParam) {
            int limit = Math.min(Math.max(limitParam == null ? 12 : limitParam, 1), 30);
            Optional<User> user = resolveCurrentUserOptional();
            if (user.isEmpty()) {
                return fallbackPersonalized(limit, null, null, Set.of());
            }

            List<CookLogEntry> recentLogs = cookLogRepository.findTop10ByUserOrderByCookedAtDesc(user.get());
            if (recentLogs.isEmpty()) {
                return fallbackPersonalized(limit, null, null, Set.of());
            }

            Set<Long> cookedRecipeIds = recentLogs.stream()
                .map(CookLogEntry::getRecipe)
                .filter(Objects::nonNull)
                .map(Recipe::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

            String preferredRegion = recentLogs.stream()
                .map(CookLogEntry::getRecipe)
                .filter(Objects::nonNull)
                .map(Recipe::getRegion)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(region -> region, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

            Integer budgetAnchor = (int) Math.round(recentLogs.stream()
                .map(CookLogEntry::getRecipe)
                .filter(Objects::nonNull)
                .map(Recipe::getEstimatedCost)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0));

            if (recentLogs.size() < 3) {
                return fallbackPersonalized(limit, preferredRegion, budgetAnchor > 0 ? budgetAnchor : null, cookedRecipeIds);
            }

            Map<String, Long> regionWeights = recentLogs.stream()
                .map(CookLogEntry::getRecipe)
                .filter(Objects::nonNull)
                .map(Recipe::getRegion)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(String::toLowerCase)
                .collect(Collectors.groupingBy(region -> region, Collectors.counting()));

            Map<String, Long> difficultyWeights = recentLogs.stream()
                .map(CookLogEntry::getRecipe)
                .filter(Objects::nonNull)
                .map(this::resolveDifficulty)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(String::toLowerCase)
                .collect(Collectors.groupingBy(diff -> diff, Collectors.counting()));

            Map<String, Long> ingredientWeights = recentLogs.stream()
                .map(CookLogEntry::getRecipe)
                .filter(Objects::nonNull)
                .map(Recipe::getIngredients)
                .filter(Objects::nonNull)
                .flatMap(List::stream)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(String::toLowerCase)
                .collect(Collectors.groupingBy(ingredient -> ingredient, Collectors.counting()));

            double avgMinutesSpent = recentLogs.stream()
                .map(CookLogEntry::getMinutesSpent)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0);

            return getPublishedSnapshot().stream()
                .filter(recipe -> !cookedRecipeIds.contains(recipe.getId()))
                .map(recipe -> Map.entry(recipe, personalizedScore(recipe, regionWeights, difficultyWeights, ingredientWeights, avgMinutesSpent)))
                .sorted(Comparator
                    .comparingDouble((Map.Entry<Recipe, Double> entry) -> entry.getValue()).reversed()
                    .thenComparing(entry -> entry.getKey().getId(), Comparator.reverseOrder()))
                .limit(limit)
                .map(entry -> {
                    Recipe recipe = entry.getKey();
                    String reason = buildRecommendationReason(recipe, preferredRegion, ingredientWeights);
                    return toSummaryResponse(recipe, null, reason);
                })
                .toList();
            }

            @Cacheable(cacheNames = "recipes:cookAgain", key = "'cookAgain:' + (#cookedRecipeIds == null ? 'none' : #cookedRecipeIds.toString())")
            public List<RecipeSummaryResponse> getCookAgainSuggestions(List<Long> cookedRecipeIds) {
            if (cookedRecipeIds == null || cookedRecipeIds.isEmpty()) {
                return List.of();
            }

            Map<Long, Integer> rank = new HashMap<>();
            for (int i = 0; i < cookedRecipeIds.size(); i++) {
                rank.put(cookedRecipeIds.get(i), i);
            }

            return recipeRepository.findAllById(cookedRecipeIds).stream()
                .sorted(Comparator.comparingInt(r -> rank.getOrDefault(r.getId(), Integer.MAX_VALUE)))
                .map(recipe -> toSummaryResponse(recipe, null))
                .toList();
            }

            @Cacheable(cacheNames = "recipes:seasonal", key = "#seasonParam == null || #seasonParam.isBlank() ? 'auto' : #seasonParam.toLowerCase()")
            public List<RecipeSummaryResponse> getSeasonalSuggestions(String seasonParam) {
            String season = seasonParam == null || seasonParam.isBlank() ? detectSeason() : seasonParam.trim().toLowerCase();
            Set<String> seasonalIngredients = switch (season) {
                case "spring" -> Set.of("tomato", "lemon", "cucumber", "carrot");
                case "summer" -> Set.of("cucumber", "lemon", "tomato", "olive oil");
                case "monsoon" -> Set.of("garlic", "chili", "onion", "ginger");
                case "winter" -> Set.of("potato", "garlic", "pepper", "butter", "paneer");
                default -> Set.of("tomato", "onion", "garlic", "lemon");
            };

            return getPublishedSnapshot().stream()
                .filter(recipe -> containsAnyIngredient(recipe, seasonalIngredients))
                .map(recipe -> toSummaryResponse(recipe, null))
                .toList();
            }

            @Cacheable(cacheNames = "recipes:weather", key = "#type == null ? 'mild' : #type.toLowerCase()")
            public List<RecipeSummaryResponse> getWeatherSuggestions(String type) {
            String weatherType = type == null ? "mild" : type.trim().toLowerCase();
            return getPublishedSnapshot().stream()
                .filter(recipe -> switch (weatherType) {
                    case "cold" -> recipe.getTitle().toLowerCase().contains("ramen")
                        || recipe.getTitle().toLowerCase().contains("pasta")
                        || recipe.getTitle().toLowerCase().contains("rice")
                        || recipe.getCookTimeMinutes() >= 10;
                    case "hot" -> recipe.getTitle().toLowerCase().contains("salad")
                            || (recipe.getIngredients() != null && recipe.getIngredients().stream().anyMatch(i -> i.toLowerCase().contains("lemon")));
                    case "rainy" -> recipe.getTitle().toLowerCase().contains("poha")
                        || recipe.getTitle().toLowerCase().contains("ramen")
                            || (recipe.getIngredients() != null && recipe.getIngredients().stream().anyMatch(i -> i.toLowerCase().contains("chili")));
                    default -> true;
                })
                .map(recipe -> toSummaryResponse(recipe, null))
                .toList();
            }

            @Cacheable(cacheNames = "recipes:occasion", key = "#type == null ? 'everyday' : #type.toLowerCase()")
            public List<RecipeSummaryResponse> getOccasionSuggestions(String type) {
            String occasion = type == null ? "everyday" : type.trim().toLowerCase();

            return getPublishedSnapshot().stream()
                .filter(recipe -> switch (occasion) {
                    case "date-night" -> Set.of("italian", "japanese", "mediterranean").contains(recipe.getRegion().toLowerCase())
                        && recipe.getEstimatedCost() >= 100;
                    case "kids-meal" -> "easy".equals(resolveDifficulty(recipe)) && recipe.getCookTimeMinutes() <= 15;
                    case "meal-prep-sunday" -> recipe.getCalories() >= 380 && recipe.getCookTimeMinutes() >= 10;
                    default -> true;
                })
                .map(recipe -> toSummaryResponse(recipe, null))
                .toList();
            }

            public RecipeRemixResponse generateRecipeRemix(RecipeRemixRequest request) {
            List<String> available = request.getIngredients() == null ? List.of() : request.getIngredients().stream()
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(s -> !s.isBlank())
                .toList();

            Recipe base = null;
            Long baseRecipeId = request.getBaseRecipeId();
            if (baseRecipeId != null) {
                base = recipeRepository.findById(baseRecipeId).orElse(null);
            }

            if (base == null && !available.isEmpty()) {
                Pageable singleRecipe = PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "id"));
                List<Recipe> candidates = recipeRepository.findPublishedByIngredients(
                        new HashSet<>(available),
                        RecipeModerationStatus.PUBLISHED,
                        singleRecipe
                );

                if (!candidates.isEmpty()) {
                    base = candidates.get(0);
                } else {
                    base = getPublishedSnapshot().stream()
                            .filter(recipe -> containsAnyIngredient(recipe, new HashSet<>(available)))
                            .findFirst()
                            .orElse(null);
                }
            }

            if (base == null) {
                return RecipeRemixResponse.builder()
                    .title("Quick Pantry Remix")
                    .baseRecipeTitle("No direct base")
                    .summary("Use your pantry ingredients to stir-fry and season to taste.")
                    .generatedSteps(List.of(
                        "Pick one carb, one protein, and two vegetables from your pantry.",
                        "Cook protein first, then vegetables, then add carb.",
                        "Season with salt, pepper, and one sauce of your choice."
                    ))
                    .build();
            }

            String remixTitle = base.getTitle() + " Remix";
            String ingredientText = available.isEmpty() ? "your pantry basics" : String.join(", ", available);
            List<String> steps = List.of(
                "Start with the base style of " + base.getTitle() + ".",
                "Swap in available ingredients: " + ingredientText + ".",
                "Adjust seasoning and serve as a personalized variation."
            );

            return RecipeRemixResponse.builder()
                .title(remixTitle)
                .baseRecipeTitle(base.getTitle())
                .summary("AI-style remix generated from what you have at home.")
                .generatedSteps(steps)
                .build();
            }

    public List<RecipeResponse> getPendingSubmissions() {
        return recipeRepository.findByModerationStatusOrderByIdAsc(RecipeModerationStatus.PENDING_REVIEW)
                .stream()
                .map(recipe -> toResponse(recipe, null))
                .toList();
    }

    @CacheEvict(cacheNames = {"recipes:list","recipes:budget","recipes:fridge","recipes:cookAgain","recipes:seasonal","recipes:weather","recipes:occasion"}, allEntries = true)
    public RecipeResponse moderateRecipe(Long id, RecipeModerationRequest request) {
        Recipe recipe = recipeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NoSuchElementException("Recipe not found"));
        RecipeModerationRequest moderationRequest = Objects.requireNonNull(request, "Moderation request is required");

        RecipeModerationStatus newStatus = moderationRequest.getStatus() == null
                ? RecipeModerationStatus.PENDING_REVIEW
            : moderationRequest.getStatus();

        recipe.setModerationStatus(newStatus);
        recipe.setModerationNotes(moderationRequest.getModerationNotes());
        if (newStatus == RecipeModerationStatus.PENDING_REVIEW) {
            recipe.setModerationDecisionBy(null);
            recipe.setModerationDecisionAt(null);
        } else {
            recipe.setModerationDecisionBy(moderationRequest.getReviewer());
            recipe.setModerationDecisionAt(LocalDateTime.now());
        }

        Recipe saved = recipeRepository.save(recipe);
        return toResponse(saved, null);
    }

    public List<String> generateGroceryList(List<Long> recipeIds) {
        if (recipeIds == null || recipeIds.isEmpty()) {
            return List.of();
        }

        return recipeRepository.findAllById(recipeIds)
                .stream()
                .flatMap(recipe -> recipe.getIngredients().stream())
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toCollection(TreeSet::new))
                .stream()
                .toList();
    }

    public PagedResponse<String> generateGroceryListPage(List<Long> recipeIds, int page, int size) {
        List<String> items = generateGroceryList(recipeIds);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        int start = safePage * safeSize;
        if (start >= items.size()) {
            start = items.size();
        }
        int end = Math.min(start + safeSize, items.size());
        List<String> slice = items.subList(start, end);

        return PagedResponse.<String>builder()
                .items(slice)
                .page(safePage)
                .size(safeSize)
                .totalElements(items.size())
                .hasNext(end < items.size())
                .build();
    }

    public Map<String, List<String>> generateGroceryListByAisle(List<Long> recipeIds) {
        List<String> items = generateGroceryList(recipeIds);
        Map<String, List<String>> grouped = new LinkedHashMap<>();
        grouped.put("Produce", new ArrayList<>());
        grouped.put("Dairy and Eggs", new ArrayList<>());
        grouped.put("Bakery", new ArrayList<>());
        grouped.put("Pantry and Grains", new ArrayList<>());
        grouped.put("Proteins", new ArrayList<>());
        grouped.put("Spices and Condiments", new ArrayList<>());
        grouped.put("Other", new ArrayList<>());

        for (String item : items) {
            grouped.get(resolveAisle(item)).add(item);
        }

        return grouped;
    }

    public int plannedSpend(List<Long> recipeIds) {
        if (recipeIds == null || recipeIds.isEmpty()) {
            return 0;
        }

        return recipeRepository.findAllById(recipeIds)
                .stream()
                .mapToInt(recipe -> recipe.getEstimatedCost() == null ? 0 : recipe.getEstimatedCost())
                .sum();
    }

    public NutritionSummaryResponse nutritionSummary(List<Long> recipeIds) {
        List<Recipe> recipes = recipeIds == null || recipeIds.isEmpty()
                ? List.of()
                : recipeRepository.findAllById(recipeIds);

        int total = recipes.stream().mapToInt(Recipe::getCalories).sum();
        int count = recipes.size();
        double avg = count == 0 ? 0 : (double) total / count;
        return new NutritionSummaryResponse(total, count, avg);
    }

    public List<RecipeSummaryResponse> getByHealthFilters(HealthFilterRequest request) {
        HealthFilterRequest criteria = request == null ? new HealthFilterRequest() : request;

        Set<String> goals = normalizeLowerSet(criteria.getGoals());
        Set<String> dietaryTags = normalizeLowerSet(criteria.getDietaryTags());
        Set<String> excludedAllergens = normalizeLowerSet(criteria.getExcludedAllergens());
        Integer maxCalories = criteria.getMaxCalories();
        Integer minProteinGrams = criteria.getMinProteinGrams();

        return getPublishedSnapshot().stream()
                .filter(recipe -> maxCalories == null || safe(recipe.getCalories()) <= maxCalories)
                .filter(recipe -> minProteinGrams == null || resolveProteinGrams(recipe) >= minProteinGrams)
                .filter(recipe -> goals.isEmpty() || isGoalMatch(recipe, goals))
                .filter(recipe -> dietaryTags.isEmpty() || containsAllDietaryTags(recipe, dietaryTags))
                .filter(recipe -> excludedAllergens.isEmpty() || !hasExcludedAllergen(recipe, excludedAllergens))
                .map(recipe -> toSummaryResponse(recipe, null))
                .toList();
    }

    public List<RecipeNutritionComparisonResponse> nutritionComparison(List<Long> recipeIds) {
        if (recipeIds == null || recipeIds.isEmpty()) {
            return List.of();
        }

        return recipeRepository.findAllById(recipeIds).stream()
                .map(recipe -> RecipeNutritionComparisonResponse.builder()
                        .id(recipe.getId())
                        .title(recipe.getTitle())
                        .calories(safe(recipe.getCalories()))
                        .proteinGrams(resolveProteinGrams(recipe))
                        .carbsGrams(resolveCarbsGrams(recipe))
                        .fatGrams(resolveFatGrams(recipe))
                        .build())
                .toList();
    }

    public RecipeResponse getById(Long id) {
        Recipe recipe = recipeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NoSuchElementException("Recipe not found"));
        return toResponse(recipe, null);
    }

        @CacheEvict(cacheNames = {"recipes:list","recipes:budget","recipes:fridge","recipes:cookAgain","recipes:seasonal","recipes:weather","recipes:occasion"}, allEntries = true)
        public RecipeResponse createRecipe(RecipeUpdateRequest request) {
        Recipe recipe = new Recipe();
        recipe.setTitle((request.getTitle() == null || request.getTitle().isBlank()) ? "Untitled Recipe" : request.getTitle().trim());
        recipe.setRegion((request.getRegion() == null || request.getRegion().isBlank()) ? "Global" : request.getRegion().trim());
        recipe.setPrepTimeMinutes(request.getPrepTimeMinutes() == null ? 5 : Math.max(request.getPrepTimeMinutes(), 0));
        recipe.setCookTimeMinutes(request.getCookTimeMinutes() == null ? 10 : Math.max(request.getCookTimeMinutes(), 0));
        recipe.setDifficulty((request.getDifficulty() == null || request.getDifficulty().isBlank()) ? "easy" : request.getDifficulty().trim().toLowerCase());
        recipe.setEstimatedCost(request.getEstimatedCost() == null ? 100 : Math.max(request.getEstimatedCost(), 0));
        recipe.setCalories(request.getCalories() == null ? 300 : Math.max(request.getCalories(), 0));
        recipe.setProteinGrams(request.getProteinGrams() == null ? 12 : Math.max(request.getProteinGrams(), 0));
        recipe.setCarbsGrams(request.getCarbsGrams() == null ? 35 : Math.max(request.getCarbsGrams(), 0));
        recipe.setFatGrams(request.getFatGrams() == null ? 10 : Math.max(request.getFatGrams(), 0));
        recipe.setImageUrl((request.getImageUrl() == null || request.getImageUrl().isBlank())
            ? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
            : request.getImageUrl().trim());
        recipe.setVideoUrl((request.getVideoUrl() == null || request.getVideoUrl().isBlank())
            ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            : request.getVideoUrl().trim());
        recipe.setIngredients((request.getIngredients() == null || request.getIngredients().isEmpty())
            ? List.of("salt", "pepper")
            : cleanList(request.getIngredients()));
        recipe.setSubstitutionSuggestions(request.getSubstitutionSuggestions() == null
            ? List.of("No butter? Use olive oil.")
            : cleanList(request.getSubstitutionSuggestions()));
        recipe.setAllergens(resolveAllergens(request.getAllergens(), recipe.getIngredients()));
        recipe.setDietaryTags(resolveDietaryTags(request.getDietaryTags(), recipe.getIngredients()));
        recipe.setSteps((request.getSteps() == null || request.getSteps().isEmpty())
            ? List.of("Prepare ingredients.", "Cook and serve.")
            : cleanList(request.getSteps()));
        recipe.setStepVideoTimestampsSeconds(request.getStepVideoTimestampsSeconds() == null
            ? List.of(0, 90)
            : request.getStepVideoTimestampsSeconds().stream().map(v -> v == null ? 0 : Math.max(v, 0)).toList());
        recipe.setVersionNumber(1);

        boolean communitySubmitted = Boolean.TRUE.equals(request.getCommunitySubmitted());
        recipe.setCommunitySubmitted(communitySubmitted);
        if (communitySubmitted) {
            recipe.setSubmittedBy(request.getSubmittedBy() == null || request.getSubmittedBy().isBlank()
                    ? "community"
                    : request.getSubmittedBy().trim());
            recipe.setModerationStatus(RecipeModerationStatus.PENDING_REVIEW);
            recipe.setModerationNotes(null);
            recipe.setModerationDecisionBy(null);
            recipe.setModerationDecisionAt(null);
        } else {
            recipe.setSubmittedBy(null);
            recipe.setModerationStatus(RecipeModerationStatus.PUBLISHED);
        }

        Recipe saved = recipeRepository.save(recipe);
        return toResponse(saved, null);
        }

    @CacheEvict(cacheNames = {"recipes:list","recipes:budget","recipes:fridge","recipes:cookAgain","recipes:seasonal","recipes:weather","recipes:occasion"}, allEntries = true)
    public RecipeResponse updateRecipe(Long id, RecipeUpdateRequest request) {
        Recipe recipe = recipeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NoSuchElementException("Recipe not found"));

        int currentVersion = recipe.getVersionNumber() == null ? 1 : recipe.getVersionNumber();
        RecipeVersion versionSnapshot = RecipeVersion.builder()
                .recipeId(recipe.getId())
                .versionNumber(currentVersion)
                .title(recipe.getTitle())
                .difficulty(resolveDifficulty(recipe))
                .prepTimeMinutes(resolvePrepMinutes(recipe))
                .cookTimeMinutes(recipe.getCookTimeMinutes())
                .updatedBy(request.getUpdatedBy() == null || request.getUpdatedBy().isBlank() ? "user" : request.getUpdatedBy())
                .updatedAt(LocalDateTime.now())
            .build();

        recipeVersionRepository.save(Objects.requireNonNull(versionSnapshot));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            recipe.setTitle(request.getTitle().trim());
        }
        if (request.getRegion() != null && !request.getRegion().isBlank()) {
            recipe.setRegion(request.getRegion().trim());
        }
        if (request.getPrepTimeMinutes() != null) {
            recipe.setPrepTimeMinutes(Math.max(request.getPrepTimeMinutes(), 0));
        }
        if (request.getCookTimeMinutes() != null) {
            recipe.setCookTimeMinutes(Math.max(request.getCookTimeMinutes(), 0));
        }
        if (request.getDifficulty() != null && !request.getDifficulty().isBlank()) {
            recipe.setDifficulty(request.getDifficulty().trim().toLowerCase());
        }
        if (request.getEstimatedCost() != null) {
            recipe.setEstimatedCost(Math.max(request.getEstimatedCost(), 0));
        }
        if (request.getCalories() != null) {
            recipe.setCalories(Math.max(request.getCalories(), 0));
        }
        if (request.getProteinGrams() != null) {
            recipe.setProteinGrams(Math.max(request.getProteinGrams(), 0));
        }
        if (request.getCarbsGrams() != null) {
            recipe.setCarbsGrams(Math.max(request.getCarbsGrams(), 0));
        }
        if (request.getFatGrams() != null) {
            recipe.setFatGrams(Math.max(request.getFatGrams(), 0));
        }
        if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            recipe.setImageUrl(request.getImageUrl().trim());
        }
        if (request.getVideoUrl() != null && !request.getVideoUrl().isBlank()) {
            recipe.setVideoUrl(request.getVideoUrl().trim());
        }
        if (request.getIngredients() != null && !request.getIngredients().isEmpty()) {
            recipe.setIngredients(cleanList(request.getIngredients()));
        }
        if (request.getSubstitutionSuggestions() != null) {
            recipe.setSubstitutionSuggestions(cleanList(request.getSubstitutionSuggestions()));
        }
        if (request.getAllergens() != null) {
            recipe.setAllergens(resolveAllergens(request.getAllergens(), recipe.getIngredients()));
        }
        if (request.getDietaryTags() != null) {
            recipe.setDietaryTags(resolveDietaryTags(request.getDietaryTags(), recipe.getIngredients()));
        }
        if (request.getSteps() != null && !request.getSteps().isEmpty()) {
            recipe.setSteps(cleanList(request.getSteps()));
        }
        if (request.getStepVideoTimestampsSeconds() != null) {
            recipe.setStepVideoTimestampsSeconds(request.getStepVideoTimestampsSeconds().stream()
                    .map(v -> v == null ? 0 : Math.max(v, 0))
                    .toList());
        }

        if (request.getCommunitySubmitted() != null) {
            recipe.setCommunitySubmitted(request.getCommunitySubmitted());
            if (request.getCommunitySubmitted()) {
                recipe.setModerationStatus(RecipeModerationStatus.PENDING_REVIEW);
                if (request.getSubmittedBy() != null && !request.getSubmittedBy().isBlank()) {
                    recipe.setSubmittedBy(request.getSubmittedBy().trim());
                } else if (recipe.getSubmittedBy() == null || recipe.getSubmittedBy().isBlank()) {
                    recipe.setSubmittedBy("community");
                }
                recipe.setModerationDecisionBy(null);
                recipe.setModerationDecisionAt(null);
            } else {
                recipe.setSubmittedBy(null);
            }
        }

        if (request.getSubmittedBy() != null && !request.getSubmittedBy().isBlank()) {
            recipe.setSubmittedBy(request.getSubmittedBy().trim());
        }

        recipe.setVersionNumber(currentVersion + 1);
        Recipe saved = recipeRepository.save(recipe);
        return toResponse(saved, null);
    }

    public List<RecipeVersionResponse> getVersionHistory(Long id) {
        recipeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NoSuchElementException("Recipe not found"));

        return recipeVersionRepository.findByRecipeIdOrderByVersionNumberDesc(id).stream()
                .map(v -> RecipeVersionResponse.builder()
                        .versionNumber(v.getVersionNumber())
                        .title(v.getTitle())
                        .difficulty(v.getDifficulty())
                        .prepTimeMinutes(v.getPrepTimeMinutes())
                        .cookTimeMinutes(v.getCookTimeMinutes())
                        .updatedBy(v.getUpdatedBy())
                        .updatedAt(v.getUpdatedAt())
                        .build())
                .toList();
    }

    public RecipePrintResponse getPrintView(Long id) {
        RecipeResponse recipe = getById(id);

        StringBuilder out = new StringBuilder();
        out.append(recipe.getTitle()).append("\n");
        out.append("Difficulty: ").append(recipe.getDifficulty()).append("\n");
        out.append("Prep: ").append(recipe.getPrepTimeMinutes()).append(" min\n");
        out.append("Cook: ").append(recipe.getCookTimeMinutes()).append(" min\n");
        out.append("Total: ").append(recipe.getTotalTimeMinutes()).append(" min\n");
        out.append("Cost: ").append(recipe.getEstimatedCost()).append("\n");
        out.append("Calories: ").append(recipe.getCalories()).append(" kcal\n\n");

        out.append("Ingredients\n");
        for (String ingredient : recipe.getIngredients()) {
            out.append("- ").append(ingredient).append("\n");
        }

        out.append("\nSteps\n");
        List<VideoStepLinkResponse> links = recipe.getVideoStepLinks() == null ? List.of() : recipe.getVideoStepLinks();
        for (int i = 0; i < recipe.getSteps().size(); i++) {
            String link = i < links.size() ? " (" + links.get(i).getUrl() + ")" : "";
            out.append(i + 1).append(". ").append(recipe.getSteps().get(i)).append(link).append("\n");
        }

        if (recipe.getSubstitutionSuggestions() != null && !recipe.getSubstitutionSuggestions().isEmpty()) {
            out.append("\nSubstitutions\n");
            for (String suggestion : recipe.getSubstitutionSuggestions()) {
                out.append("- ").append(suggestion).append("\n");
            }
        }

        return RecipePrintResponse.builder()
                .id(recipe.getId())
                .title(recipe.getTitle())
                .printableText(out.toString())
                .build();
    }

    private List<Recipe> getPublishedSnapshot() {
        Pageable pageable = PageRequest.of(0, MAX_SUGGESTION_CANDIDATES, Sort.by(Sort.Direction.DESC, "id"));
        return recipeRepository.findByModerationStatus(RecipeModerationStatus.PUBLISHED, pageable).getContent();
    }

    private List<RecipeSummaryResponse> fallbackPersonalized(int limit, String preferredRegion, Integer budgetAnchor, Set<Long> excludedRecipeIds) {
        Set<String> seasonalIngredients = seasonalIngredientsFor(detectSeason());
        return getPublishedSnapshot().stream()
                .filter(recipe -> !excludedRecipeIds.contains(recipe.getId()))
                .map(recipe -> Map.entry(recipe, fallbackScore(recipe, preferredRegion, budgetAnchor, seasonalIngredients)))
                .sorted(Comparator
                    .comparingDouble((Map.Entry<Recipe, Double> entry) -> entry.getValue()).reversed()
                    .thenComparing(entry -> entry.getKey().getId(), Comparator.reverseOrder()))
                .limit(limit)
                .map(entry -> {
                    Recipe recipe = entry.getKey();
                    String reason = buildFallbackReason(recipe, preferredRegion, budgetAnchor, seasonalIngredients);
                    return toSummaryResponse(recipe, null, reason);
                })
                .toList();
    }

    private double fallbackScore(Recipe recipe, String preferredRegion, Integer budgetAnchor, Set<String> seasonalIngredients) {
        double regionScore = 0.0;
        if (preferredRegion != null && !preferredRegion.isBlank() && recipe.getRegion() != null && recipe.getRegion().equalsIgnoreCase(preferredRegion)) {
            regionScore = 4.0;
        }

        double budgetScore = 0.0;
        int estimatedCost = safe(recipe.getEstimatedCost());
        if (budgetAnchor != null && budgetAnchor > 0) {
            if (estimatedCost > 0 && estimatedCost <= budgetAnchor) {
                budgetScore = 3.0;
            } else if (estimatedCost > 0 && estimatedCost <= Math.round(budgetAnchor * 1.2)) {
                budgetScore = 1.5;
            }
        }

        double seasonalScore = containsAnyIngredient(recipe, seasonalIngredients) ? 2.0 : 0.0;
        return regionScore + budgetScore + seasonalScore;
    }

    private String buildRecommendationReason(Recipe recipe, String preferredRegion, Map<String, Long> ingredientWeights) {
        List<String> reasons = new ArrayList<>();
        if (preferredRegion != null && !preferredRegion.isBlank() && recipe.getRegion() != null && recipe.getRegion().equalsIgnoreCase(preferredRegion)) {
            reasons.add("Matches your recent " + recipe.getRegion() + " preference");
        }

        List<String> ingredientHits = (recipe.getIngredients() == null ? List.<String>of() : recipe.getIngredients()).stream()
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(String::toLowerCase)
                .filter(ingredient -> ingredientWeights.getOrDefault(ingredient, 0L) > 0)
                .distinct()
                .limit(2)
                .toList();

        if (!ingredientHits.isEmpty()) {
            reasons.add("Uses ingredients you cook with often: " + String.join(", ", ingredientHits));
        }

        if (reasons.isEmpty()) {
            reasons.add("Recommended from your recent cooking history");
        }
        return String.join(". ", reasons);
    }

    private String buildFallbackReason(Recipe recipe, String preferredRegion, Integer budgetAnchor, Set<String> seasonalIngredients) {
        List<String> reasons = new ArrayList<>();
        if (preferredRegion != null && !preferredRegion.isBlank() && recipe.getRegion() != null && recipe.getRegion().equalsIgnoreCase(preferredRegion)) {
            reasons.add("Matches your recent region preference");
        }

        int estimatedCost = safe(recipe.getEstimatedCost());
        if (budgetAnchor != null && budgetAnchor > 0 && estimatedCost > 0 && estimatedCost <= budgetAnchor) {
            reasons.add("Fits your recent budget range");
        }

        if (containsAnyIngredient(recipe, seasonalIngredients)) {
            reasons.add("Seasonal ingredient match for " + detectSeason());
        }

        if (reasons.isEmpty()) {
            reasons.add("Recommended while we learn more from your history");
        }
        return String.join(". ", reasons);
    }

    private Set<String> seasonalIngredientsFor(String season) {
        return switch (season == null ? "" : season.trim().toLowerCase()) {
            case "spring" -> Set.of("tomato", "lemon", "cucumber", "carrot");
            case "summer" -> Set.of("cucumber", "lemon", "tomato", "olive oil");
            case "monsoon" -> Set.of("garlic", "chili", "onion", "ginger");
            case "winter" -> Set.of("potato", "garlic", "pepper", "butter", "paneer");
            default -> Set.of("tomato", "onion", "garlic", "lemon");
        };
    }

    private double personalizedScore(
            Recipe recipe,
            Map<String, Long> regionWeights,
            Map<String, Long> difficultyWeights,
            Map<String, Long> ingredientWeights,
            double avgMinutesSpent
    ) {
        String region = recipe.getRegion() == null ? "" : recipe.getRegion().trim().toLowerCase();
        String difficulty = resolveDifficulty(recipe).trim().toLowerCase();

        double regionScore = regionWeights.getOrDefault(region, 0L) * 4.0;
        double difficultyScore = difficultyWeights.getOrDefault(difficulty, 0L) * 2.0;

        double ingredientScore = (recipe.getIngredients() == null ? List.<String>of() : recipe.getIngredients()).stream()
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(String::toLowerCase)
                .distinct()
                .mapToDouble(ingredient -> Math.min(ingredientWeights.getOrDefault(ingredient, 0L), 2L))
                .sum();

        int cookTime = safe(recipe.getCookTimeMinutes());
        double speedScore = avgMinutesSpent > 0 && avgMinutesSpent <= 20 && cookTime <= 20 ? 1.5 : 0.0;

        return regionScore + difficultyScore + ingredientScore + speedScore;
    }

    private Optional<User> resolveCurrentUserOptional() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            return Optional.empty();
        }

        Object principal = authentication.getPrincipal();
        String email;
        if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else {
            email = String.valueOf(principal);
        }

        if (email == null || email.isBlank()) {
            return Optional.empty();
        }

        return userRepository.findByEmail(email);
    }

    private RecipeResponse toResponse(Recipe recipe, Set<String> fridgeIngredients) {
        List<String> ingredients = recipe.getIngredients() == null ? List.of() : recipe.getIngredients();
        Integer matchPercent = computeMatchPercent(ingredients, fridgeIngredients);

        int prepTime = resolvePrepMinutes(recipe);
        String difficulty = resolveDifficulty(recipe);
        int totalTime = prepTime + (recipe.getCookTimeMinutes() == null ? 0 : recipe.getCookTimeMinutes());
        List<String> substitutions = resolveSubstitutions(recipe);
        List<VideoStepLinkResponse> links = buildVideoStepLinks(recipe.getVideoUrl(), recipe.getSteps(), recipe.getStepVideoTimestampsSeconds());

        return RecipeResponse.builder()
                .id(recipe.getId())
                .title(recipe.getTitle())
                .region(recipe.getRegion())
                .prepTimeMinutes(prepTime)
                .cookTimeMinutes(recipe.getCookTimeMinutes())
                .difficulty(difficulty)
                .totalTimeMinutes(totalTime)
                .estimatedCost(recipe.getEstimatedCost())
                .calories(recipe.getCalories())
                .proteinGrams(resolveProteinGrams(recipe))
                .carbsGrams(resolveCarbsGrams(recipe))
                .fatGrams(resolveFatGrams(recipe))
                .imageUrl(recipe.getImageUrl())
                .videoUrl(recipe.getVideoUrl())
                .ingredients(ingredients)
                .substitutionSuggestions(substitutions)
                .allergens(resolveAllergens(recipe.getAllergens(), ingredients))
                .dietaryTags(resolveDietaryTags(recipe.getDietaryTags(), ingredients))
                .steps(recipe.getSteps() == null ? List.of() : recipe.getSteps())
                .videoStepLinks(links)
                .versionNumber(recipe.getVersionNumber() == null ? 1 : recipe.getVersionNumber())
                .ingredientMatchPercent(matchPercent)
                .moderationStatus(recipe.getModerationStatus())
                .communitySubmitted(recipe.isCommunitySubmitted())
                .submittedBy(recipe.getSubmittedBy())
                .moderationNotes(recipe.getModerationNotes())
                .moderationDecisionBy(recipe.getModerationDecisionBy())
                .moderationDecisionAt(recipe.getModerationDecisionAt())
                .build();
    }

    private RecipeSummaryResponse toSummaryResponse(Recipe recipe, Set<String> fridgeIngredients) {
        return toSummaryResponse(recipe, fridgeIngredients, null);
    }

    private RecipeSummaryResponse toSummaryResponse(Recipe recipe, Set<String> fridgeIngredients, String recommendationReason) {
        List<String> ingredients = recipe.getIngredients() == null ? List.of() : recipe.getIngredients();
        Integer matchPercent = computeMatchPercent(ingredients, fridgeIngredients);
        int prepTime = resolvePrepMinutes(recipe);
        int cookTime = recipe.getCookTimeMinutes() == null ? 0 : recipe.getCookTimeMinutes();

        return RecipeSummaryResponse.builder()
                .id(recipe.getId())
                .title(recipe.getTitle())
                .region(recipe.getRegion())
                .prepTimeMinutes(prepTime)
                .cookTimeMinutes(recipe.getCookTimeMinutes())
                .totalTimeMinutes(prepTime + cookTime)
                .difficulty(resolveDifficulty(recipe))
                .estimatedCost(recipe.getEstimatedCost())
                .calories(recipe.getCalories())
                .proteinGrams(resolveProteinGrams(recipe))
                .carbsGrams(resolveCarbsGrams(recipe))
                .fatGrams(resolveFatGrams(recipe))
                .imageUrl(recipe.getImageUrl())
                .allergens(resolveAllergens(recipe.getAllergens(), ingredients))
                .dietaryTags(resolveDietaryTags(recipe.getDietaryTags(), ingredients))
                .ingredientMatchPercent(matchPercent)
                .recommendationReason(recommendationReason)
                .build();
    }

    private String normalizeRegion(String region) {
        return (region == null || region.isBlank()) ? null : region.trim();
    }

    private String resolveDifficulty(Recipe recipe) {
        if (recipe.getDifficulty() != null && !recipe.getDifficulty().isBlank()) {
            return recipe.getDifficulty();
        }

        int prep = resolvePrepMinutes(recipe);
        int cook = recipe.getCookTimeMinutes() == null ? 0 : recipe.getCookTimeMinutes();
        int total = prep + cook;
        if (total <= 15) {
            return "easy";
        }
        if (total <= 30) {
            return "medium";
        }
        return "hard";
    }

    private int resolvePrepMinutes(Recipe recipe) {
        return recipe.getPrepTimeMinutes() == null ? 5 : Math.max(recipe.getPrepTimeMinutes(), 0);
    }

    private List<String> resolveSubstitutions(Recipe recipe) {
        if (recipe.getSubstitutionSuggestions() != null && !recipe.getSubstitutionSuggestions().isEmpty()) {
            return recipe.getSubstitutionSuggestions();
        }

        Set<String> lower = (recipe.getIngredients() == null ? List.<String>of() : recipe.getIngredients()).stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        List<String> suggestions = new ArrayList<>();
        if (lower.contains("butter")) {
            suggestions.add("No butter? Use olive oil.");
        }
        if (lower.contains("egg")) {
            suggestions.add("No egg? Use tofu scramble for binding and protein.");
        }
        if (lower.contains("cream")) {
            suggestions.add("No cream? Use milk with a teaspoon of flour.");
        }
        if (lower.contains("paneer")) {
            suggestions.add("No paneer? Use firm tofu.");
        }
        return suggestions;
    }

    private List<VideoStepLinkResponse> buildVideoStepLinks(String videoUrl, List<String> steps, List<Integer> stepVideoTimestampsSeconds) {
        if (videoUrl == null || videoUrl.isBlank() || steps == null || steps.isEmpty()) {
            return List.of();
        }

        List<Integer> timestamps = stepVideoTimestampsSeconds == null ? List.of() : stepVideoTimestampsSeconds;
        return IntStream.range(0, steps.size())
                .mapToObj(index -> {
                int seconds = index < timestamps.size() && timestamps.get(index) != null
                    ? Math.max(0, timestamps.get(index))
                    : index * 90;
                    String separator = videoUrl.contains("?") ? "&" : "?";
                    String url = seconds > 0 ? videoUrl + separator + "t=" + seconds + "s" : videoUrl;
                    return VideoStepLinkResponse.builder()
                            .stepNumber(index + 1)
                            .seconds(seconds)
                            .label("Step " + (index + 1))
                            .url(url)
                            .build();
                })
                .toList();
    }

    private Integer computeMatchPercent(List<String> ingredients, Set<String> fridgeIngredients) {
        if (fridgeIngredients == null || fridgeIngredients.isEmpty() || ingredients.isEmpty()) {
            return null;
        }

        long matched = ingredients.stream()
                .map(String::toLowerCase)
                .filter(fridgeIngredients::contains)
                .count();
        return (int) Math.round((matched * 100.0) / ingredients.size());
    }

    private List<String> cleanList(List<String> values) {
        return values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }

    private Set<String> normalizeLowerSet(List<String> values) {
        if (values == null || values.isEmpty()) {
            return Set.of();
        }
        return values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }

    private List<String> resolveAllergens(List<String> suppliedAllergens, List<String> ingredients) {
        List<String> cleaned = suppliedAllergens == null ? List.of() : cleanList(suppliedAllergens);
        if (!cleaned.isEmpty()) {
            return cleaned.stream().map(String::toLowerCase).toList();
        }
        return inferAllergens(ingredients);
    }

    private List<String> resolveDietaryTags(List<String> suppliedTags, List<String> ingredients) {
        List<String> cleaned = suppliedTags == null ? List.of() : cleanList(suppliedTags);
        if (!cleaned.isEmpty()) {
            return cleaned.stream().map(String::toLowerCase).toList();
        }
        return inferDietaryTags(ingredients);
    }

    private List<String> inferAllergens(List<String> ingredients) {
        Set<String> lower = normalizeLowerSet(ingredients);
        List<String> allergens = new ArrayList<>();
        if (containsAny(lower, Set.of("milk", "butter", "paneer", "cheese", "yogurt", "curd", "cream"))) {
            allergens.add("dairy");
        }
        if (containsAny(lower, Set.of("egg"))) {
            allergens.add("egg");
        }
        if (containsAny(lower, Set.of("peanut", "cashew", "almond", "walnut"))) {
            allergens.add("nuts");
        }
        if (containsAny(lower, Set.of("bread", "pasta", "noodles", "tortilla", "roll"))) {
            allergens.add("gluten");
        }
        if (containsAny(lower, Set.of("soy sauce", "tofu", "soya", "soy"))) {
            allergens.add("soy");
        }
        return allergens;
    }

    private List<String> inferDietaryTags(List<String> ingredients) {
        Set<String> lower = normalizeLowerSet(ingredients);
        boolean hasMeat = containsAny(lower, Set.of("chicken", "fish", "mutton", "beef", "pork"));
        boolean hasEgg = lower.contains("egg");
        boolean hasDairy = containsAny(lower, Set.of("milk", "butter", "paneer", "cheese", "yogurt", "curd", "cream"));
        boolean hasGluten = containsAny(lower, Set.of("bread", "pasta", "noodles", "tortilla", "roll"));

        List<String> tags = new ArrayList<>();
        if (!hasMeat && !hasEgg && !hasDairy) {
            tags.add("vegan");
        }
        if (!hasMeat && !hasEgg) {
            tags.add("vegetarian");
        }
        if (!hasGluten) {
            tags.add("gluten-free");
        }
        if (!containsAny(lower, Set.of("rice", "pasta", "bread", "noodles", "poha", "sugar"))) {
            tags.add("keto-friendly");
        }
        return tags;
    }

    private boolean containsAny(Set<String> source, Set<String> candidates) {
        for (String candidate : candidates) {
            if (source.contains(candidate)) {
                return true;
            }
        }
        return false;
    }

    private boolean isGoalMatch(Recipe recipe, Set<String> goals) {
        int calories = safe(recipe.getCalories());
        int protein = resolveProteinGrams(recipe);
        int carbs = resolveCarbsGrams(recipe);

        for (String goal : goals) {
            boolean match = switch (goal) {
                case "high-protein" -> protein >= 25;
                case "low-carb" -> carbs <= 25;
                case "weight-loss" -> calories <= 400 && protein >= 18;
                default -> true;
            };
            if (!match) {
                return false;
            }
        }
        return true;
    }

    private boolean containsAllDietaryTags(Recipe recipe, Set<String> requestedTags) {
        Set<String> tags = normalizeLowerSet(resolveDietaryTags(recipe.getDietaryTags(), recipe.getIngredients()));
        return tags.containsAll(requestedTags);
    }

    private boolean hasExcludedAllergen(Recipe recipe, Set<String> excludedAllergens) {
        Set<String> allergens = normalizeLowerSet(resolveAllergens(recipe.getAllergens(), recipe.getIngredients()));
        return excludedAllergens.stream().anyMatch(allergens::contains);
    }

    private int safe(Integer value) {
        return value == null ? 0 : Math.max(value, 0);
    }

    private int resolveProteinGrams(Recipe recipe) {
        if (recipe.getProteinGrams() != null) {
            return safe(recipe.getProteinGrams());
        }
        int calories = safe(recipe.getCalories());
        return Math.max(10, calories / 20);
    }

    private int resolveCarbsGrams(Recipe recipe) {
        if (recipe.getCarbsGrams() != null) {
            return safe(recipe.getCarbsGrams());
        }
        int calories = safe(recipe.getCalories());
        return Math.max(15, calories / 12);
    }

    private int resolveFatGrams(Recipe recipe) {
        if (recipe.getFatGrams() != null) {
            return safe(recipe.getFatGrams());
        }
        int calories = safe(recipe.getCalories());
        return Math.max(6, calories / 35);
    }

    private boolean containsAnyIngredient(Recipe recipe, Set<String> targetIngredients) {
        if (recipe.getIngredients() == null || recipe.getIngredients().isEmpty() || targetIngredients.isEmpty()) {
            return false;
        }

        Set<String> lower = recipe.getIngredients().stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        return targetIngredients.stream().anyMatch(lower::contains);
    }

    private String detectSeason() {
        int month = LocalDateTime.now().getMonthValue();
        if (month >= 3 && month <= 5) {
            return "spring";
        }
        if (month >= 6 && month <= 8) {
            return "summer";
        }
        if (month >= 9 && month <= 10) {
            return "monsoon";
        }
        return "winter";
    }

    private String resolveAisle(String item) {
        String lower = item == null ? "" : item.toLowerCase();
        if (Set.of("onion", "tomato", "potato", "carrot", "capsicum", "cucumber", "lemon", "garlic", "spinach", "spring onion", "ginger").contains(lower)) {
            return "Produce";
        }
        if (Set.of("milk", "curd", "yogurt", "cheese", "paneer", "butter", "egg").contains(lower)) {
            return "Dairy and Eggs";
        }
        if (Set.of("bread", "bun", "roll", "tortilla", "pita").contains(lower)) {
            return "Bakery";
        }
        if (Set.of("rice", "poha", "pasta", "noodles", "chickpea", "olive oil", "oil", "peanut").contains(lower)) {
            return "Pantry and Grains";
        }
        if (Set.of("chicken", "fish", "tofu", "paneer", "egg", "chickpea").contains(lower)) {
            return "Proteins";
        }
        if (Set.of("salt", "pepper", "chili", "soy sauce", "spice mix", "curry leaves", "sugar").contains(lower)) {
            return "Spices and Condiments";
        }
        return "Other";
    }
}
