package com.empresa.controleponto.dto;

import com.empresa.controleponto.model.Folga;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FolgaDTO {

    private Long id;

    @NotNull(message = "Funcionário é obrigatório")
    private Long funcionarioId;

    @NotNull(message = "Data de início é obrigatória")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dataInicio;

    @NotNull(message = "Data de fim é obrigatória")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dataFim;

    @NotNull(message = "Tipo de folga é obrigatório")
    private Folga.TipoFolga tipoFolga;

    private Folga.StatusFolga status = Folga.StatusFolga.PENDENTE;

    private String motivo;

    private String observacao;

    private Long aprovadorId;
    
    private String nomeFuncionario;
    
    private String matriculaFuncionario;
    
    private String nomeAprovador;

    public static FolgaDTO fromFolga(Folga folga) {
        FolgaDTO dto = new FolgaDTO();
        dto.setId(folga.getId());
        dto.setFuncionarioId(folga.getFuncionario().getId());
        dto.setDataInicio(folga.getDataInicio());
        dto.setDataFim(folga.getDataFim());
        dto.setTipoFolga(folga.getTipoFolga());
        dto.setStatus(folga.getStatus());
        dto.setMotivo(folga.getMotivo());
        dto.setObservacao(folga.getObservacao());
        
        if (folga.getAprovador() != null) {
            dto.setAprovadorId(folga.getAprovador().getId());
            dto.setNomeAprovador(folga.getAprovador().getNome());
        }
        
        dto.setNomeFuncionario(folga.getFuncionario().getUsuario().getNome());
        dto.setMatriculaFuncionario(folga.getFuncionario().getMatricula());
        
        return dto;
    }
}