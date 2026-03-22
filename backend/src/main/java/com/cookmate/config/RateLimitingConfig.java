package com.cookmate.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class RateLimitingConfig {

    @Component
    public static class RateLimitFilter implements Filter {

        private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

        private Bucket newBucket() {
            // 20 requests per minute
            Bandwidth limit = Bandwidth.builder()
                .capacity(20)
                .refillGreedy(20, Duration.ofMinutes(1))
                .build();
            return Bucket.builder().addLimit(limit).build();
        }

        @Override
        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                throws IOException, ServletException {
            HttpServletRequest httpReq = (HttpServletRequest) request;
            String ip = httpReq.getRemoteAddr();

            Bucket bucket = cache.computeIfAbsent(ip, k -> newBucket());

            if (bucket.tryConsume(1)) {
                chain.doFilter(request, response);
            } else {
                HttpServletResponse httpRes = (HttpServletResponse) response;
                httpRes.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                httpRes.getWriter().write("Too many requests. Please try again later.");
            }
        }
    }
}
