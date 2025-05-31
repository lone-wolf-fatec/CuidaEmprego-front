package com.cuidaemprego.services;

import com.cuidaemprego.model.Folgas;
import com.cuidaemprego.repository.FolgasRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class FolgaService {

    @Autowired
    private FolgasRepository folgasRepository;

    public Folgas solicitarFolga(Long usuarioId, LocalDate data, String tipo, String motivo) {
        Folgas folga = new Folgas();
        folga.setUsuarioId(usuarioId);
        folga.setData(data);
        folga.setTipo(tipo);
        folga.setMotivo(motivo);
        folga.setAprovada(false); // padrão
        return folgasRepository.save(folga);
    }

    public List<Folgas> getFolgasByUsuario(Long usuarioId) {
        return folgasRepository.findByUsuarioId(usuarioId);
    }

    public List<Folgas> getTodasFolgas() {
        return folgasRepository.findAll();
    }

    public Optional<Folgas> getProximaFolgaAprovada(Long usuarioId) {
        return folgasRepository.findFirstByUsuarioIdAndAprovadaIsTrueAndDataAfterOrderByDataAsc(
            usuarioId, LocalDate.now());
    }

    public List<Folgas> getFolgasDoDia(LocalDate dia) {
        return folgasRepository.findByData(dia);
    }

    public List<Folgas> getFolgasDaSemana(LocalDate inicio, LocalDate fim) {
        return folgasRepository.findByDataBetween(inicio, fim);
    }

    public List<Folgas> getFolgasPendentesVencidas() {
        return folgasRepository.findByAprovadaIsFalseAndDataBefore(LocalDate.now());
    }

    public List<Object[]> getEstatisticasPorUsuario(Long usuarioId) {
        return folgasRepository.countFolgasPorTipo(usuarioId);
    }
}
