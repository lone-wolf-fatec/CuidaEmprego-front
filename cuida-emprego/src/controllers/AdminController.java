package com.empresa.controleponto.controller;

import com.empresa.controleponto.dto.*;
import com.empresa.controleponto.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final UsuarioService usuarioService;
    private final FuncionarioService funcionarioService;
    private final RegistroPontoService registroPontoService;
    private final FolgaService folgaService;
    private final FeriasService feriasService;
    private final HoraExtraService horaExtraService;
    private final SolicitacaoFuncionarioService solicitacaoService;

    // Gerenciamento de usuários
    @GetMapping("/usuarios")
    public List<UsuarioDTO> listarUsuarios() {
        return usuarioService.listarTodos();
    }

    @GetMapping("/usuarios/{id}")
    public ResponseEntity<UsuarioDTO> buscarUsuario(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(usuarioService.buscarPorId(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/usuarios/{id}")
    public ResponseEntity<?> atualizarUsuario(@PathVariable Long id, @Valid @RequestBody UsuarioDTO usuarioDTO) {
        try {
            return ResponseEntity.ok(usuarioService.atualizar(id, usuarioDTO));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/usuarios/{id}/ativar")
    public ResponseEntity<?> ativarUsuario(@PathVariable Long id) {
        try {
            usuarioService.ativarDesativar(id, true);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/usuarios/{id}/desativar")
    public ResponseEntity<?> desativarUsuario(@PathVariable Long id) {
        try {
            usuarioService.ativarDesativar(id, false);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Gerenciamento de funcionários
    @GetMapping("/funcionarios")
    public List<FuncionarioDTO> listarFuncionarios() {
        return funcionarioService.listarTodos();
    }

    @GetMapping("/funcionarios/{id}")
    public ResponseEntity<FuncionarioDTO> buscarFuncionario(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(funcionarioService.buscarPorId(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/funcionarios")
    public ResponseEntity<?> cadastrarFuncionario(@Valid @RequestBody FuncionarioDTO funcionarioDTO) {
        try {
            return ResponseEntity.ok(funcionarioService.cadastrar(funcionarioDTO));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/funcionarios/{id}")
    public ResponseEntity<?> atualizarFuncionario(@PathVariable Long id, @Valid @RequestBody FuncionarioDTO funcionarioDTO) {
        try {
            return ResponseEntity.ok(funcionarioService.atualizar(id, funcionarioDTO));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/funcionarios/{id}/banco-horas")
    public ResponseEntity<?> atualizarBancoHoras(@PathVariable Long id, @RequestBody Map<String, Integer> request) {
        try {
            Integer novoSaldo = request.get("saldo");
            if (novoSaldo == null) {
                return ResponseEntity.badRequest().body("Saldo de banco de horas não informado");
            }
            
            funcionarioService.atualizarSaldoBancoHoras(id, novoSaldo);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Gerenciamento de ponto
    @GetMapping("/pontos/nao-validados")
    public List<RegistroPontoDTO> listarPontosNaoValidados() {
        return registroPontoService.listarNaoValidados();
    }

    @PatchMapping("/pontos/{id}/validar")
    public ResponseEntity<?> validarPonto(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(registroPontoService.validarRegistro(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/pontos/{id}")
    public ResponseEntity<?> excluirPonto(@PathVariable Long id) {
        try {
            registroPontoService.excluirRegistro(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Gerenciamento de folgas
    @GetMapping("/folgas/pendentes")
    public List<FolgaDTO> listarFolgasPendentes() {
        return folgaService.listarPendentes();
    }

    @PatchMapping("/folgas/{id}/aprovar")
    public ResponseEntity<?> aprovarFolga(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String observacao = request.getOrDefault("observacao", "");
            return ResponseEntity.ok(folgaService.aprovarFolga(id, observacao));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/folgas/{id}/rejeitar")
    public ResponseEntity<?> rejeitarFolga(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String observacao = request.getOrDefault("observacao", "");
            return ResponseEntity.ok(folgaService.rejeitarFolga(id, observacao));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Gerenciamento de férias
    @GetMapping("/ferias/pendentes")
    public List<FeriasDTO> listarFeriasPendentes() {
        return feriasService.listarPendentes();
    }

    @PatchMapping("/ferias/{id}/aprovar")
    public ResponseEntity<?> aprovarFerias(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String observacao = request.getOrDefault("observacao", "");
            return ResponseEntity.ok(feriasService.aprovarFerias(id, observacao));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/ferias/{id}/rejeitar")
    public ResponseEntity<?> rejeitarFerias(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String observacao = request.getOrDefault("observacao", "");
            return ResponseEntity.ok(feriasService.rejeitarFerias(id, observacao));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/ferias/{id}/concluir")
    public ResponseEntity<?> concluirFerias(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(feriasService.concluirFerias(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Gerenciamento de horas extras
    @GetMapping("/horas-extras/pendentes")
    public List<HoraExtraDTO> listarHorasExtrasPendentes() {
        return horaExtraService.listarPendentes();
    }

    @PatchMapping("/horas-extras/{id}/aprovar")
    public ResponseEntity<?> aprovarHoraExtra(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String observacao = request.getOrDefault("observacao", "");
            return ResponseEntity.ok(horaExtraService.aprovarHoraExtra(id, observacao));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/horas-extras/{id}/rejeitar")
    public ResponseEntity<?> rejeitarHoraExtra(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String observacao = request.getOrDefault("observacao", "");
            return ResponseEntity.ok(horaExtraService.rejeitarHoraExtra(id, observacao));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/horas-extras/{id}/pagar")
    public ResponseEntity<?> pagarHoraExtra(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(horaExtraService.marcarComoPaga(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/horas-extras/{id}/compensar")
    public ResponseEntity<?> compensarHoraExtra(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(horaExtraService.marcarComoCompensada(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Gerenciamento de solicitações
    @GetMapping("/solicitacoes/abertas")
    public List<SolicitacaoFuncionarioDTO> listarSolicitacoesAbertas() {
        return solicitacaoService.listarAbertas();
    }

    @PatchMapping("/solicitacoes/{id}/analisar")
    public ResponseEntity<?> iniciarAnaliseSolicitacao(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(solicitacaoService.iniciarAnalise(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/solicitacoes/{id}/responder")
    public ResponseEntity<?> responderSolicitacao(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            String resposta = (String) request.getOrDefault("resposta", "");
            boolean aceitar = Boolean.TRUE.equals(request.get("aceitar"));
            
            return ResponseEntity.ok(solicitacaoService.responderSolicitacao(id, resposta, aceitar));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}