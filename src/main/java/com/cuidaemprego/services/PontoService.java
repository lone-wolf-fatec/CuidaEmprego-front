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
public class PontoService {
    
    @Autowired
    private RegistroPontoRepository registroPontoRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    public RegistroPonto registrarPonto(Long usuarioId, String tipo, LocalDate data, String hora) {
        // Verificar se usuário existe
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        // Verificar atraso
        boolean atraso = verificarAtraso(tipo, hora, usuario);
        
        RegistroPonto registro = new RegistroPonto();
        registro.setUsuarioId(usuarioId);
        registro.setTipo(tipo);
        registro.setData(data);
        registro.setHora(hora);
        registro.setAtraso(atraso);
        registro.setStatus("pendente");
        
        return registroPontoRepository.save(registro);
    }
    
    private boolean verificarAtraso(String tipo, String hora, Usuario usuario) {
        if (!"entrada".equals(tipo)) {
            return false;
        }
        
        try {
            LocalTime horaRegistro = LocalTime.parse(hora);
            LocalTime horaInicio = LocalTime.parse(usuario.getJornadaInicio());
            
            // Adicionar tolerância
            LocalTime horaLimite = horaInicio.plusMinutes(usuario.getToleranciaAtraso());
            
            return horaRegistro.isAfter(horaLimite);
        } catch (Exception e) {
            return false;
        }
    }
    
    public List<RegistroPonto> getRegistrosByUsuario(Long usuarioId) {
        return registroPontoRepository.findByUsuarioIdOrderByDataDescHoraDesc(usuarioId);
    }
    
    public List<RegistroPonto> getAllRegistros() {
        return registroPontoRepository.findAllOrderByDataDescHoraDesc();
    }
    
    public void limparRegistros(Long usuarioId) {
        List<RegistroPonto> registros = registroPontoRepository.findByUsuarioIdOrderByDataDescHoraDesc(usuarioId);
        registroPontoRepository.deleteAll(registros);
    }
}