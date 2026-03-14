package com.cookmate.dto;

import lombok.Data;

import java.util.List;

@Data
public class FridgeRequest {
    private List<String> ingredients;
}
