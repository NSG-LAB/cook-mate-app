package com.cookmate.repository;

import com.cookmate.entity.RecipeChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface RecipeChallengeRepository extends JpaRepository<RecipeChallenge, Long> {
    Optional<RecipeChallenge> findFirstByActiveTrueOrderByWeekStartDateDesc();
    Optional<RecipeChallenge> findFirstByWeekStartDateLessThanEqualAndWeekEndDateGreaterThanEqualOrderByWeekStartDateDesc(LocalDate today1, LocalDate today2);
}
