package com.empresa.controleponto.service;

import com.empresa.controleponto.dto.FolgaDTO;
import com.empresa.controleponto.model.Folga;
import com.empresa.controleponto.model.Funcionario;
import com.empresa.controleponto.model.Usuario;
import com.empresa.controleponto.repository.FolgaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FolgaService {

    private final FolgaRepository folgaRepository;
    private final FuncionarioService funcionarioService;
    private final UsuarioService usuarioService;

    public List<FolgaDTO> listarPorFuncionario(Long funcionarioId) {
        Funcionario funcionario = funcionarioService.buscarFuncionario(funcionarioId);
        
        return folgaRepository.findByFuncionarioOrderByDataInicioDesc(funcionario).stream()
                .map(FolgaDTO::fromFolga)
                .collect(Collectors.toList());
    }
    
    public List<FolgaDTO> listarPendentes() {
        return folgaRepository.findByStatus(Folga.StatusFolga.PENDENTE).stream()
                .map(FolgaDTO::fromFolga)
                .collect(Collectors.toList());
    }
    
    public FolgaDTO buscarPorId(Long id) {
        Folga folga = folgaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folga não encontrada"));
        
        return FolgaDTO.fromFolga(folga);
    }

    @Transactional
    public FolgaDTO solicitarFolga(FolgaDTO folgaDTO) {
        // Verificar se as datas são válidas
        if (folgaDTO.getDataInicio().isAfter(folgaDTO.getDataFim())) {
            throw new RuntimeException("Data de início deve ser anterior à data de fim");
        }
        
        // Verificar se a data de início é futura
        if (folgaDTO.getDataInicio().isBefore(LocalDate.now())) {
            throw new RuntimeException("Data de início deve ser futura");
        }
        
        // Obter funcionário
        Funcionario funcionario = funcionarioService.buscarFuncionario(folgaDTO.getFuncionarioId());
        
        // Verificar se há conflitos com outras folgas
        List<Folga> folgasConflitantes = folgaRepository.findFolgasConflitantes(
                funcionario, folgaDTO.getDataInicio(), folgaDTO.getDataFim());
        
        if (!folgasConflitantes.isEmpty()) {
            throw new RuntimeException("Existe conflito com outras folgas/férias já registradas");
        }
        
        // Criar folga
        Folga folga = new Folga();
        folga.setFuncionario(funcionario);
        folga.setDataInicio(folgaDTO.getDataInicio());
        folga.setDataFim(folgaDTO.getDataFim());
        folga.setTipoFolga(folgaDTO.getTipoFolga());
        folga.setStatus(Folga.StatusFolga.PENDENTE);
        folga.setMotivo(folgaDTO.getMotivo());
        
        Folga salva = folgaRepository.save(folga);
        return FolgaDTO.fromFolga(salva);
    }
    
    @Transactional
    public FolgaDTO aprovarFolga(Long id, String observacao) {
        Folga folga = folgaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folga não encontrada"));
        
        // Obter usuário autenticado (admin)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioAtual = (Usuario) auth.getPrincipal();
        
        // Verificar se é banco de horas e deduzir do saldo
        if (folga.getTipoFolga() == Folga.TipoFolga.BANCO_HORAS) {
            Funcionario funcionario = folga.getFuncionario();
            long dias = ChronoUnit.DAYS.between(folga.getDataInicio(), folga.getDataFim()) + 1;
            int minutos = (int) (dias * 8 * 60); // 8 horas por dia em minutos
            
            if (funcionario.getSaldoBancoHoras() < minutos) {
                throw new RuntimeException("Saldo de banco de horas insuficiente");
            }
            
            funcionario.setSaldoBancoHoras(funcionario.getSaldoBancoHoras() - minutos);
            funcionarioService.atualizarSaldoBancoHoras(funcionario.getId(), funcionario.getSaldoBancoHoras());
        }
        
        folga.setStatus(Folga.StatusFolga.APROVADA);
        folga.setObservacao(observacao);
        folga.setAprovador(usuarioAtual);
        
        Folga salva = folgaRepository.save(folga);
        return FolgaDTO.fromFolga(salva);
    }
    
    @Transactional
    public FolgaDTO rejeitarFolga(Long id, String observacao) {
        Folga folga = folgaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folga não encontrada"));
        
        // Obter usuário autenticado (admin)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioAtual = (Usuario) auth.getPrincipal();
        
        folga.setStatus(Folga.StatusFolga.REJEITADA);
        folga.setObservacao(observacao);
        folga.setAprovador(usuarioAtual);
        
        Folga salva = folgaRepository.save(folga);
        return FolgaDTO.fromFolga(salva);
    }
    
    @Transactional
    public FolgaDTO cancelarFolga(Long id) {
        Folga folga = folgaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folga não encontrada"));
        
        // Verificar se a folga já foi aprovada e é do tipo banco de horas para retornar o saldo
        if (folga.getStatus() == Folga.StatusFolga.APROVADA && 
                folga.getTipoFolga() == Folga.TipoFolga.BANCO_HORAS) {
            
            Funcionario funcionario = folga.getFuncionario();
            long dias = ChronoUnit.DAYS.between(folga.getDataInicio(), folga.getDataFim()) + 1;
            int minutos = (int) (dias * 8 * 60); // 8 horas por dia em minutos
            
            funcionario.setSaldoBancoHoras(funcionario.getSaldoBancoHoras() + minutos);
            funcionarioService.atualizarSaldoBancoHoras(funcionario.getId(), funcionario.getSaldoBancoHoras());
        }
        
        folga.setStatus(Folga.StatusFolga.CANCELADA);
        
        Folga salva = folgaRepository.save(folga);
        return FolgaDTO.fromFolga(salva);
    }
}