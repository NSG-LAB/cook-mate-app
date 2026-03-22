package com.cookmate.controller;

import com.cookmate.service.IngredientPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/prices")
@RequiredArgsConstructor
public class IngredientPriceController {
    private final IngredientPriceService priceService;

    @GetMapping
    public Map<String, Double> getPrices() {
        return priceService.getCurrentPrices();
    }
}
