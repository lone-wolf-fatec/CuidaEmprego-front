package com.cuidaemprego.repository;

import com.cuidaemprego.model.Ferias;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FeriasRepository extends JpaRepository<Ferias, Long> {
}
