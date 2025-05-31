package com.cuidaemprego.repository;

import com.cuidaemprego.model.HorasExtras;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HorasExtrasRepository extends JpaRepository<HorasExtras, Long> {
    
    // Busca horas extras do usuário ordenadas por data decrescente
    List<HorasExtras> findByUsuarioIdOrderByDataDesc(Long usuarioId);
    
    // Busca todas as horas extras ordenadas pela data da solicitação decrescente
    List<HorasExtras> findAllByOrderByDataSolicitacaoDesc();
}
