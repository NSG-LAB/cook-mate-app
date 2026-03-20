package com.cookmate.controller;

import com.cookmate.dto.CookLogRequest;
import com.cookmate.dto.CookLogResponse;
import com.cookmate.dto.CookLogSummaryResponse;
import com.cookmate.dto.PagedResponse;
import com.cookmate.service.CookLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cook-log")
@RequiredArgsConstructor
public class CookLogController {

    private final CookLogService cookLogService;

    @PostMapping
    public ResponseEntity<CookLogResponse> logCook(@RequestBody CookLogRequest request) {
        return ResponseEntity.ok(cookLogService.logCook(request));
    }

    @GetMapping
    public ResponseEntity<PagedResponse<CookLogResponse>> history(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(cookLogService.getHistory(page, size));
    }

    @GetMapping("/summary")
    public ResponseEntity<CookLogSummaryResponse> summary() {
        return ResponseEntity.ok(cookLogService.getSummary());
    }
}
