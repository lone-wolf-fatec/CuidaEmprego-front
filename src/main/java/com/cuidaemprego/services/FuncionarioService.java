package com.cuidaemprego.services;

import com.cuidaemprego.model.Funcionario;
import com.cuidaemprego.repository.FuncionarioRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FuncionarioService {

    private final FuncionarioRepository funcionarioRepository;

    public FuncionarioService(FuncionarioRepository funcionarioRepository) {
        this.funcionarioRepository = funcionarioRepository;
    }

    // Corrigido: método correto do repository é findByDepartamento_Nome
    public List<Funcionario> buscarPorDepartamento(String nomeDepartamento) {
        return funcionarioRepository.findByDepartamento_Nome(nomeDepartamento);
    }

    public List<Funcionario> listarTodos() {
        return funcionarioRepository.findAll();
    }

    public Optional<Funcionario> buscarPorId(Long id) {
        return funcionarioRepository.findById(id);
    }

    // Corrigido: método correto do repository é findByUsuario_Id
    public List<Funcionario> buscarPorUsuarioId(Long usuarioId) {
        return funcionarioRepository.findByUsuario_Id(usuarioId);
    }

    public Funcionario salvar(Funcionario funcionario) {
        return funcionarioRepository.save(funcionario);
    }

    public void deletar(Long id) {
        funcionarioRepository.deleteById(id);
    }
}
