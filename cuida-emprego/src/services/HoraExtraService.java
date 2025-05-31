package com.empresa.controleponto.service;

import com.empresa.controleponto.dto.HoraExtraDTO;
import com.empresa.controleponto.model.Funcionario;
import com.empresa.controleponto.model.HoraExtra;
import com.empresa.controleponto.model.Usuario;
import com.empresa.controleponto.repository.HoraExtraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HoraExtraService {

    private final HoraExtraRepository horaExtraRepository;
    private final FuncionarioService funcionarioService;
    private final UsuarioService usuarioService;

    public List<HoraExtraDTO> listarPorFuncionario(Long funcionarioId) {
        Funcionario funcionario = funcionarioService.buscarFuncionario(funcionarioId);
        
        return horaExtraRepository.findByFuncionarioOrderByDataHoraInicioDesc(funcionario).stream()
                .map(HoraExtraDTO::fromHoraExtra)
                .collect(Collectors.toList());
    }
    
    public List<HoraExtraDTO> listarPendentes() {
        return horaExtraRepository.findByStatus(HoraExtra.StatusHoraExtra.PENDENTE).stream()
                .map(HoraExtraDTO::fromHoraExtra)
                .collect(Collectors.toList());
    }
    
    public HoraExtraDTO buscarPorId(Long id) {
        HoraExtra horaExtra = horaExtraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hora extra não encontrada"));
        
        return HoraExtraDTO.fromHoraExtra(horaExtra);
    }

    @Transactional
    public HoraExtraDTO registrarHoraExtra(HoraExtraDTO horaExtraDTO) {
        // Verificar se as datas são válidas
        if (horaExtraDTO.getDataHoraInicio().isAfter(horaExtraDTO.getDataHoraFim())) {
            throw new RuntimeException("Data/hora de início deve ser anterior à data/hora de fim");
        }
        
        // Obter funcionário
        Funcionario funcionario = funcionarioService.buscarFuncionario(horaExtraDTO.getFuncionarioId());
        
        // Calcular duração em minutos
        long minutos = Duration.between(horaExtraDTO.getDataHoraInicio(), horaExtraDTO.getDataHoraFim()).toMinutes();
        
        if (minutos <= 0) {
            throw new RuntimeException("A duração da hora extra deve ser positiva");
        }
        
        // Criar hora extra
        HoraExtra horaExtra = new HoraExtra();
        horaExtra.setFuncionario(funcionario);
        horaExtra.setDataHoraInicio(horaExtraDTO.getDataHoraInicio());
        horaExtra.setDataHoraFim(horaExtraDTO.getDataHoraFim());
        horaExtra.setMinutosTotais((int) minutos);
        horaExtra.setTipo(horaExtraDTO.getTipo());
        horaExtra.setStatus(HoraExtra.StatusHoraExtra.PENDENTE);
        horaExtra.setJustificativa(horaExtraDTO.getJustificativa());
        horaExtra.setParaCompensacao(horaExtraDTO.isParaCompensacao());
        horaExtra.setParaRemuneracao(horaExtraDTO.isParaRemuneracao());
        
        HoraExtra salva = horaExtraRepository.save(horaExtra);
        return HoraExtraDTO.fromHoraExtra(salva);
    }
    
    @Transactional
    public HoraExtraDTO aprovarHoraExtra(Long id, String observacao) {
        HoraExtra horaExtra = horaExtraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hora extra não encontrada"));
        
        // Obter usuário autenticado (admin)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioAtual = (Usuario) auth.getPrincipal();
        
        horaExtra.setStatus(HoraExtra.StatusHoraExtra.APROVADA);
        horaExtra.setObservacaoAprovador(observacao);
        horaExtra.setAprovador(usuarioAtual);
        
        // Se for para compensação, adicionar ao banco de horas
        if (horaExtra.isParaCompensacao()) {
            Funcionario funcionario = horaExtra.getFuncionario();
            funcionario.setSaldoBancoHoras(funcionario.getSaldoBancoHoras() + horaExtra.getMinutosTotais());
            funcionarioService.atualizarSaldoBancoHoras(funcionario.getId(), funcionario.getSaldoBancoHoras());
        }
        
        HoraExtra salva = horaExtraRepository.save(horaExtra);
        return HoraExtraDTO.fromHoraExtra(salva);
    }
    
    @Transactional
    public HoraExtraDTO rejeitarHoraExtra(Long id, String observacao) {
        HoraExtra horaExtra = horaExtraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hora extra não encontrada"));
        
        // Obter usuário autenticado (admin)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario usuarioAtual = (Usuario) auth.getPrincipal();
        
        horaExtra.setStatus(HoraExtra.StatusHoraExtra.REJEITADA);
        horaExtra.setObservacaoAprovador(observacao);
        horaExtra.setAprovador(usuarioAtual);
        
        HoraExtra salva = horaExtraRepository.save(horaExtra);
        return HoraExtraDTO.fromHoraExtra(salva);
    }
    
    @Transactional
    public HoraExtraDTO marcarComoPaga(Long id) {
        HoraExtra horaExtra = horaExtraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hora extra não encontrada"));
        
        if (horaExtra.getStatus() != HoraExtra.StatusHoraExtra.APROVADA) {
            throw new RuntimeException("Hora extra não está aprovada");
        }
        
        if (!horaExtra.isParaRemuneracao()) {
            throw new RuntimeException("Hora extra não está marcada para remuneração");
        }
        
        horaExtra.setStatus(HoraExtra.StatusHoraExtra.PAGA);
        
        HoraExtra salva = horaExtraRepository.save(horaExtra);
        return HoraExtraDTO.fromHoraExtra(salva);
    }
    
    @Transactional
    public HoraExtraDTO marcarComoCompensada(Long id) {
        HoraExtra horaExtra = horaExtraRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hora extra não encontrada"));
        
        if (horaExtra.getStatus() != HoraExtra.StatusHoraExtra.APROVADA) {
            throw new RuntimeException("Hora extra não está aprovada");
        }
        
        if (!horaExtra.isParaCompensacao()) {
            throw new RuntimeException("Hora extra não está marcada para compensação");
        }
        
        horaExtra.setStatus(HoraExtra.StatusHoraExtra.COMPENSADA);
        
        HoraExtra salva = horaExtraRepository.save(horaExtra);
        return HoraExtraDTO.fromHoraExtra(salva);
    }
}