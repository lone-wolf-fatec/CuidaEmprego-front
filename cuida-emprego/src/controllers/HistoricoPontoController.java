import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/historico")
public class HistoricoPontoController {

    @Autowired
    private HistoricoPontoService historicoPontoService;

    @GetMapping("/{usuarioId}/{mes}/{ano}")
    public List<HistoricoPonto> getHistoricoMensal(
            @PathVariable Long usuarioId,
            @PathVariable int mes,
            @PathVariable int ano) {
        
        return historicoPontoService.buscarHistoricoMensal(usuarioId, mes, ano);
    }
}
