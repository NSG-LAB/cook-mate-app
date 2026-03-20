package com.cookmate.dto;

import com.cookmate.entity.RecipeModerationStatus;
import lombok.Data;

@Data
public class RecipeModerationRequest {
    private RecipeModerationStatus status;
    private String moderationNotes;
    private String reviewer;
}
