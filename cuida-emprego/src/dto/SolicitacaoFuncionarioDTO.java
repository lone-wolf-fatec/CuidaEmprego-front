package com.empresa.controleponto.dto;

import com.empresa.controleponto.model.SolicitacaoFuncionario;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SolicitacaoFuncionarioDTO {

    private Long id;

    @NotNull(message = "Funcionário é obrigatório")
    private Long funcionarioId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dataCriacao = LocalDateTime.now();

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dataResposta;

    @NotNull(message = "Tipo de solicitação é obrigatório")
    private SolicitacaoFuncionario.TipoSolicitacao tipo;

    private SolicitacaoFuncionario.StatusSolicitacao status = SolicitacaoFuncionario.StatusSolicitacao.ABERTA;

    @NotBlank(message = "Descrição é obrigatória")
    @Size(min = 10, max = 1000, message = "Descrição deve ter entre 10 e 1000 caracteres")
    private String descricao;

    private String resposta;

    private Long respondenteId;
    
    private String nomeFuncionario;
    
    private String matriculaFuncionario;
    
    private String nomeRespondente;

    public static SolicitacaoFuncionarioDTO fromSolicitacao(SolicitacaoFuncionario solicitacao) {
        SolicitacaoFuncionarioDTO dto = new SolicitacaoFuncionarioDTO();
        dto.setId(solicitacao.getId());
        dto.setFuncionarioId(solicitacao.getFuncionario().getId());
        dto.setDataCriacao(solicitacao.getDataCriacao());
        dto.setDataResposta(solicitacao.getDataResposta());
        dto.setTipo(solicitacao.getTipo());
        dto.setStatus(solicitacao.getStatus());
        dto.setDescricao(solicitacao.getDescricao());
        dto.setResposta(solicitacao.getResposta());
        
        if (solicitacao.getRespondente() != null) {
            dto.setRespondenteId(solicitacao.getRespondente().getId());
            dto.setNomeRespondente(solicitacao.getRespondente().getNome());
        }
        
        dto.setNomeFuncionario(solicitacao.getFuncionario().getUsuario().getNome());
        dto.setMatriculaFuncionario(solicitacao.getFuncionario().getMatricula());
        
        return dto;
    }
}