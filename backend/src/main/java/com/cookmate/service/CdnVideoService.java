package com.cookmate.service;

import org.springframework.stereotype.Service;

@Service
public class CdnVideoService {
    public String getVideoUrl(String recipeId) {
        return "https://cdn.example.com/videos/" + recipeId + ".mp4";
    }
}
