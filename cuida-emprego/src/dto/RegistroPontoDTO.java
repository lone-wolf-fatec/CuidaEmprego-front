package com.empresa.controleponto.dto;

import com.empresa.controleponto.model.RegistroPonto;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistroPontoDTO {

    private Long id;

    @NotNull(message = "Funcionário é obrigatório")
    private Long funcionarioId;

    @NotNull(message = "Data e hora são obrigatórios")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dataHora;

    @NotNull(message = "Tipo de registro é obrigatório")
    private RegistroPonto.TipoRegistro tipoRegistro;

    private String observacao;

    private boolean validado;
    
    private String nomeFuncionario;
    
    private String matriculaFuncionario;

    public static RegistroPontoDTO fromRegistroPonto(RegistroPonto registroPonto) {
        RegistroPontoDTO dto = new RegistroPontoDTO();
        dto.setId(registroPonto.getId());
        dto.setFuncionarioId(registroPonto.getFuncionario().getId());
        dto.setDataHora(registroPonto.getDataHora());
        dto.setTipoRegistro(registroPonto.getTipoRegistro());
        dto.setObservacao(registroPonto.getObservacao());
        dto.setValidado(registroPonto.isValidado());
        dto.setNomeFuncionario(registroPonto.getFuncionario().getUsuario().getNome());
        dto.setMatriculaFuncionario(registroPonto.getFuncionario().getMatricula());
        return dto;
    }
}