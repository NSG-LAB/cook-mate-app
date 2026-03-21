package com.cookmate.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class SocialPageResponse<T> {
    List<T> items;
    Integer page;
    int size;
    long totalElements;
    boolean hasNext;
    Long nextCursor;
}