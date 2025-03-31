package com.empresa.controleponto.controller;

import com.empresa.controleponto.dto.FeriasDTO;
import com.empresa.controleponto.dto.FolgaDTO;
import com.empresa.controleponto.dto.HoraExtraDTO;
import com.empresa.controleponto.model.Funcionario;
import com.empresa.controleponto.model.Usuario;
import com.empresa.controleponto.service.FeriasService;
import com.empresa.controleponto.service.FolgaService;
import com.empresa.controleponto.service.FuncionarioService;
import com.empresa.controleponto.service.HoraExtraService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller para o funcionário visualizar suas Horas Extras, Férias e Folgas
 * (Dados que foram configurados pelo administrador)
 */
@RestController
@RequestMapping("/api/funcionario/gestao-tempo")
@PreAuthorize("hasRole('FUNCIONARIO')")
@RequiredArgsConstructor
public class FuncionarioGestaoTempoController {

    private final FuncionarioService funcionarioService;
    private final HoraExtraService horaExtraService;
    private final FeriasService feriasService;
    private final FolgaService folgaService;

    /**
     * Obter o funcionário logado no sistema
     */
    private Funcionario getFuncionarioLogado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioAtual = (Usuario) auth.getPrincipal();
        return funcionarioService.buscarFuncionarioPorUsuario(usuarioAtual);
    }

    /**
     * Retorna todas as informações de uma vez (horas extras, férias e folgas)
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getDadosGestaoTempo() {
        Funcionario funcionario = getFuncionarioLogado();
        Long funcionarioId = funcionario.getId();
        
        Map<String, Object> response = new HashMap<>();
        
        // Buscar horas extras
        List<HoraExtraDTO> horasExtras = horaExtraService.listarPorFuncionario(funcionarioId);
        response.put("horasExtras", horasExtras);
        
        // Buscar férias
        List<FeriasDTO> ferias = feriasService.listarPorFuncionario(funcionarioId);
        response.put("ferias", ferias);
        
        // Buscar folgas
        List<FolgaDTO> folgas = folgaService.listarPorFuncionario(funcionarioId);
        response.put("folgas", folgas);
        
        // Informações adicionais
        response.put("saldoBancoHoras", funcionario.getSaldoBancoHoras());
        response.put("matricula", funcionario.getMatricula());
        response.put("nome", funcionario.getUsuario().getNome());
        response.put("cargo", funcionario.getCargo());
        response.put("departamento", funcionario.getDepartamento());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Listar todas as horas extras do funcionário logado
     */
    @GetMapping("/horas-extras")
    public ResponseEntity<List<HoraExtraDTO>> listarHorasExtras() {
        List<HoraExtraDTO> horasExtras = horaExtraService.listarPorFuncionario(getFuncionarioLogado().getId());
        return ResponseEntity.ok(horasExtras);
    }
    
    /**
     * Obter detalhes de uma hora extra específica
     */
    @GetMapping("/horas-extras/{id}")
    public ResponseEntity<?> detalharHoraExtra(@PathVariable Long id) {
        try {
            HoraExtraDTO horaExtra = horaExtraService.buscarPorId(id);
            
            // Verificar se a hora extra pertence ao funcionário logado
            if (!horaExtra.getFuncionarioId().equals(getFuncionarioLogado().getId())) {
                return ResponseEntity.status(403).body("Acesso não autorizado a este registro");
            }
            
            return ResponseEntity.ok(horaExtra);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Listar todas as férias do funcionário logado
     */
    @GetMapping("/ferias")
    public ResponseEntity<List<FeriasDTO>> listarFerias() {
        List<FeriasDTO> ferias = feriasService.listarPorFuncionario(getFuncionarioLogado().getId());
        return ResponseEntity.ok(ferias);
    }
    
    /**
     * Obter detalhes de uma férias específica
     */
    @GetMapping("/ferias/{id}")
    public ResponseEntity<?> detalharFerias(@PathVariable Long id) {
        try {
            FeriasDTO ferias = feriasService.buscarPorId(id);
            
            // Verificar se as férias pertencem ao funcionário logado
            if (!ferias.getFuncionarioId().equals(getFuncionarioLogado().getId())) {
                return ResponseEntity.status(403).body("Acesso não autorizado a este registro");
            }
            
            return ResponseEntity.ok(ferias);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Listar todas as folgas do funcionário logado
     */
    @GetMapping("/folgas")
    public ResponseEntity<List<FolgaDTO>> listarFolgas() {
        List<FolgaDTO> folgas = folgaService.listarPorFuncionario(getFuncionarioLogado().getId());
        return ResponseEntity.ok(folgas);
    }
    
    /**
     * Obter detalhes de uma folga específica
     */
    @GetMapping("/folgas/{id}")
    public ResponseEntity<?> detalharFolga(@PathVariable Long id) {
        try {
            FolgaDTO folga = folgaService.buscarPorId(id);
            
            // Verificar se a folga pertence ao funcionário logado
            if (!folga.getFuncionarioId().equals(getFuncionarioLogado().getId())) {
                return ResponseEntity.status(403).body("Acesso não autorizado a este registro");
            }
            
            return ResponseEntity.ok(folga);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    /**
     * Obter o saldo atual do banco de horas
     */
    @GetMapping("/banco-horas")
    public ResponseEntity<Map<String, Object>> getSaldoBancoHoras() {
        Funcionario funcionario = getFuncionarioLogado();
        
        Map<String, Object> response = new HashMap<>();
        response.put("saldoBancoHoras", funcionario.getSaldoBancoHoras());
        
        // Formatar o saldo de minutos para horas:minutos
        int horas = funcionario.getSaldoBancoHoras() / 60;
        int minutos = funcionario.getSaldoBancoHoras() % 60;
        response.put("saldoFormatado", String.format("%d:%02d", horas, minutos));
        
        return ResponseEntity.ok(response);
    }
}