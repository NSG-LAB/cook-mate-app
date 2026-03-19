package com.cookmate.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VideoStepLinkResponse {
    private Integer stepNumber;
    private Integer seconds;
    private String label;
    private String url;
}
