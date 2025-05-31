package com.cuidaemprego.repository;

import com.cuidaemprego.model.Correction;
import com.cuidaemprego.model.TimeEntry;
import com.cuidaemprego.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CorrectionRepository extends JpaRepository<Correction, Long> {
    List<Correction> findByEmployeeOrderByRequestDateDesc(User employee);
    List<Correction> findByStatusOrderByRequestDateDesc(String status);
    
    // NOVO: Método exists mais eficiente
    boolean existsByTimeEntryAndStatus(TimeEntry timeEntry, String status);
}