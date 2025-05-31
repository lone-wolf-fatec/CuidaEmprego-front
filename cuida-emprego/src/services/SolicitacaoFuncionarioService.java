package com.empresa.controleponto.service;

import com.empresa.controleponto.dto.SolicitacaoFuncionarioDTO;
import com.empresa.controleponto.model.Funcionario;
import com.empresa.controleponto.model.SolicitacaoFuncionario;
import com.empresa.controleponto.model.Usuario;
import com.empresa.controleponto.repository.SolicitacaoFuncionarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SolicitacaoFuncionarioService {

    private final SolicitacaoFuncionarioRepository solicitacaoRepository;
    private final FuncionarioService funcionarioService;
    private final UsuarioService usuarioService;

    public List<SolicitacaoFuncionarioDTO> listarPorFuncionario(Long funcionarioId) {
        Funcionario funcionario = funcionarioService.buscarFuncionario(funcionarioId);
        
        return solicitacaoRepository.findByFuncionarioOrderByDataCriacaoDesc(funcionario).stream()
                .map(SolicitacaoFuncionarioDTO::fromSolicitacao)
                .collect(Collectors.toList());
    }
    
    public List<SolicitacaoFuncionarioDTO> listarAbertas() {
        List<SolicitacaoFuncionario.StatusSolicitacao> statusList = Arrays.asList(
                SolicitacaoFuncionario.StatusSolicitacao.ABERTA,
                SolicitacaoFuncionario.StatusSolicitacao.EM_ANALISE
        );
        
        return solicitacaoRepository.findByStatusInOrderByDataCriacaoAsc(statusList).stream()
                .map(SolicitacaoFuncionarioDTO::fromSolicitacao)
                .collect(Collectors.toList());
    }
    
    public SolicitacaoFuncionarioDTO buscarPorId(Long id) {
        SolicitacaoFuncionario solicitacao = solicitacaoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitação não encontrada"));
        
        return SolicitacaoFuncionarioDTO.fromSolicitacao(solicitacao);
    }

    @Transactional
    public SolicitacaoFuncionarioDTO criarSolicitacao(SolicitacaoFuncionarioDTO solicitacaoDTO) {
        // Obter funcionário
        Funcionario funcionario = funcionarioService.buscarFuncionario(solicitacaoDTO.getFuncionarioId());
        
        // Criar solicitação
        SolicitacaoFuncionario solicitacao = new SolicitacaoFuncionario();
        solicitacao.setFuncionario(funcionario);
        solicitacao.setDataCriacao(LocalDateTime.now());
        solicitacao.setTipo(solicitacaoDTO.getTipo());
        solicitacao.setStatus(SolicitacaoFuncionario.StatusSolicitacao.ABERTA);
        solicitacao.setDescricao(solicitacaoDTO.getDescricao());
        
        SolicitacaoFuncionario salva = solicitacaoRepository.save(solicitacao);
        return SolicitacaoFuncionarioDTO.fromSolicitacao(salva);
    }
    
    @Transactional
    public SolicitacaoFuncionarioDTO iniciarAnalise(Long id) {
        SolicitacaoFuncionario solicitacao = solicitacaoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitação não encontrada"));
        
        if (solicitacao.getStatus() != SolicitacaoFuncionario.StatusSolicitacao.ABERTA) {
            throw new RuntimeException("Solicitação não está aberta");
        }
        
        solicitacao.setStatus(SolicitacaoFuncionario.StatusSolicitacao.EM_ANALISE);
        
        SolicitacaoFuncionario salva = solicitacaoRepository.save(solicitacao);
        return SolicitacaoFuncionarioDTO.fromSolicitacao(salva);
    }
    
    @Transactional
    public SolicitacaoFuncionarioDTO responderSolicitacao(Long id, String resposta, boolean aceitar) {
        SolicitacaoFuncionario solicitacao = solicitacaoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitação não encontrada"));
        
        // Obter usuário autenticado (admin)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioAtual = (Usuario) auth.getPrincipal();
        
        solicitacao.setStatus(aceitar 
                ? SolicitacaoFuncionario.StatusSolicitacao.CONCLUIDA
                : SolicitacaoFuncionario.StatusSolicitacao.REJEITADA);
        solicitacao.setResposta(resposta);
        solicitacao.setRespondente(usuarioAtual);
        solicitacao.setDataResposta(LocalDateTime.now());
        
        SolicitacaoFuncionario salva = solicitacaoRepository.save(solicitacao);
        return SolicitacaoFuncionarioDTO.fromSolicitacao(salva);
    }
    
    @Transactional
    public SolicitacaoFuncionarioDTO cancelarSolicitacao(Long id) {
        SolicitacaoFuncionario solicitacao = solicitacaoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Solicitação não encontrada"));
        
        if (solicitacao.getStatus() != SolicitacaoFuncionario.StatusSolicitacao.ABERTA && 
                solicitacao.getStatus() != SolicitacaoFuncionario.StatusSolicitacao.EM_ANALISE) {
            throw new RuntimeException("Solicitação não pode ser cancelada no status atual");
        }
        
        solicitacao.setStatus(SolicitacaoFuncionario.StatusSolicitacao.CANCELADA);
        
        SolicitacaoFuncionario salva = solicitacaoRepository.save(solicitacao);
        return SolicitacaoFuncionarioDTO.fromSolicitacao(salva);
    }
}