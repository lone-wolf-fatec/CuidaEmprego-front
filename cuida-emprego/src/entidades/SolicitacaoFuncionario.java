package com.empresa.controleponto.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "solicitacoes_funcionario")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SolicitacaoFuncionario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funcionario_id", nullable = false)
    private Funcionario funcionario;

    @Column(nullable = false)
    private LocalDateTime dataCriacao = LocalDateTime.now();

    private LocalDateTime dataResposta;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoSolicitacao tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusSolicitacao status = StatusSolicitacao.ABERTA;

    @Column(nullable = false, length = 1000)
    private String descricao;

    @Column(length = 1000)
    private String resposta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "respondente_id")
    private Usuario respondente;

    public enum TipoSolicitacao {
        AJUSTE_PONTO,
        SOLICITACAO_FERIAS,
        SOLICITACAO_FOLGA,
        SOLICITACAO_HORA_EXTRA,
        REVISAO_BANCO_HORAS,
        OUTROS
    }

    public enum StatusSolicitacao {
        ABERTA,
        EM_ANALISE,
        CONCLUIDA,
        REJEITADA,
        CANCELADA
    }
}