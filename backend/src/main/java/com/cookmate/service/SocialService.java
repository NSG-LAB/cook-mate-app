package com.cookmate.service;

import com.cookmate.dto.*;
import com.cookmate.entity.*;
import com.cookmate.repository.*;
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
import java.util.*;

@Service
@RequiredArgsConstructor
public class SocialService {

    private final RecipeChallengeRepository recipeChallengeRepository;
    private final ChallengeParticipationRepository challengeParticipationRepository;
    private final RecipeCommentRepository recipeCommentRepository;
    private final ContentReportRepository contentReportRepository;
    private final UserFollowRepository userFollowRepository;
    private final UserRepository userRepository;
    private final RecipeRepository recipeRepository;
    private final CookLogRepository cookLogRepository;

    @Transactional(readOnly = true)
    public SocialChallengeResponse getFeaturedChallenge() {
        User currentUser = resolveCurrentUser();
        RecipeChallenge challenge = resolveCurrentWeekChallenge();
        if (challenge == null) {
            return null;
        }

        boolean participated = challengeParticipationRepository.existsByChallengeAndUser(challenge, currentUser);
        Recipe featured = challenge.getFeaturedRecipe();

        return SocialChallengeResponse.builder()
                .challengeId(challenge.getId())
                .title(challenge.getTitle())
                .description(challenge.getDescription())
                .weekStartDate(challenge.getWeekStartDate())
                .weekEndDate(challenge.getWeekEndDate())
                .featuredRecipeId(featured != null ? featured.getId() : null)
                .featuredRecipeTitle(featured != null ? featured.getTitle() : null)
                .featuredRecipeImage(featured != null ? featured.getImageUrl() : null)
                .participated(participated)
                .build();
    }

    @Transactional
    public SimpleMessageResponse participateFeaturedChallenge(ChallengeParticipationRequest request) {
        User user = resolveCurrentUser();
        RecipeChallenge challenge = resolveCurrentWeekChallenge();
        if (challenge == null) {
            throw new IllegalStateException("No active challenge available");
        }

        if (challengeParticipationRepository.existsByChallengeAndUser(challenge, user)) {
            return new SimpleMessageResponse("Already participating in this week's challenge");
        }

        String notes = request == null ? null : normalizeText(request.getNotes(), 500);

        ChallengeParticipation participation = ChallengeParticipation.builder()
                .challenge(challenge)
                .user(user)
                .participatedAt(LocalDateTime.now())
                .notes(notes)
                .build();
        challengeParticipationRepository.save(participation);
        return new SimpleMessageResponse("Challenge participation recorded");
    }

    @Transactional(readOnly = true)
    public List<SocialBadgeResponse> getBadges() {
        User user = resolveCurrentUser();

        long sessions = cookLogRepository.countByUser(user);
        long comments = recipeCommentRepository.countByUser(user);
        long challenges = challengeParticipationRepository.countByUser(user);
        long followers = userFollowRepository.countByFollowing(user);

        List<SocialBadgeResponse> badges = new ArrayList<>();
        if (sessions >= 1) {
            badges.add(badge("FIRST_COOK", "First Cook", "Logged your first cooking session."));
        }
        if (sessions >= 10) {
            badges.add(badge("CONSISTENT_COOK", "Consistent Cook", "Completed 10+ cook sessions."));
        }
        if (comments >= 1) {
            badges.add(badge("TIPSTER", "Tipster", "Shared your first recipe tip/review."));
        }
        if (comments >= 5) {
            badges.add(badge("COMMUNITY_HELPER", "Community Helper", "Posted 5+ useful comments."));
        }
        if (challenges >= 1) {
            badges.add(badge("CHALLENGER", "Challenger", "Joined a weekly recipe challenge."));
        }
        if (followers >= 1) {
            badges.add(badge("FOLLOWED_CHEF", "Followed Chef", "Gained your first follower."));
        }

        return badges;
    }

