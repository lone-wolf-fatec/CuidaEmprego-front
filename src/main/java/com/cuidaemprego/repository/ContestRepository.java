package com.cuidaemprego.repository;

import com.cuidaemprego.model.Contest;
import com.cuidaemprego.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ContestRepository extends JpaRepository<Contest, Long> {
    List<Contest> findByEmployeeOrderByContestDateDesc(User employee);
    List<Contest> findByStatusOrderByContestDateDesc(String status);
    
    // NOVOS: Métodos count mais eficientes
    long countByEmployee(User employee);
    long countByEmployeeAndStatus(User employee, String status);
}
