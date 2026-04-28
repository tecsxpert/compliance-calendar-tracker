package com.example.tool.repository;

import com.example.tool.entity.Compliance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ComplianceRepository extends JpaRepository<Compliance, Long> {

    List<Compliance> findByStatus(String status);

    @Query("SELECT c FROM Compliance c WHERE LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Compliance> searchByTitle(@Param("keyword") String keyword);

    List<Compliance> findByDueDateBetween(LocalDate start, LocalDate end);
}
