package com.cookmate.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class CookLogSummaryResponse {
    int sessionsThisWeek;
    int minutesThisWeek;
    int streakDays;
    Double averageRating;
    String favoriteRegion;
    List<CookLogResponse> recentEntries;
}
