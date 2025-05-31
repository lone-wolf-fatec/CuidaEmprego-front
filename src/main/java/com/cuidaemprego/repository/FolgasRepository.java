package com.cuidaemprego.repository;

import com.cuidaemprego.model.Folgas;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FolgasRepository extends JpaRepository<Folgas, Long> {

    List<Folgas> findByUsuarioId(Long usuarioId);

    List<Folgas> findByData(LocalDate data);

    List<Folgas> findByDataBetween(LocalDate inicio, LocalDate fim);

    List<Folgas> findByAprovadaIsFalseAndDataBefore(LocalDate data);

    Optional<Folgas> findFirstByUsuarioIdAndAprovadaIsTrueAndDataAfterOrderByDataAsc(Long usuarioId, LocalDate data);

    @Query("SELECT f.tipo, COUNT(f) FROM Folgas f WHERE f.usuarioId = :usuarioId GROUP BY f.tipo")
    List<Object[]> countFolgasPorTipo(Long usuarioId);
}
