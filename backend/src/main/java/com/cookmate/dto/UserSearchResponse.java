package com.cookmate.dto;

public class UserSearchResponse {
    private Long userId;
    private String name;
    private String email;

    public UserSearchResponse() {}

    public UserSearchResponse(Long userId, String name, String email) {
        this.userId = userId;
        this.name = name;
        this.email = email;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
