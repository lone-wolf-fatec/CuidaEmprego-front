package com.empresa.controleponto.dto;

import com.empresa.controleponto.model.Ferias;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeriasDTO {

    private Long id;

    @NotNull(message = "Funcionário é obrigatório")
    private Long funcionarioId;

    @NotNull(message = "Data de início é obrigatória")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dataInicio;

    @NotNull(message = "Data de fim é obrigatória")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dataFim;

    @NotNull(message = "Quantidade de dias úteis é obrigatória")
    @Positive(message = "Quantidade de dias úteis deve ser positiva")
    private Integer diasUteis;

    private Ferias.StatusFerias status = Ferias.StatusFerias.PENDENTE;

    private String observacao;

    private Long aprovadorId;

    @NotNull(message = "Período aquisitivo é obrigatório")
    private Integer periodoAquisitivo;

    private boolean adiantamento13 = false;
    
    private boolean vendaUmTerco = false;
    
    private String nomeFuncionario;
    
    private String matriculaFuncionario;
    
    private String nomeAprovador;

    public static FeriasDTO fromFerias(Ferias ferias) {
        FeriasDTO dto = new FeriasDTO();
        dto.setId(ferias.getId());
        dto.setFuncionarioId(ferias.getFuncionario().getId());
        dto.setDataInicio(ferias.getDataInicio());
        dto.setDataFim(ferias.getDataFim());
        dto.setDiasUteis(ferias.getDiasUteis());
        dto.setStatus(ferias.getStatus());
        dto.setObservacao(ferias.getObservacao());
        dto.setPeriodoAquisitivo(ferias.getPeriodoAquisitivo());
        dto.setAdiantamento13(ferias.isAdiantamento13());
        dto.setVendaUmTerco(ferias.isVendaUmTerco());
        
        if (ferias.getAprovador() != null) {
            dto.setAprovadorId(ferias.getAprovador().getId());
            dto.setNomeAprovador(ferias.getAprovador().getNome());
        }
        
        dto.setNomeFuncionario(ferias.getFuncionario().getUsuario().getNome());
        dto.setMatriculaFuncionario(ferias.getFuncionario().getMatricula());
        
        return dto;
    }
}