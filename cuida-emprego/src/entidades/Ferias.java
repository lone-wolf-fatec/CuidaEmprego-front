package com.empresa.controleponto.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "ferias")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ferias {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funcionario_id", nullable = false)
    private Funcionario funcionario;

    @Column(nullable = false)
    private LocalDate dataInicio;

    @Column(nullable = false)
    private LocalDate dataFim;

    @Column(nullable = false)
    private Integer diasUteis;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusFerias status = StatusFerias.PENDENTE;

    @Column(length = 500)
    private String observacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aprovador_id")
    private Usuario aprovador;

    @Column(nullable = false)
    private Integer periodoAquisitivo;

    @Column(nullable = false)
    private boolean adiantamento13 = false;

    @Column(nullable = false)
    private boolean vendaUmTerco = false;

    public enum StatusFerias {
        PENDENTE,
        APROVADA,
        REJEITADA,
        CANCELADA,
        CONCLUIDA
    }
}