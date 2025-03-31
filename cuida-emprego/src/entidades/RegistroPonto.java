package com.empresa.controleponto.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "registros_ponto")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistroPonto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funcionario_id", nullable = false)
    private Funcionario funcionario;

    @Column(nullable = false)
    private LocalDateTime dataHora;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoRegistro tipoRegistro;

    @Column(length = 500)
    private String observacao;

    @Column(nullable = false)
    private boolean validado = false;

    public enum TipoRegistro {
        ENTRADA_EXPEDIENTE,
        SAIDA_ALMOCO,
        RETORNO_ALMOCO,
        SAIDA_EXPEDIENTE
    }
}