package com.empresa.controleponto.service;

import com.empresa.controleponto.dto.FeriasDTO;
import com.empresa.controleponto.model.Ferias;
import com.empresa.controleponto.model.Funcionario;
import com.empresa.controleponto.model.Usuario;
import com.empresa.controleponto.repository.FeriasRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeriasService {

    private final FeriasRepository feriasRepository;
    private final FuncionarioService funcionarioService;
    private final UsuarioService usuarioService;

    public List<FeriasDTO> listarPorFuncionario(Long funcionarioId) {
        Funcionario funcionario = funcionarioService.buscarFuncionario(funcionarioId);
        
        return feriasRepository.findByFuncionarioOrderByDataInicioDesc(funcionario).stream()
                .map(FeriasDTO::fromFerias)
                .collect(Collectors.toList());
    }
    
    public List<FeriasDTO> listarPendentes() {
        return feriasRepository.findByStatusOrderByDataInicio(Ferias.StatusFerias.PENDENTE).stream()
                .map(FeriasDTO::fromFerias)
                .collect(Collectors.toList());
    }
    
    public FeriasDTO buscarPorId(Long id) {
        Ferias ferias = feriasRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Férias não encontradas"));
        
        return FeriasDTO.fromFerias(ferias);
    }

    @Transactional
    public FeriasDTO solicitarFerias(FeriasDTO feriasDTO) {
        // Verificar se as datas são válidas
        if (feriasDTO.getDataInicio().isAfter(feriasDTO.getDataFim())) {
            throw new RuntimeException("Data de início deve ser anterior à data de fim");
        }
        
        // Verificar se a data de início é futura
        if (feriasDTO.getDataInicio().isBefore(LocalDate.now().plusDays(30))) {
            throw new RuntimeException("Data de início deve ser com pelo menos 30 dias de antecedência");
        }
        
        // Obter funcionário
        Funcionario funcionario = funcionarioService.buscarFuncionario(feriasDTO.getFuncionarioId());
        
        // Verificar se há conflitos com outras férias
        List<Ferias> feriasConflitantes = feriasRepository.findFeriasConflitantes(
                funcionario, feriasDTO.getDataInicio(), feriasDTO.getDataFim());
        
        if (!feriasConflitantes.isEmpty()) {
            throw new RuntimeException("Existe conflito com outras férias já registradas");
        }
        
        // Verificar período aquisitivo
        List<Ferias> feriasPeriodoAquisitivo = feriasRepository.findByFuncionarioAndPeriodoAquisitivo(
                funcionario, feriasDTO.getPeriodoAquisitivo());
        
        int diasJaTirados = feriasPeriodoAquisitivo.stream()
                .filter(f -> f.getStatus() == Ferias.StatusFerias.APROVADA || f.getStatus() == Ferias.StatusFerias.CONCLUIDA)
                .mapToInt(Ferias::getDiasUteis)
                .sum();
        
        if (diasJaTirados + feriasDTO.getDiasUteis() > 30) {
            throw new RuntimeException("Excede o limite de 30 dias para o período aquisitivo");
        }
        
        // Calcular dias úteis (aqui simplificado, em uma implementação real consideraria feriados)
        Period periodo = Period.between(feriasDTO.getDataInicio(), feriasDTO.getDataFim());
        int diasTotais = periodo.getDays() + 1;
        
        // Criar férias
        Ferias ferias = new Ferias();
        ferias.setFuncionario(funcionario);
        ferias.setDataInicio(feriasDTO.getDataInicio());
        ferias.setDataFim(feriasDTO.getDataFim());
        ferias.setDiasUteis(feriasDTO.getDiasUteis());
        ferias.setStatus(Ferias.StatusFerias.PENDENTE);
        ferias.setObservacao(feriasDTO.getObservacao());
        ferias.setPeriodoAquisitivo(feriasDTO.getPeriodoAquisitivo());
        ferias.setAdiantamento13(feriasDTO.isAdiantamento13());
        ferias.setVendaUmTerco(feriasDTO.isVendaUmTerco());
        
        Ferias salva = feriasRepository.save(ferias);
        return FeriasDTO.fromFerias(salva);
    }
    
    @Transactional
    public FeriasDTO aprovarFerias(Long id, String observacao) {
        Ferias ferias = feriasRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Férias não encontradas"));
        
        // Obter usuário autenticado (admin)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioAtual = (Usuario) auth.getPrincipal();
        
        ferias.setStatus(Ferias.StatusFerias.APROVADA);
        ferias.setObservacao(observacao);
        ferias.setAprovador(usuarioAtual);
        
        Ferias salva = feriasRepository.save(ferias);
        return FeriasDTO.fromFerias(salva);
    }
    
    @Transactional
    public FeriasDTO rejeitarFerias(Long id, String observacao) {
        Ferias ferias = feriasRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Férias não encontradas"));
        
        // Obter usuário autenticado (admin)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioAtual = (Usuario) auth.getPrincipal();
        
        ferias.setStatus(Ferias.StatusFerias.REJEITADA);
        ferias.setObservacao(observacao);
        ferias.setAprovador(usuarioAtual);
        
        Ferias salva = feriasRepository.save(ferias);
        return FeriasDTO.fromFerias(salva);
    }
    
    @Transactional
    public FeriasDTO concluirFerias(Long id) {
        Ferias ferias = feriasRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Férias não encontradas"));
        
        // Verificar se as férias estão aprovadas e já passaram
        if (ferias.getStatus() != Ferias.StatusFerias.APROVADA) {
            throw new RuntimeException("Férias não estão aprovadas");
        }
        
        if (ferias.getDataFim().isAfter(LocalDate.now())) {
            throw new RuntimeException("Férias ainda não foram concluídas");
        }
        
        ferias.setStatus(Ferias.StatusFerias.CONCLUIDA);
        
        Ferias salva = feriasRepository.save(ferias);
        return FeriasDTO.fromFerias(salva);
    }
    
    @Transactional
    public FeriasDTO cancelarFerias(Long id) {
        Ferias ferias = feriasRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Férias não encontradas"));
        
        // Verificar se as férias já iniciaram
        if (ferias.getStatus() == Ferias.StatusFerias.APROVADA && 
                ferias.getDataInicio().isBefore(LocalDate.now())) {
            throw new RuntimeException("Férias já iniciadas não podem ser canceladas");
        }
        
        ferias.setStatus(Ferias.StatusFerias.CANCELADA);
        
        Ferias salva = feriasRepository.save(ferias);
        return FeriasDTO.fromFerias(salva);
    }
}