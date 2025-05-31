package com.cuidaemprego.services;

import com.cuidaemprego.model.Ferias;
import com.cuidaemprego.repository.FeriasRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FeriasService {

    @Autowired
    private FeriasRepository feriasRepository;

    public List<Ferias> findAll() {
        return feriasRepository.findAll();
    }

    public Optional<Ferias> findById(Long id) {
        return feriasRepository.findById(id);
    }

    public Ferias save(Ferias ferias) {
        return feriasRepository.save(ferias);
    }

    public void deleteById(Long id) {
        feriasRepository.deleteById(id);
    }
}
