package com.empresa.controleponto.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "horas_extras")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HoraExtra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funcionario_id", nullable = false)
    private Funcionario funcionario;

    @Column(nullable = false)
    private LocalDateTime dataHoraInicio;

    @Column(nullable = false)
    private LocalDateTime dataHoraFim;

    @Column(nullable = false)
    private Integer minutosTotais;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoHoraExtra tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusHoraExtra status = StatusHoraExtra.PENDENTE;

    @Column(length = 500)
    private String justificativa;

    @Column(length = 500)
    private String observacaoAprovador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aprovador_id")
    private Usuario aprovador;

    @Column(nullable = false)
    private boolean paraCompensacao = false;

    @Column(nullable = false)
    private boolean paraRemuneracao = true;

    public enum TipoHoraExtra {
        NORMAL,
        NOTURNA,
        DOMINGO,
        FERIADO
    }

    public enum StatusHoraExtra {
        PENDENTE,
        APROVADA,
        REJEITADA,
        PAGA,
        COMPENSADA
    }
}