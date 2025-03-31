package com.empresa.controleponto.service;

import com.empresa.controleponto.dto.FuncionarioDTO;
import com.empresa.controleponto.dto.UsuarioDTO;
import com.empresa.controleponto.model.Funcionario;
import com.empresa.controleponto.model.Usuario;
import com.empresa.controleponto.repository.FuncionarioRepository;
import com.empresa.controleponto.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FuncionarioService {

    private final FuncionarioRepository funcionarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public List<FuncionarioDTO> listarTodos() {
        return funcionarioRepository.findAll().stream()
                .map(FuncionarioDTO::fromFuncionario)
                .collect(Collectors.toList());
    }

    public FuncionarioDTO buscarPorId(Long id) {
        return funcionarioRepository.findById(id)
                .map(FuncionarioDTO::fromFuncionario)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));
    }

    @Transactional
    public FuncionarioDTO cadastrar(FuncionarioDTO funcionarioDTO) {
        // Verificar se a matrícula já existe
        if (funcionarioRepository.existsByMatricula(funcionarioDTO.getMatricula())) {
            throw new RuntimeException("Matrícula já está em uso!");
        }

        // Criar usuário
        UsuarioDTO usuarioDTO = funcionarioDTO.getUsuario();
        Usuario usuario = authService.registrarUsuario(usuarioDTO, false);

        // Criar funcionário
        Funcionario funcionario = new Funcionario();
        funcionario.setMatricula(funcionarioDTO.getMatricula());
        funcionario.setCargo(funcionarioDTO.getCargo());
        funcionario.setDepartamento(funcionarioDTO.getDepartamento());
        funcionario.setDataAdmissao(funcionarioDTO.getDataAdmissao());
        funcionario.setSaldoBancoHoras(0);
        funcionario.setUsuario(usuario);

        Funcionario salvo = funcionarioRepository.save(funcionario);
        return FuncionarioDTO.fromFuncionario(salvo);
    }

    @Transactional
    public FuncionarioDTO atualizar(Long id, FuncionarioDTO funcionarioDTO) {
        Funcionario funcionario = funcionarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));

        // Verificar se a matrícula já está em uso por outro funcionário
        if (!funcionario.getMatricula().equals(funcionarioDTO.getMatricula()) &&
                funcionarioRepository.existsByMatricula(funcionarioDTO.getMatricula())) {
            throw new RuntimeException("Matrícula já está em uso!");
        }

        funcionario.setMatricula(funcionarioDTO.getMatricula());
        funcionario.setCargo(funcionarioDTO.getCargo());
        funcionario.setDepartamento(funcionarioDTO.getDepartamento());
        funcionario.setDataAdmissao(funcionarioDTO.getDataAdmissao());

        // Atualizar usuário se necessário
        if (funcionarioDTO.getUsuario() != null) {
            Usuario usuario = funcionario.getUsuario();
            UsuarioDTO usuarioDTO = funcionarioDTO.getUsuario();

            if (!usuario.getUsername().equals(usuarioDTO.getUsername()) &&
                    usuarioRepository.existsByUsername(usuarioDTO.getUsername())) {
                throw new RuntimeException("Nome de usuário já está em uso!");
            }

            if (!usuario.getEmail().equals(usuarioDTO.getEmail()) &&
                    usuarioRepository.existsByEmail(usuarioDTO.getEmail())) {
                throw new RuntimeException("E-mail já está em uso!");
            }

            usuario.setNome(usuarioDTO.getNome());
            usuario.setEmail(usuarioDTO.getEmail());
            
            if (usuarioDTO.getPassword() != null && !usuarioDTO.getPassword().isEmpty()) {
                usuario.setPassword(passwordEncoder.encode(usuarioDTO.getPassword()));
            }
            
            usuarioRepository.save(usuario);
        }

        Funcionario atualizado = funcionarioRepository.save(funcionario);
        return FuncionarioDTO.fromFuncionario(atualizado);
    }

    @Transactional
    public void atualizarSaldoBancoHoras(Long funcionarioId, Integer novoSaldo) {
        Funcionario funcionario = funcionarioRepository.findById(funcionarioId)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));
        
        funcionario.setSaldoBancoHoras(novoSaldo);
        funcionarioRepository.save(funcionario);
    }
    
    public Funcionario buscarFuncionarioPorUsuario(Usuario usuario) {
        return funcionarioRepository.findByUsuario(usuario)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado para este usuário"));
    }
    
    public Funcionario buscarFuncionario(Long id) {
        return funcionarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));
    }
}