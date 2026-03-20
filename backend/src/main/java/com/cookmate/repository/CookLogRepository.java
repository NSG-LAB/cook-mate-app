package com.cookmate.repository;

import com.cookmate.entity.CookLogEntry;
import com.cookmate.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface CookLogRepository extends JpaRepository<CookLogEntry, Long> {
    List<CookLogEntry> findByUserOrderByCookedAtDesc(User user);
    List<CookLogEntry> findTop10ByUserOrderByCookedAtDesc(User user);
    long countByUserAndCookedAtBetween(User user, LocalDateTime start, LocalDateTime end);
    Page<CookLogEntry> findByUserOrderByCookedAtDesc(User user, Pageable pageable);
}
