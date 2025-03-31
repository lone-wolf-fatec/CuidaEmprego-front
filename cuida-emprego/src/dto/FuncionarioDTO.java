package com.empresa.controleponto.dto;

import com.empresa.controleponto.model.Funcionario;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FuncionarioDTO {

    private Long id;

    @NotBlank(message = "Matrícula é obrigatória")
    private String matricula;

    @NotBlank(message = "Cargo é obrigatório")
    private String cargo;

    @NotBlank(message = "Departamento é obrigatório")
    private String departamento;

    @NotNull(message = "Data de admissão é obrigatória")
    @Past(message = "Data de admissão deve ser no passado")
    private LocalDate dataAdmissao;

    private Integer saldoBancoHoras = 0;

    private Long usuarioId;
    
    private UsuarioDTO usuario;

    public static FuncionarioDTO fromFuncionario(Funcionario funcionario) {
        FuncionarioDTO dto = new FuncionarioDTO();
        dto.setId(funcionario.getId());
        dto.setMatricula(funcionario.getMatricula());
        dto.setCargo(funcionario.getCargo());
        dto.setDepartamento(funcionario.getDepartamento());
        dto.setDataAdmissao(funcionario.getDataAdmissao());
        dto.setSaldoBancoHoras(funcionario.getSaldoBancoHoras());
        dto.setUsuarioId(funcionario.getUsuario().getId());
        dto.setUsuario(UsuarioDTO.fromUsuario(funcionario.getUsuario()));
        return dto;
    }
}