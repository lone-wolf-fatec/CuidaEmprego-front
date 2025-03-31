package com.empresa.controleponto.controller;

import com.empresa.controleponto.dto.*;
import com.empresa.controleponto.model.SolicitacaoFuncionario;
import com.empresa.controleponto.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller para o administrador gerenciar Horas Extras, Férias e Folgas
 * dos funcionários e responder a solicitações de revisão
 */
@RestController
@RequestMapping("/api/admin/gestao-tempo")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminGestaoTempoController {

    private final FuncionarioService funcionarioService;
    private final HoraExtraService horaExtraService;
    private final FeriasService feriasService;
    private final FolgaService folgaService;
    private final SolicitacaoFuncionarioService solicitacaoService;
    private final RegistroPontoService registroPontoService;

    /**
     * Retorna dados resumidos para o dashboard do administrador
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        Map<String, Object> response = new HashMap<>();
        
        // Contagem de itens pendentes
        response.put("folgasPendentes", folgaService.listarPendentes().size());
        response.put("feriasPendentes", feriasService.listarPendentes().size());
        response.put("horasExtrasPendentes", horaExtraService.listarPendentes().size());
        response.put("solicitacoesRevisaoPendentes", solicitacaoService.listarAbertas().size());
        
        // Lista de funcionários para selecionar
        List<FuncionarioDTO> funcionarios = funcionarioService.listarTodos();
        response.put("funcionarios", funcionarios);
        
        // Pontos não validados
        response.put("pontosNaoValidados", registroPontoService.listarNaoValidados().size());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Listar todos os funcionários com informações resumidas
     */
    @GetMapping("/funcionarios")
    public ResponseEntity<List<FuncionarioDTO>> listarTodosFuncionarios() {
        List<FuncionarioDTO> funcionarios = funcionarioService.listarTodos();
        return ResponseEntity.ok(funcionarios);
    }
    
    /**
     * Buscar todos os dados de gestão de tempo para um funcionário específico
     */
    @GetMapping("/funcionario/{id}")
    public ResponseEntity<Map<String, Object>> getDadosFuncionario(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Buscar dados do funcionário
            FuncionarioDTO funcionario = funcionarioService.buscarPorId(id);
            response.put("funcionario", funcionario);
            
            // Buscar horas extras
            List<HoraExtraDTO> horasExtras = horaExtraService.listarPorFuncionario(id);
            response.put("horasExtras", horasExtras);
            
            // Buscar férias
            List<FeriasDTO> ferias = feriasService.listarPorFuncionario(id);
            response.put("ferias", ferias);
            
            // Buscar folgas
            List<FolgaDTO> folgas = folgaService.listarPorFuncionario(id);
            response.put("folgas", folgas);
            
            // Buscar registros de ponto
            List<RegistroPontoDTO> registrosPonto = registroPontoService.listarPorFuncionario(id);
            response.put("registrosPonto", registrosPonto);
            
            // Buscar solicitações
            List<SolicitacaoFuncionarioDTO> solicitacoes = solicitacaoService.listarPorFuncionario(id);
            response.put("solicitacoes", solicitacoes);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(response);
        }
    }

    // ==================== HORAS EXTRAS ====================
    
    /**
     * Listar todas as horas extras pendentes
     */
    @GetMapping("/horas-extras/pendentes")
    public ResponseEntity<List<HoraExtraDTO>> listarHorasExtrasPendentes() {
        List<HoraExtraDTO> horasExtras = horaExtraService.listarPendentes();
        return ResponseEntity.ok(horasExtras);
    }
    
    /**
     * Listar todas as horas extras de um funcionário específico
     */
    @GetMapping("/horas-extras/funcionario/{funcionarioId}")
    public ResponseEntity<List<HoraExtraDTO>> listarHorasExtrasPorFuncionario(@PathVariable Long funcionarioId) {
        List<HoraExtraDTO> horasExtras = horaExtraService.listarPorFuncionario(funcionarioId);
        return ResponseEntity.ok(horasExtras);
    }
    
    /**
     * Cadastrar nova hora extra diretamente pelo admin
     */
    @PostMapping("/horas-extras")
    public ResponseEntity<?> cadastrarHoraExtra(@Valid @RequestBody HoraExtraDTO horaExtraDTO) {
        try {
            HoraExtraDTO horaExtra = horaExtraService.registrarHoraExtra(horaExtraDTO);
            return ResponseEntity.ok(horaExtra);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Aprovar uma hora extra
     */
    @PatchMapping("/horas-extras/{id}/aprovar")
    public ResponseEntity<?> aprovarHoraExtra(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String observacao = request.getOrDefault("observacao", "");
            HoraExtraDTO horaExtra = horaExtraService.aprovarHoraExtra(id, observacao);
            return ResponseEntity.ok(horaExtra);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Rejeitar uma hora extra
     */
    @PatchMapping("/horas-extras/{id}/rejeitar")
    public ResponseEntity<?> rejeitarHoraExtra(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String observacao = request.getOrDefault("observacao", "");
            HoraExtraDTO horaExtra = horaExtraService.rejeitarHoraExtra(id, observacao);
            return ResponseEntity.ok(horaExtra);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Marcar uma hora extra como paga
     */
    @PatchMapping("/horas-extras/{id}/pagar")
    public ResponseEntity<?> pagarHoraExtra(@PathVariable Long id) {
        try {
            HoraExtraDTO horaExtra = horaExtraService.marcarComoPaga(id);
            return ResponseEntity.ok(horaExtra);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Marcar uma hora extra como compensada
     */
    @PatchMapping("/horas-extras/{id}/compensar")
    public ResponseEntity<?> compensarHoraExtra(@PathVariable Long id) {
        try {
            HoraExtraDTO horaExtra = horaExtraService.marcarComoCompensada(id);
            return ResponseEntity.ok(horaExtra);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // ==================== FÉRIAS ====================
    
    /**
     * Listar todas as férias pendentes
     */
    @GetMapping("/ferias/pendentes")
    public ResponseEntity<List<FeriasDTO>> listarFeriasPendentes() {
        List<FeriasDTO> ferias = feriasService.listarPendentes();
        return ResponseEntity.ok(ferias);
    }
    
    /**
     * Listar todas as férias de um funcionário específico
     */
    @GetMapping("/ferias/funcionario/{funcionarioId}")
    public ResponseEntity<List<FeriasDTO>> listarFeriasPorFuncionario(@PathVariable Long funcionarioId) {
        List<FeriasDTO> ferias = feriasService.listarPorFuncionario(funcionarioId);
        return ResponseEntity.ok(ferias);
    }
    
    /**
     * Cadastrar nova férias diretamente pelo admin
     */
    @PostMapping("/ferias")
    public ResponseEntity<?> cadastrarFerias(@Valid @RequestBody FeriasDTO feriasDTO) {
        try {
            FeriasDTO ferias = feriasService.solicitarFerias(feriasDTO);
            return ResponseEntity.ok(ferias);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Aprovar férias
     */
    @PatchMapping("/ferias/{id}/aprovar")
    public ResponseEntity<?> aprovarFerias(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String observacao = request.getOrDefault("observacao", "");
            FeriasDTO ferias = feriasService.aprovarFerias(id, observacao);
            return ResponseEntity.ok(ferias);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Rejeitar férias
     */
    @PatchMapping("/ferias/{id}/rejeitar")
    public ResponseEntity<?> rejeitarFerias(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String observacao = request.getOrDefault("observacao", "");
            FeriasDTO ferias = feriasService.rejeitarFerias(id, observacao);
            return ResponseEntity.ok(ferias);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Concluir férias
     */
    @PatchMapping("/ferias/{id}/concluir")
    public ResponseEntity<?> concluirFerias(@PathVariable Long id) {
        try {
            FeriasDTO ferias = feriasService.concluirFerias(id);
            return ResponseEntity.ok(ferias);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // ==================== FOLGAS ====================
    
    /**
     * Listar todas as folgas pendentes
     */
    @GetMapping("/folgas/pendentes")
    public ResponseEntity<List<FolgaDTO>> listarFolgasPendentes() {
        List<FolgaDTO> folgas = folgaService.listarPendentes();
        return ResponseEntity.ok(folgas);
    }
    
    /**
     * Listar todas as folgas de um funcionário específico
     */
    @GetMapping("/folgas/funcionario/{funcionarioId}")
    public ResponseEntity<List<FolgaDTO>> listarFolgasPorFuncionario(@PathVariable Long funcionarioId) {
        List<FolgaDTO> folgas = folgaService.listarPorFuncionario(funcionarioId);
        return ResponseEntity.ok(folgas);
    }
    
    /**
     * Cadastrar nova folga diretamente pelo admin
     */
    @PostMapping("/folgas")
    public ResponseEntity<?> cadastrarFolga(@Valid @RequestBody FolgaDTO folgaDTO) {
        try {
            FolgaDTO folga = folgaService.solicitarFolga(folgaDTO);
            return ResponseEntity.ok(folga);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Aprovar folga
     */
    @PatchMapping("/folgas/{id}/aprovar")
    public ResponseEntity<?> aprovarFolga(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String observacao = request.getOrDefault("observacao", "");
            FolgaDTO folga = folgaService.aprovarFolga(id, observacao);
            return ResponseEntity.ok(folga);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Rejeitar folga
     */
    @PatchMapping("/folgas/{id}/rejeitar")
    public ResponseEntity<?> rejeitarFolga(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String observacao = request.getOrDefault("observacao", "");
            FolgaDTO folga = folgaService.rejeitarFolga(id, observacao);
            return ResponseEntity.ok(folga);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // ==================== SOLICITAÇÕES DE REVISÃO ====================
    
    /**
     * Listar todas as solicitações de revisão pendentes
     */
    @GetMapping("/solicitacoes/abertas")
    public ResponseEntity<List<SolicitacaoFuncionarioDTO>> listarSolicitacoesAbertas() {
        List<SolicitacaoFuncionarioDTO> solicitacoes = solicitacaoService.listarAbertas();
        return ResponseEntity.ok(solicitacoes);
    }
    
    /**
     * Listar solicitações de revisão por funcionário
     */
    @GetMapping("/solicitacoes/funcionario/{funcionarioId}")
    public ResponseEntity<List<SolicitacaoFuncionarioDTO>> listarSolicitacoesPorFuncionario(@PathVariable Long funcionarioId) {
        List<SolicitacaoFuncionarioDTO> solicitacoes = solicitacaoService.listarPorFuncionario(funcionarioId);
        return ResponseEntity.ok(solicitacoes);
    }
    
    /**
     * Iniciar análise de solicitação
     */
    @PatchMapping("/solicitacoes/{id}/analisar")
    public ResponseEntity<?> iniciarAnaliseSolicitacao(@PathVariable Long id) {
        try {
            SolicitacaoFuncionarioDTO solicitacao = solicitacaoService.iniciarAnalise(id);
            return ResponseEntity.ok(solicitacao);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Responder a uma solicitação de revisão
     */
    @PatchMapping("/solicitacoes/{id}/responder")
    public ResponseEntity<?> responderSolicitacao(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            String resposta = (String) request.getOrDefault("resposta", "");
            boolean aceitar = Boolean.TRUE.equals(request.get("aceitar"));
            
            SolicitacaoFuncionarioDTO solicitacao = solicitacaoService.responderSolicitacao(id, resposta, aceitar);
            return ResponseEntity.ok(solicitacao);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // ==================== BANCO DE HORAS ====================
    
    /**
     * Atualizar saldo de banco de horas de um funcionário
     */
    @PatchMapping("/banco-horas/{funcionarioId}")
    public ResponseEntity<?> atualizarBancoHoras(@PathVariable Long funcionarioId, @RequestBody Map<String, Integer> request) {
        try {
            Integer novoSaldo = request.get("saldo");
            if (novoSaldo == null) {
                return ResponseEntity.badRequest().body("Saldo de banco de horas não informado");
            }
            
            funcionarioService.atualizarSaldoBancoHoras(funcionarioId, novoSaldo);
            
            // Buscar funcionário atualizado
            FuncionarioDTO funcionario = funcionarioService.buscarPorId(funcionarioId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("funcionario", funcionario);
            response.put("saldoBancoHoras", funcionario.getSaldoBancoHoras());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // ==================== REGISTROS DE PONTO ====================
    
    /**
     * Listar registros de ponto não validados
     */
    @GetMapping("/pontos/nao-validados")
    public ResponseEntity<List<RegistroPontoDTO>> listarPontosNaoValidados() {
        List<RegistroPontoDTO> pontos = registroPontoService.listarNaoValidados();
        return ResponseEntity.ok(pontos);
    }
    
    /**
     * Listar registros de ponto por funcionário
     */
    @GetMapping("/pontos/funcionario/{funcionarioId}")
    public ResponseEntity<List<RegistroPontoDTO>> listarPontosPorFuncionario(@PathVariable Long funcionarioId) {
        List<RegistroPontoDTO> pontos = registroPontoService.listarPorFuncionario(funcionarioId);
        return ResponseEntity.ok(pontos);
    }
    
    /**
     * Validar um registro de ponto
     */
    @PatchMapping("/pontos/{id}/validar")
    public ResponseEntity<?> validarPonto(@PathVariable Long id) {
        try {
            RegistroPontoDTO ponto = registroPontoService.validarRegistro(id);
            return ResponseEntity.ok(ponto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Excluir um registro de ponto
     */
    @DeleteMapping("/pontos/{id}")
    public ResponseEntity<?> excluirPonto(@PathVariable Long id) {
        try {
            registroPontoService.excluirRegistro(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}