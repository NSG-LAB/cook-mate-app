package com.cookmate.repository;

import com.cookmate.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("""
            select u
            from User u
            where lower(coalesce(u.name, '')) like lower(concat('%', :query, '%'))
               or lower(coalesce(u.email, '')) like lower(concat('%', :query, '%'))
            """)
    Page<User> searchByQuery(@Param("query") String query, Pageable pageable);

    @Query("""
            select u
            from User u
            where (
                lower(coalesce(u.name, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(u.email, '')) like lower(concat('%', :query, '%'))
            )
            and u.id > :cursor
            order by u.id asc
            """)
    List<User> searchByQueryAfterCursor(@Param("query") String query, @Param("cursor") Long cursor, Pageable pageable);
}
