package com.empresa.controleponto.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "folgas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Folga {

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoFolga tipoFolga;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusFolga status = StatusFolga.PENDENTE;

    @Column(length = 500)
    private String motivo;

    @Column(length = 500)
    private String observacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aprovador_id")
    private Usuario aprovador;

    public enum TipoFolga {
        COMPENSATORIA,
        ABONO,
        BANCO_HORAS
    }

    public enum StatusFolga {
        PENDENTE,
        APROVADA,
        REJEITADA,
        CANCELADA
    }
}