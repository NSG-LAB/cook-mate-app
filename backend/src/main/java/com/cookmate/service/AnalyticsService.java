package com.cookmate.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {
    
    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // 1. Most Cooked
        TypedQuery<Object[]> mostCookedQuery = entityManager.createQuery(
                "SELECT r.title, COUNT(c) as cnt FROM CookLogEntry c JOIN c.recipe r " +
                "GROUP BY r.id, r.title ORDER BY cnt DESC", Object[].class);
        mostCookedQuery.setMaxResults(5);
        List<Object[]> mostCookedList = mostCookedQuery.getResultList();
        List<String> mostCookedTitles = mostCookedList.stream()
                .map(row -> (String) row[0])
                .collect(Collectors.toList());
        stats.put("mostCooked", mostCookedTitles);

        // 2. Most Commented (as a proxy for "mostSaved" or similar interaction)
        TypedQuery<Object[]> mostCommentedQuery = entityManager.createQuery(
                "SELECT r.title, COUNT(c) as cnt FROM RecipeComment c JOIN c.recipe r " +
                "GROUP BY r.id, r.title ORDER BY cnt DESC", Object[].class);
        mostCommentedQuery.setMaxResults(5);
        List<Object[]> mostCommentedList = mostCommentedQuery.getResultList();
        List<String> mostCommentedTitles = mostCommentedList.stream()
                .map(row -> (String) row[0])
                .collect(Collectors.toList());
        stats.put("mostInteracted", mostCommentedTitles);

        // 3. Drop-off points (Avg completed steps / total steps)
        // Here we just find common completed_steps values where users stop before total_steps
        TypedQuery<Object[]> dropOffQuery = entityManager.createQuery(
                "SELECT c.completedSteps, COUNT(c) as cnt FROM CookLogEntry c " +
                "WHERE c.completedSteps < c.totalSteps " +
                "GROUP BY c.completedSteps ORDER BY cnt DESC", Object[].class);
        dropOffQuery.setMaxResults(3);
        List<Object[]> dropOffList = dropOffQuery.getResultList();
        List<Integer> dropOffPoints = dropOffList.stream()
                .map(row -> (Integer) row[0])
                .collect(Collectors.toList());
        stats.put("dropOffPoints", dropOffPoints);

        return stats;
    }
}
