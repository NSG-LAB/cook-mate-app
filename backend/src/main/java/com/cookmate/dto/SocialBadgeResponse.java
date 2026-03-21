package com.cookmate.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class SocialBadgeResponse {
    String code;
    String title;
    String description;
}
