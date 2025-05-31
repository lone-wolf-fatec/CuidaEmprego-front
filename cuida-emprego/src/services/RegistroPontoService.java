package com.empresa.controleponto.service;

import com.empresa.controleponto.dto.RegistroPontoDTO;
import com.empresa.controleponto.model.Funcionario;
import com.empresa.controleponto.model.RegistroPonto;
import com.empresa.controleponto.model.Usuario;
import com.empresa.controleponto.repository.RegistroPontoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegistroPontoService {

    private final RegistroPontoRepository registroPontoRepository;
    private final FuncionarioService funcionarioService;

    public List<RegistroPontoDTO> listarPorFuncionario(Long funcionarioId) {
        Funcionario funcionario = funcionarioService.buscarFuncionario(funcionarioId);
        
        return registroPontoRepository.findByFuncionarioOrderByDataHoraDesc(funcionario).stream()
                .map(RegistroPontoDTO::fromRegistroPonto)
                .collect(Collectors.toList());
    }
    
    public List<RegistroPontoDTO> listarPorFuncionarioEData(Long funcionarioId, LocalDate data) {
        Funcionario funcionario = funcionarioService.buscarFuncionario(funcionarioId);
        LocalDateTime dataInicio = LocalDateTime.of(data, LocalTime.MIN);
        
        return registroPontoRepository.findByFuncionarioAndData(funcionario, dataInicio).stream()
                .map(RegistroPontoDTO::fromRegistroPonto)
                .collect(Collectors.toList());
    }
    
    public List<RegistroPontoDTO> listarPorPeriodo(Long funcionarioId, LocalDateTime inicio, LocalDateTime fim) {
        Funcionario funcionario = funcionarioService.buscarFuncionario(funcionarioId);
        
        return registroPontoRepository.findByFuncionarioAndDataHoraBetweenOrderByDataHoraAsc(
                funcionario, inicio, fim).stream()
                .map(RegistroPontoDTO::fromRegistroPonto)
                .collect(Collectors.toList());
    }
    
    public List<RegistroPontoDTO> listarNaoValidados() {
        return registroPontoRepository.findByValidadoFalse().stream()
                .map(RegistroPontoDTO::fromRegistroPonto)
                .collect(Collectors.toList());
    }

    @Transactional
    public RegistroPontoDTO registrarPonto(RegistroPontoDTO registroPontoDTO) {
        // Obter usuário autenticado
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioAtual = (Usuario) auth.getPrincipal();
        
        // Buscar funcionário pelo usuário logado
        Funcionario funcionario = funcionarioService.buscarFuncionarioPorUsuario(usuarioAtual);
        
        // Criar registro
        RegistroPonto registroPonto = new RegistroPonto();
        registroPonto.setFuncionario(funcionario);
        registroPonto.setDataHora(LocalDateTime.now());
        registroPonto.setTipoRegistro(registroPontoDTO.getTipoRegistro());
        registroPonto.setObservacao(registroPontoDTO.getObservacao());
        registroPonto.setValidado(false);
        
        RegistroPonto salvo = registroPontoRepository.save(registroPonto);
        return RegistroPontoDTO.fromRegistroPonto(salvo);
    }
    
    @Transactional
    public RegistroPontoDTO validarRegistro(Long id) {
        RegistroPonto registroPonto = registroPontoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro de ponto não encontrado"));
        
        registroPonto.setValidado(true);
        RegistroPonto salvo = registroPontoRepository.save(registroPonto);
        
        return RegistroPontoDTO.fromRegistroPonto(salvo);
    }
    
    @Transactional
    public void excluirRegistro(Long id) {
        RegistroPonto registroPonto = registroPontoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro de ponto não encontrado"));
        
        registroPontoRepository.delete(registroPonto);
    }
}