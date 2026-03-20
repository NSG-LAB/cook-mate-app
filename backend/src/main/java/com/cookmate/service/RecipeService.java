package com.cookmate.service;

import com.cookmate.dto.NutritionSummaryResponse;
import com.cookmate.dto.RecipeModerationRequest;
import com.cookmate.dto.RecipePrintResponse;
import com.cookmate.dto.RecipeRemixRequest;
import com.cookmate.dto.RecipeRemixResponse;
import com.cookmate.dto.RecipeResponse;
import com.cookmate.dto.RecipeUpdateRequest;
import com.cookmate.dto.RecipeVersionResponse;
import com.cookmate.dto.VideoStepLinkResponse;
import com.cookmate.entity.Recipe;
import com.cookmate.entity.RecipeModerationStatus;
import com.cookmate.entity.RecipeVersion;
import com.cookmate.repository.RecipeRepository;
import com.cookmate.repository.RecipeVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final RecipeVersionRepository recipeVersionRepository;
    private static final int MAX_SUGGESTION_CANDIDATES = 200;

    public List<RecipeResponse> getAll(String region) {
        List<Recipe> recipes = (region == null || region.isBlank())
            ? recipeRepository.findByModerationStatus(RecipeModerationStatus.PUBLISHED)
            : recipeRepository.findByRegionIgnoreCaseAndModerationStatus(region, RecipeModerationStatus.PUBLISHED);
        return recipes.stream().map(recipe -> toResponse(recipe, null)).toList();
    }

    public List<RecipeResponse> getByBudget(Integer budget, String region, boolean quickOnly) {
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
            .map(recipe -> toResponse(recipe, null))
            .sorted(Comparator.comparingInt(RecipeResponse::getEstimatedCost))
            .toList();
    }

    public List<RecipeResponse> getByIngredients(List<String> ingredients) {
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
            .map(recipe -> toResponse(recipe, lower))
            .filter(r -> r.getIngredientMatchPercent() != null && r.getIngredientMatchPercent() > 0)
            .sorted(Comparator.comparingInt(RecipeResponse::getIngredientMatchPercent).reversed())
            .toList();
    }

            public List<RecipeResponse> getCookAgainSuggestions(List<Long> cookedRecipeIds) {
            if (cookedRecipeIds == null || cookedRecipeIds.isEmpty()) {
                return List.of();
            }

            Map<Long, Integer> rank = new HashMap<>();
            for (int i = 0; i < cookedRecipeIds.size(); i++) {
                rank.put(cookedRecipeIds.get(i), i);
            }

            return recipeRepository.findAllById(cookedRecipeIds).stream()
                .sorted(Comparator.comparingInt(r -> rank.getOrDefault(r.getId(), Integer.MAX_VALUE)))
                .map(recipe -> toResponse(recipe, null))
                .toList();
            }

            public List<RecipeResponse> getSeasonalSuggestions(String seasonParam) {
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
                .map(recipe -> toResponse(recipe, null))
                .toList();
            }

            public List<RecipeResponse> getWeatherSuggestions(String type) {
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
                .map(recipe -> toResponse(recipe, null))
                .toList();
            }

            public List<RecipeResponse> getOccasionSuggestions(String type) {
            String occasion = type == null ? "everyday" : type.trim().toLowerCase();

            return getPublishedSnapshot().stream()
                .filter(recipe -> switch (occasion) {
                    case "date-night" -> Set.of("italian", "japanese", "mediterranean").contains(recipe.getRegion().toLowerCase())
                        && recipe.getEstimatedCost() >= 100;
                    case "kids-meal" -> "easy".equals(resolveDifficulty(recipe)) && recipe.getCookTimeMinutes() <= 15;
                    case "meal-prep-sunday" -> recipe.getCalories() >= 380 && recipe.getCookTimeMinutes() >= 10;
                    default -> true;
                })
                .map(recipe -> toResponse(recipe, null))
                .toList();
            }

            public RecipeRemixResponse generateRecipeRemix(RecipeRemixRequest request) {
            List<String> available = request.getIngredients() == null ? List.of() : request.getIngredients().stream()
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(s -> !s.isBlank())
                .toList();

            Recipe base = null;
            if (request.getBaseRecipeId() != null) {
                base = recipeRepository.findById(request.getBaseRecipeId()).orElse(null);
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

    public RecipeResponse getById(Long id) {
        Recipe recipe = recipeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NoSuchElementException("Recipe not found"));
        return toResponse(recipe, null);
    }

        public RecipeResponse createRecipe(RecipeUpdateRequest request) {
        Recipe recipe = new Recipe();
        recipe.setTitle((request.getTitle() == null || request.getTitle().isBlank()) ? "Untitled Recipe" : request.getTitle().trim());
        recipe.setRegion((request.getRegion() == null || request.getRegion().isBlank()) ? "Global" : request.getRegion().trim());
        recipe.setPrepTimeMinutes(request.getPrepTimeMinutes() == null ? 5 : Math.max(request.getPrepTimeMinutes(), 0));
        recipe.setCookTimeMinutes(request.getCookTimeMinutes() == null ? 10 : Math.max(request.getCookTimeMinutes(), 0));
        recipe.setDifficulty((request.getDifficulty() == null || request.getDifficulty().isBlank()) ? "easy" : request.getDifficulty().trim().toLowerCase());
        recipe.setEstimatedCost(request.getEstimatedCost() == null ? 100 : Math.max(request.getEstimatedCost(), 0));
        recipe.setCalories(request.getCalories() == null ? 300 : Math.max(request.getCalories(), 0));
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

    public RecipeResponse updateRecipe(Long id, RecipeUpdateRequest request) {
        Recipe recipe = recipeRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new NoSuchElementException("Recipe not found"));

        int currentVersion = recipe.getVersionNumber() == null ? 1 : recipe.getVersionNumber();
        recipeVersionRepository.save(RecipeVersion.builder()
                .recipeId(recipe.getId())
                .versionNumber(currentVersion)
                .title(recipe.getTitle())
                .difficulty(resolveDifficulty(recipe))
                .prepTimeMinutes(resolvePrepMinutes(recipe))
                .cookTimeMinutes(recipe.getCookTimeMinutes())
                .updatedBy(request.getUpdatedBy() == null || request.getUpdatedBy().isBlank() ? "user" : request.getUpdatedBy())
                .updatedAt(LocalDateTime.now())
                .build());

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

    private RecipeResponse toResponse(Recipe recipe, Set<String> fridgeIngredients) {
        Integer matchPercent = null;
        List<String> ingredients = recipe.getIngredients() == null ? List.of() : recipe.getIngredients();
        if (fridgeIngredients != null && !ingredients.isEmpty()) {
            long matched = ingredients.stream()
                    .map(String::toLowerCase)
                    .filter(fridgeIngredients::contains)
                    .count();
            matchPercent = (int) Math.round((matched * 100.0) / ingredients.size());
        }

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
                .imageUrl(recipe.getImageUrl())
                .videoUrl(recipe.getVideoUrl())
                .ingredients(ingredients)
                .substitutionSuggestions(substitutions)
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

    private List<String> cleanList(List<String> values) {
        return values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
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
