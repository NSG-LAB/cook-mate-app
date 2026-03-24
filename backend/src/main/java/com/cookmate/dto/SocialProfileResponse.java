package com.cookmate.dto;

import java.util.List;

public class SocialProfileResponse {
    private Long userId;
    private String name;
    private String email;
    private long followers;
    private long following;
    private boolean followingByCurrentUser;
    private int totalCookSessions;
    private int totalComments;
    private List<CookLogResponse> recentCooks;
    private List<RecipeCommentResponse> recentComments;

    public SocialProfileResponse() {}

    public SocialProfileResponse(Long userId, String name, String email, long followers, long following, boolean followingByCurrentUser, int totalCookSessions, int totalComments, List<CookLogResponse> recentCooks, List<RecipeCommentResponse> recentComments) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.followers = followers;
        this.following = following;
        this.followingByCurrentUser = followingByCurrentUser;
        this.totalCookSessions = totalCookSessions;
        this.totalComments = totalComments;
        this.recentCooks = recentCooks;
        this.recentComments = recentComments;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public long getFollowers() { return followers; }
    public void setFollowers(long followers) { this.followers = followers; }

    public long getFollowing() { return following; }
    public void setFollowing(long following) { this.following = following; }

    public boolean isFollowingByCurrentUser() { return followingByCurrentUser; }
    public void setFollowingByCurrentUser(boolean followingByCurrentUser) { this.followingByCurrentUser = followingByCurrentUser; }

    public int getTotalCookSessions() { return totalCookSessions; }
    public void setTotalCookSessions(int totalCookSessions) { this.totalCookSessions = totalCookSessions; }

    public int getTotalComments() { return totalComments; }
    public void setTotalComments(int totalComments) { this.totalComments = totalComments; }

    public List<CookLogResponse> getRecentCooks() { return recentCooks; }
    public void setRecentCooks(List<CookLogResponse> recentCooks) { this.recentCooks = recentCooks; }

    public List<RecipeCommentResponse> getRecentComments() { return recentComments; }
    public void setRecentComments(List<RecipeCommentResponse> recentComments) { this.recentComments = recentComments; }
}
