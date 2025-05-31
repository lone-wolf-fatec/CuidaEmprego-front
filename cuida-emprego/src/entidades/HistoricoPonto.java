import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Getter
@Setter
public class HistoricoPonto {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long usuarioId;
    
    private LocalDate data;
    
    private LocalTime entrada;
    
    private LocalTime saida;
    
    private Double horasTrabalhadas;
    
    private String status;
}
