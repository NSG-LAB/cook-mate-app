package com.cookmate.controller;

import com.cookmate.dto.SocialChallengeResponse;
import com.cookmate.dto.SimpleMessageResponse;
import com.cookmate.dto.ChallengeParticipationRequest;
import com.cookmate.dto.SocialBadgeResponse;
import com.cookmate.dto.SocialPageResponse;
import com.cookmate.dto.RecipeCommentResponse;
import com.cookmate.dto.RecipeCommentRequest;
import com.cookmate.dto.ContentReportRequest;
import com.cookmate.dto.SocialProfileResponse;
import com.cookmate.dto.UserSearchResponse;
import com.cookmate.service.SocialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class SocialController {

    private final SocialService socialService;

    @GetMapping("/challenge/featured")
    public ResponseEntity<SocialChallengeResponse> featuredChallenge() {
        return ResponseEntity.ok(socialService.getFeaturedChallenge());
    }

    @PostMapping("/challenge/participate")
    public ResponseEntity<SimpleMessageResponse> participateChallenge(@RequestBody(required = false) ChallengeParticipationRequest request) {
        return ResponseEntity.ok(socialService.participateFeaturedChallenge(request));
    }

    @GetMapping("/badges")
    public ResponseEntity<List<SocialBadgeResponse>> badges() {
        return ResponseEntity.ok(socialService.getBadges());
    }

    @GetMapping("/recipes/{recipeId}/comments")
    public ResponseEntity<SocialPageResponse<RecipeCommentResponse>> recipeComments(
            @PathVariable Long recipeId,
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long cursor
    ) {
        return ResponseEntity.ok(socialService.getRecipeComments(recipeId, page, size, cursor));
    }

    @PostMapping("/recipes/{recipeId}/comments")
    public ResponseEntity<RecipeCommentResponse> addComment(@PathVariable Long recipeId, @RequestBody RecipeCommentRequest request) {
        return ResponseEntity.ok(socialService.addRecipeComment(recipeId, request));
    }

    @PostMapping("/recipes/{recipeId}/report")
    public ResponseEntity<SimpleMessageResponse> reportRecipe(@PathVariable Long recipeId, @RequestBody(required = false) ContentReportRequest request) {
        return ResponseEntity.ok(socialService.reportRecipe(recipeId, request));
    }

    @PostMapping("/comments/{commentId}/report")
    public ResponseEntity<SimpleMessageResponse> reportComment(@PathVariable Long commentId, @RequestBody(required = false) ContentReportRequest request) {
        return ResponseEntity.ok(socialService.reportComment(commentId, request));
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<SocialProfileResponse> profile(@PathVariable Long userId) {
        return ResponseEntity.ok(socialService.getProfile(userId));
    }

    @GetMapping("/profile/me")
    public ResponseEntity<SocialProfileResponse> myProfile() {
        return ResponseEntity.ok(socialService.getMyProfile());
    }

    @PostMapping("/follow/{userId}")
    public ResponseEntity<SimpleMessageResponse> follow(@PathVariable Long userId) {
        return ResponseEntity.ok(socialService.followUser(userId));
    }

    @DeleteMapping("/follow/{userId}")
    public ResponseEntity<SimpleMessageResponse> unfollow(@PathVariable Long userId) {
        return ResponseEntity.ok(socialService.unfollowUser(userId));
    }

    @GetMapping("/users/search")
    public ResponseEntity<SocialPageResponse<UserSearchResponse>> searchUsers(
            @RequestParam String query,
            @RequestParam(required = false) Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long cursor
    ) {
        return ResponseEntity.ok(socialService.searchUsers(query, page, size, cursor));
    }

    @GetMapping("/recipes/{recipeId}/share")
    public ResponseEntity<Map<String, Object>> shareMeta(@PathVariable Long recipeId) {
        return ResponseEntity.ok(socialService.socialShareMeta(recipeId));
    }
}
