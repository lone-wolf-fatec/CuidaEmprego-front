package com.empresa.controleponto.repository;

import com.empresa.controleponto.model.Funcionario;
import com.empresa.controleponto.model.SolicitacaoFuncionario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SolicitacaoFuncionarioRepository extends JpaRepository<SolicitacaoFuncionario, Long> {
    List<SolicitacaoFuncionario> findByFuncionarioOrderByDataCriacaoDesc(Funcionario funcionario);
    
    List<SolicitacaoFuncionario> findByStatusOrderByDataCriacaoAsc(SolicitacaoFuncionario.StatusSolicitacao status);
    
    List<SolicitacaoFuncionario> findByStatusInOrderByDataCriacaoAsc(List<SolicitacaoFuncionario.StatusSolicitacao> statusList);
    
    List<SolicitacaoFuncionario> findByTipoAndStatusOrderByDataCriacaoAsc(
            SolicitacaoFuncionario.TipoSolicitacao tipo,
            SolicitacaoFuncionario.StatusSolicitacao status);
}