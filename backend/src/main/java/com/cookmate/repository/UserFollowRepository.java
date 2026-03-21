package com.cookmate.repository;

import com.cookmate.entity.User;
import com.cookmate.entity.UserFollow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {
    boolean existsByFollowerAndFollowing(User follower, User following);
    Optional<UserFollow> findByFollowerAndFollowing(User follower, User following);
    long countByFollower(User follower);
    long countByFollowing(User following);
    List<UserFollow> findByFollowerOrderByCreatedAtDesc(User follower);
}
