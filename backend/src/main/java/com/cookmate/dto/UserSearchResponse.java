package com.cookmate.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserSearchResponse {
    Long userId;
    String name;
    String email;
}
