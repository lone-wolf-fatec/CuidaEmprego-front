package com.empresa.controleponto.controller;

import com.empresa.controleponto.dto.*;
import com.empresa.controleponto.model.Funcionario;
import com.empresa.controleponto.model.Usuario;
import com.empresa.controleponto.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/funcionario")
@PreAuthorize("hasRole('FUNCIONARIO')")
@RequiredArgsConstructor
public class FuncionarioController {

    private final FuncionarioService funcionarioService;
    private final RegistroPontoService registroPontoService;
    private final FolgaService folgaService;
    private final FeriasService feriasService;
    private final HoraExtraService horaExtraService;
    private final SolicitacaoFuncionarioService solicitacaoService;

    private Funcionario getFuncionarioLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioAtual = (Usuario) auth.getPrincipal();
        return funcionarioService.buscarFuncionarioPorUsuario(usuarioAtual);
    }

    @GetMapping("/perfil")
    public ResponseEntity<FuncionarioDTO> obterPerfil() {
        Funcionario funcionario = getFuncionarioLogado();
        return ResponseEntity.ok(FuncionarioDTO.fromFuncionario(funcionario));
    }

    // Registros de ponto
    @PostMapping("/ponto")
    public ResponseEntity<?> registrarPonto(@Valid @RequestBody RegistroPontoDTO registroPontoDTO) {
        try {
            // Define o funcionário como o usuário logado
            registroPontoDTO.setFuncionarioId(getFuncionarioLogado().getId());
            return ResponseEntity.ok(registroPontoService.registrarPonto(registroPontoDTO));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/ponto")
    public List<RegistroPontoDTO> listarMeusPontos() {
        return registroPontoService.listarPorFuncionario(getFuncionarioLogado().getId());
    }

    @GetMapping("/ponto/data")
    public List<RegistroPontoDTO> listarPontosPorData(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate data) {
        return registroPontoService.listarPorFuncionarioEData(getFuncionarioLogado().getId(), data);
    }

    @GetMapping("/ponto/periodo")
    public List<RegistroPontoDTO> listarPontosPorPeriodo(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime inicio,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss") LocalDateTime fim) {
        return registroPontoService.listarPorPeriodo(getFuncionarioLogado().getId(), inicio, fim);
    }

    // Folgas
    @PostMapping("/folga")
    public ResponseEntity<?> solicitarFolga(@Valid @RequestBody FolgaDTO folgaDTO) {
        try {
            // Define o funcionário como o usuário logado
            folgaDTO.setFuncionarioId(getFuncionarioLogado().getId());
            return ResponseEntity.ok(folgaService.solicitarFolga(folgaDTO));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/folga")
    public List<FolgaDTO> listarMinhasFolgas() {
        return folgaService.listarPorFuncionario(getFuncionarioLogado().getId());
    }

    @DeleteMapping("/folga/{id}")
    public ResponseEntity<?> cancelarFolga(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(folgaService.cancelarFolga(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Férias
    @PostMapping("/ferias")
    public ResponseEntity<?> solicitarFerias(@Valid @RequestBody FeriasDTO feriasDTO) {
        try {
            // Define o funcionário como o usuário logado
            feriasDTO.setFuncionarioId(getFuncionarioLogado().getId());
            return ResponseEntity.ok(feriasService.solicitarFerias(feriasDTO));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/ferias")
    public List<FeriasDTO> listarMinhasFerias() {
        return feriasService.listarPorFuncionario(getFuncionarioLogado().getId());
    }

    @DeleteMapping("/ferias/{id}")
    public ResponseEntity<?> cancelarFerias(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(feriasService.cancelarFerias(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Horas extras
    @PostMapping("/hora-extra")
    public ResponseEntity<?> registrarHoraExtra(@Valid @RequestBody HoraExtraDTO horaExtraDTO) {
        try {
            // Define o funcionário como o usuário logado
            horaExtraDTO.setFuncionarioId(getFuncionarioLogado().getId());
            return ResponseEntity.ok(horaExtraService.registrarHoraExtra(horaExtraDTO));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/hora-extra")
    public List<HoraExtraDTO> listarMinhasHorasExtras() {
        return horaExtraService.listarPorFuncionario(getFuncionarioLogado().getId());
    }

    // Solicitações
    @PostMapping("/solicitacao")
    public ResponseEntity<?> criarSolicitacao(@Valid @RequestBody SolicitacaoFuncionarioDTO solicitacaoDTO) {
        try {
            // Define o funcionário como o usuário logado
            solicitacaoDTO.setFuncionarioId(getFuncionarioLogado().getId());
            return ResponseEntity.ok(solicitacaoService.criarSolicitacao(solicitacaoDTO));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/solicitacao")
    public List<SolicitacaoFuncionarioDTO> listarMinhasSolicitacoes() {
        return solicitacaoService.listarPorFuncionario(getFuncionarioLogado().getId());
    }

    @DeleteMapping("/solicitacao/{id}")
    public ResponseEntity<?> cancelarSolicitacao(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(solicitacaoService.cancelarSolicitacao(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}