package com.cookmate.repository;

import com.cookmate.entity.ChallengeParticipation;
import com.cookmate.entity.RecipeChallenge;
import com.cookmate.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChallengeParticipationRepository extends JpaRepository<ChallengeParticipation, Long> {
    boolean existsByChallengeAndUser(RecipeChallenge challenge, User user);
    long countByUser(User user);
    List<ChallengeParticipation> findTop10ByUserOrderByParticipatedAtDesc(User user);
}
