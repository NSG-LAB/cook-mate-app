package com.cookmate.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class SocialProfileResponse {
    Long userId;
    String name;
    String email;
    long followers;
    long following;
    boolean followingByCurrentUser;
    int totalCookSessions;
    int totalComments;
    List<CookLogResponse> recentCooks;
    List<RecipeCommentResponse> recentComments;
}
