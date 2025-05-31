package com.cuidaemprego.repository;

import com.cuidaemprego.model.TimeEntry;
import com.cuidaemprego.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {
    Page<TimeEntry> findByEmployeeOrderByCreatedAtDesc(User employee, Pageable pageable);
    List<TimeEntry> findByEmployeeAndDateBetweenOrderByDateDesc(User employee, LocalDate start, LocalDate end);
    void deleteByEmployee(User employee);
}
