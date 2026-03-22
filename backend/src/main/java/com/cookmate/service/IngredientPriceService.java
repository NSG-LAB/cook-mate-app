package com.cookmate.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class IngredientPriceService {
    
    private final Map<String, Double> basePrices;
    
    public IngredientPriceService() {
        basePrices = new HashMap<>();
        basePrices.put("egg", 6.0);
        basePrices.put("rice", 50.0);
        basePrices.put("milk", 48.0);
        basePrices.put("chicken", 220.0);
        basePrices.put("paneer", 350.0);
        basePrices.put("onion", 40.0);
        basePrices.put("tomato", 30.0);
    }

    public Map<String, Double> getCurrentPrices() {
        // Mock a real integration by applying a +/- 10% daily fluctuation
        Map<String, Double> currentPrices = new HashMap<>();
        Random random = new Random();
        
        for (Map.Entry<String, Double> entry : basePrices.entrySet()) {
            double fluctuation = 0.90 + (0.20 * random.nextDouble()); // between 0.9 and 1.1
            double price = entry.getValue() * fluctuation;
            currentPrices.put(entry.getKey(), Math.round(price * 100.0) / 100.0);
        }
        
        return currentPrices;
    }
}
