package com.cuidaemprego.services;

import com.cuidaemprego.model.RegistroPonto;
import com.cuidaemprego.model.Usuario;
import com.cuidaemprego.repository.RegistroPontoRepository;
import com.cuidaemprego.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class TimeEntryService {
    
    @Autowired
    private RegistroPontoRepository registroPontoRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private NotificacaoService notificacaoService;
    
    public RegistroPonto registerTimeEntry(Long usuarioId, String tipo) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        LocalDate hoje = LocalDate.now();
        LocalTime agora = LocalTime.now();
        String hora = agora.format(DateTimeFormatter.ofPattern("HH:mm"));
        
        // Verificar atraso para entrada
        boolean atraso = false;
        if ("entrada".equals(tipo)) {
            atraso = verificarAtraso(agora, usuario);
        }
        
        RegistroPonto registro = new RegistroPonto();
        registro.setUsuarioId(usuarioId);
        registro.setTipo(tipo);
        registro.setData(hoje);
        registro.setHora(hora);
        registro.setAtraso(atraso);
        registro.setStatus("pendente");
        
        RegistroPonto savedRegistro = registroPontoRepository.save(registro);
        
        // Enviar notificação para admin
        String statusMsg = atraso ? " com ATRASO" : "";
        String mensagem = String.format("%s registrou %s%s às %s", 
                                       usuario.getName(), tipo, statusMsg, hora);
        notificacaoService.enviarNotificacao("ADMIN", usuarioId, mensagem, "REGISTRO_PONTO", atraso);
        
        return savedRegistro;
    }
    
    private boolean verificarAtraso(LocalTime horaRegistro, Usuario usuario) {
        try {
            // Determinar horário de entrada baseado na hora atual
            String jornadaInicio = horaRegistro.getHour() < 12 ? 
                usuario.getJornadaInicio() : usuario.getJornadaInicioTarde();
            
            LocalTime horaInicio = LocalTime.parse(jornadaInicio);
            LocalTime horaLimite = horaInicio.plusMinutes(usuario.getToleranciaAtraso());
            
            return horaRegistro.isAfter(horaLimite);
        } catch (Exception e) {
            return false;
        }
    }
    
    public boolean canRegisterEntry(Long usuarioId) {
        LocalDate hoje = LocalDate.now();
        List<RegistroPonto> registrosHoje = registroPontoRepository
                .findByDataAndUsuarioIdOrderByHora(hoje, usuarioId);
        
        if (registrosHoje.isEmpty()) {
            return true;
        }
        
        // Pegar último registro
        RegistroPonto ultimoRegistro = registrosHoje.get(registrosHoje.size() - 1);
        return "saída".equals(ultimoRegistro.getTipo());
    }
    
    public boolean canRegisterExit(Long usuarioId) {
        LocalDate hoje = LocalDate.now();
        List<RegistroPonto> registrosHoje = registroPontoRepository
                .findByDataAndUsuarioIdOrderByHora(hoje, usuarioId);
        
        if (registrosHoje.isEmpty()) {
            return false;
        }
        
        // Pegar último registro
        RegistroPonto ultimoRegistro = registrosHoje.get(registrosHoje.size() - 1);
        return "entrada".equals(ultimoRegistro.getTipo());
    }
    
    public int getCountRegistrosHoje(Long usuarioId) {
        LocalDate hoje = LocalDate.now();
        return registroPontoRepository.findByDataAndUsuarioIdOrderByHora(hoje, usuarioId).size();
    }
}
