import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
public class HistoricoPontoService {

    @Autowired
    private HistoricoPontoRepository historicoPontoRepository;

    public List<HistoricoPonto> buscarHistoricoMensal(Long usuarioId, int mes, int ano) {
        YearMonth yearMonth = YearMonth.of(ano, mes);
        LocalDate inicio = yearMonth.atDay(1);
        LocalDate fim = yearMonth.atEndOfMonth();

        return historicoPontoRepository.findByUsuarioIdAndDataBetween(usuarioId, inicio, fim);
    }
}
