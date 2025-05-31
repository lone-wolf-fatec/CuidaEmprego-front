package com.cuidaemprego.repository;

import com.cuidaemprego.model.Notificacoes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificacoesRepository extends JpaRepository<Notificacoes, Long> {
    
    @Query("SELECT n FROM Notificacoes n WHERE n.usuarioId = :usuarioId ORDER BY n.dataEnvio DESC")
    List<Notificacoes> findByUsuarioIdOrderByDataEnvioDesc(@Param("usuarioId") Long usuarioId);
    
    @Query("SELECT n FROM Notificacoes n WHERE n.destinatario = 'ADMIN' ORDER BY n.dataEnvio DESC")
    List<Notificacoes> findAdminNotifications();
    
    @Query("SELECT n FROM Notificacoes n ORDER BY n.dataEnvio DESC")
    List<Notificacoes> findAllOrderByDataEnvioDesc();
}