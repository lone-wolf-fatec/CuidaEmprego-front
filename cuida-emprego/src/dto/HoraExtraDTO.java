package com.empresa.controleponto.dto;

import com.empresa.controleponto.model.HoraExtra;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HoraExtraDTO {

    private Long id;

    @NotNull(message = "Funcionário é obrigatório")
    private Long funcionarioId;

    @NotNull(message = "Data e hora de início são obrigatórios")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dataHoraInicio;

    @NotNull(message = "Data e hora de fim são obrigatórios")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dataHoraFim;

    @Positive(message = "Minutos totais deve ser um número positivo")
    private Integer minutosTotais;

    @NotNull(message = "Tipo de hora extra é obrigatório")
    private HoraExtra.TipoHoraExtra tipo;

    private HoraExtra.StatusHoraExtra status = HoraExtra.StatusHoraExtra.PENDENTE;

    private String justificativa;

    private String observacaoAprovador;

    private Long aprovadorId;

    private boolean paraCompensacao = false;

    private boolean paraRemuneracao = true;
    
    private String nomeFuncionario;
    
    private String matriculaFuncionario;
    
    private String nomeAprovador;
    
    private String duracaoFormatada;

    public static HoraExtraDTO fromHoraExtra(HoraExtra horaExtra) {
        HoraExtraDTO dto = new HoraExtraDTO();
        dto.setId(horaExtra.getId());
        dto.setFuncionarioId(horaExtra.getFuncionario().getId());
        dto.setDataHoraInicio(horaExtra.getDataHoraInicio());
        dto.setDataHoraFim(horaExtra.getDataHoraFim());
        dto.setMinutosTotais(horaExtra.getMinutosTotais());
        dto.setTipo(horaExtra.getTipo());
        dto.setStatus(horaExtra.getStatus());
        dto.setJustificativa(horaExtra.getJustificativa());
        dto.setObservacaoAprovador(horaExtra.getObservacaoAprovador());
        dto.setParaCompensacao(horaExtra.isParaCompensacao());
        dto.setParaRemuneracao(horaExtra.isParaRemuneracao());
        
        if (horaExtra.getAprovador() != null) {
            dto.setAprovadorId(horaExtra.getAprovador().getId());
            dto.setNomeAprovador(horaExtra.getAprovador().getNome());
        }
        
        dto.setNomeFuncionario(horaExtra.getFuncionario().getUsuario().getNome());
        dto.setMatriculaFuncionario(horaExtra.getFuncionario().getMatricula());
        
        // Formatar duração
        int horas = horaExtra.getMinutosTotais() / 60;
        int minutos = horaExtra.getMinutosTotais() % 60;
        dto.setDuracaoFormatada(String.format("%dh%02dm", horas, minutos));
        
        return dto;
    }
}