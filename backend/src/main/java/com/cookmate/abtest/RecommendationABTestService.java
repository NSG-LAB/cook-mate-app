package com.cookmate.abtest;

import org.springframework.stereotype.Service;
import java.util.Random;

@Service
public class RecommendationABTestService {
    private final Random random = new Random();

    public String getRecommendationAlgorithmVariant(String userId) {
        return random.nextBoolean() ? "baseline" : "experimental";
    }
}