    @Transactional(readOnly = true)
        public SocialPageResponse<RecipeCommentResponse> getRecipeComments(Long recipeId, Integer page, Integer size, Long cursor) {
        Recipe recipe = recipeRepository.findById(Objects.requireNonNull(recipeId))
                .orElseThrow(() -> new NoSuchElementException("Recipe not found"));

        int safeSize = normalizePageSize(size);
        if (cursor != null && cursor > 0) {
            Pageable pageable = PageRequest.of(0, safeSize + 1);
            List<RecipeComment> rows = recipeCommentRepository.findByRecipeAndIdLessThanOrderByIdDesc(recipe, cursor, pageable);
            boolean hasNext = rows.size() > safeSize;
            List<RecipeComment> slice = hasNext ? rows.subList(0, safeSize) : rows;
            Long nextCursor = hasNext && !slice.isEmpty() ? slice.get(slice.size() - 1).getId() : null;

            return SocialPageResponse.<RecipeCommentResponse>builder()
                .items(slice.stream().map(this::toCommentResponse).toList())
                .page(null)
                .size(safeSize)
                .totalElements(-1)
                .hasNext(hasNext)
                .nextCursor(nextCursor)
                .build();
        }

        int safePage = Math.max(page == null ? 0 : page, 0);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "id"));
        Page<RecipeComment> commentPage = recipeCommentRepository.findByRecipe(recipe, pageable);
        List<RecipeComment> rows = commentPage.getContent();
        Long nextCursor = commentPage.hasNext() && !rows.isEmpty() ? rows.get(rows.size() - 1).getId() : null;

        return SocialPageResponse.<RecipeCommentResponse>builder()
            .items(rows.stream().map(this::toCommentResponse).toList())
            .page(commentPage.getNumber())
            .size(commentPage.getSize())
            .totalElements(commentPage.getTotalElements())
            .hasNext(commentPage.hasNext())
            .nextCursor(nextCursor)
            .build();
    }

    @Transactional
    public RecipeCommentResponse addRecipeComment(Long recipeId, RecipeCommentRequest request) {
        User user = resolveCurrentUser();
        Recipe recipe = recipeRepository.findById(Objects.requireNonNull(recipeId))
                .orElseThrow(() -> new NoSuchElementException("Recipe not found"));

        String commentText = request == null ? null : normalizeText(request.getComment(), 1200);
        if (commentText == null) {
            throw new IllegalArgumentException("Comment is required");
        }

        Integer rating = request == null ? null : sanitizeRating(request.getRating());

        RecipeComment comment = RecipeComment.builder()
                .recipe(recipe)
                .user(user)
                .comment(commentText)
                .rating(rating)
                .createdAt(LocalDateTime.now())
                .build();

        RecipeComment saved = recipeCommentRepository.save(comment);
        return toCommentResponse(saved);
    }

    @Transactional
    public SimpleMessageResponse reportRecipe(Long recipeId, ContentReportRequest request) {
        User reporter = resolveCurrentUser();
        Recipe recipe = recipeRepository.findById(Objects.requireNonNull(recipeId))
                .orElseThrow(() -> new NoSuchElementException("Recipe not found"));

        ContentReport report = ContentReport.builder()
                .recipe(recipe)
                .reporter(reporter)
                .reason(extractReason(request))
                .status(ContentReportStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build();
        contentReportRepository.save(report);

        return new SimpleMessageResponse("Recipe report submitted");
    }

    @Transactional
    public SimpleMessageResponse reportComment(Long commentId, ContentReportRequest request) {
        User reporter = resolveCurrentUser();
        RecipeComment comment = recipeCommentRepository.findById(Objects.requireNonNull(commentId))
                .orElseThrow(() -> new NoSuchElementException("Comment not found"));

        ContentReport report = ContentReport.builder()
                .comment(comment)
                .reporter(reporter)
                .reason(extractReason(request))
                .status(ContentReportStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build();
        contentReportRepository.save(report);

        return new SimpleMessageResponse("Comment report submitted");
    }

    @Transactional(readOnly = true)
    public SocialProfileResponse getProfile(Long userId) {
        User currentUser = resolveCurrentUser();
        User targetUser = userRepository.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        long followers = userFollowRepository.countByFollowing(targetUser);
        long following = userFollowRepository.countByFollower(targetUser);
        boolean followingByCurrentUser = userFollowRepository.existsByFollowerAndFollowing(currentUser, targetUser);

        List<CookLogResponse> recentCooks = cookLogRepository.findTop10ByUserOrderByCookedAtDesc(targetUser)
                .stream()
                .map(this::toCookLogResponse)
                .toList();

        List<RecipeCommentResponse> recentComments = recipeCommentRepository.findTop10ByUserOrderByCreatedAtDesc(targetUser)
                .stream()
                .map(this::toCommentResponse)
                .toList();

        return SocialProfileResponse.builder()
                .userId(targetUser.getId())
                .name(targetUser.getName())
                .email(targetUser.getEmail())
                .followers(followers)
                .following(following)
                .followingByCurrentUser(followingByCurrentUser)
                .totalCookSessions((int) cookLogRepository.countByUser(targetUser))
                .totalComments((int) recipeCommentRepository.countByUser(targetUser))
                .recentCooks(recentCooks)
                .recentComments(recentComments)
                .build();
    }

    @Transactional(readOnly = true)
    public SocialProfileResponse getMyProfile() {
        User currentUser = resolveCurrentUser();
        return getProfile(currentUser.getId());
    }

    @Transactional
    public SimpleMessageResponse followUser(Long userId) {
        User currentUser = resolveCurrentUser();
        User targetUser = userRepository.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        if (Objects.equals(currentUser.getId(), targetUser.getId())) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }

        if (userFollowRepository.existsByFollowerAndFollowing(currentUser, targetUser)) {
            return new SimpleMessageResponse("Already following user");
        }

        UserFollow follow = UserFollow.builder()
                .follower(currentUser)
                .following(targetUser)
                .createdAt(LocalDateTime.now())
                .build();
        userFollowRepository.save(follow);

        return new SimpleMessageResponse("Now following user");
    }

    @Transactional
    public SimpleMessageResponse unfollowUser(Long userId) {
        User currentUser = resolveCurrentUser();
        User targetUser = userRepository.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        userFollowRepository.findByFollowerAndFollowing(currentUser, targetUser)
                .ifPresent(userFollowRepository::delete);

        return new SimpleMessageResponse("Unfollowed user");
    }

    @Transactional(readOnly = true)
        public SocialPageResponse<UserSearchResponse> searchUsers(String query, Integer page, Integer size, Long cursor) {
        String normalized = query == null ? "" : query.trim().toLowerCase();
        if (normalized.isEmpty()) {
            return SocialPageResponse.<UserSearchResponse>builder()
                .items(List.of())
                .page(page == null ? 0 : Math.max(page, 0))
                .size(normalizePageSize(size))
                .totalElements(0)
                .hasNext(false)
                .nextCursor(null)
                .build();
        }

        int safeSize = normalizePageSize(size);
        if (cursor != null && cursor > 0) {
            Pageable pageable = PageRequest.of(0, safeSize + 1);
            List<User> rows = userRepository.searchByQueryAfterCursor(normalized, cursor, pageable);
            boolean hasNext = rows.size() > safeSize;
            List<User> slice = hasNext ? rows.subList(0, safeSize) : rows;
            Long nextCursor = hasNext && !slice.isEmpty() ? slice.get(slice.size() - 1).getId() : null;

            return SocialPageResponse.<UserSearchResponse>builder()
                .items(slice.stream().map(this::toUserSearchResponse).toList())
                .page(null)
                .size(safeSize)
                .totalElements(-1)
                .hasNext(hasNext)
                .nextCursor(nextCursor)
                .build();
        }

        int safePage = Math.max(page == null ? 0 : page, 0);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "id"));
        Page<User> userPage = userRepository.searchByQuery(normalized, pageable);
        List<User> rows = userPage.getContent();
        Long nextCursor = userPage.hasNext() && !rows.isEmpty() ? rows.get(rows.size() - 1).getId() : null;

        return SocialPageResponse.<UserSearchResponse>builder()
            .items(rows.stream().map(this::toUserSearchResponse).toList())
            .page(userPage.getNumber())
            .size(userPage.getSize())
            .totalElements(userPage.getTotalElements())
            .hasNext(userPage.hasNext())
            .nextCursor(nextCursor)
            .build();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> socialShareMeta(Long recipeId) {
        Recipe recipe = recipeRepository.findById(Objects.requireNonNull(recipeId))
                .orElseThrow(() -> new NoSuchElementException("Recipe not found"));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("title", recipe.getTitle());
        payload.put("shareText", "Check out this recipe on CookMate: " + recipe.getTitle());
        payload.put("imageUrl", recipe.getImageUrl());
        payload.put("hashtags", List.of("CookMate", "StudentCooking", "RecipeChallenge"));
        return payload;
    }

    private RecipeChallenge resolveCurrentWeekChallenge() {
        LocalDate today = LocalDate.now();
        return recipeChallengeRepository.findFirstByWeekStartDateLessThanEqualAndWeekEndDateGreaterThanEqualOrderByWeekStartDateDesc(today, today)
                .or(() -> recipeChallengeRepository.findFirstByActiveTrueOrderByWeekStartDateDesc())
                .orElse(null);
    }

    private SocialBadgeResponse badge(String code, String title, String description) {
        return SocialBadgeResponse.builder()
                .code(code)
                .title(title)
                .description(description)
                .build();
    }

    private String extractReason(ContentReportRequest request) {
        String reason = request == null ? null : normalizeText(request.getReason(), 500);
        return reason == null ? "Inappropriate content" : reason;
    }

    private RecipeCommentResponse toCommentResponse(RecipeComment comment) {
        User user = comment.getUser();
        return RecipeCommentResponse.builder()
                .id(comment.getId())
                .recipeId(comment.getRecipe() != null ? comment.getRecipe().getId() : null)
                .userId(user != null ? user.getId() : null)
                .userName(user != null ? user.getName() : "Unknown")
                .comment(comment.getComment())
                .rating(comment.getRating())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    private CookLogResponse toCookLogResponse(CookLogEntry entry) {
        Integer completionPercent = null;
        if (entry.getTotalSteps() != null && entry.getTotalSteps() > 0 && entry.getCompletedSteps() != null) {
            completionPercent = (int) Math.round((entry.getCompletedSteps() * 100.0) / entry.getTotalSteps());
        }

        return CookLogResponse.builder()
                .id(entry.getId())
                .recipeId(entry.getRecipe() != null ? entry.getRecipe().getId() : null)
                .recipeTitle(entry.getRecipeTitleSnapshot())
                .recipeImage(entry.getRecipeImageSnapshot())
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

    private UserSearchResponse toUserSearchResponse(User user) {
        return UserSearchResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .build();
    }

    private int normalizePageSize(Integer size) {
        return Math.min(Math.max(size == null ? 10 : size, 1), 50);
    }

    private Integer sanitizeRating(Integer rating) {
        if (rating == null) {
            return null;
        }
        return Math.max(1, Math.min(5, rating));
    }

    private String normalizeText(String value, int maxLen) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.length() <= maxLen ? trimmed : trimmed.substring(0, maxLen);
    }

    private User resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new IllegalStateException("Missing authenticated user");
        }

        Object principal = authentication.getPrincipal();
        String email;
        if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else {
            email = String.valueOf(principal);
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found"));
    }
}
