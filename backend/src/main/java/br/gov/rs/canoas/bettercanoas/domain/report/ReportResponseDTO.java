package br.gov.rs.canoas.bettercanoas.domain.report;

import br.gov.rs.canoas.bettercanoas.domain.inimigo.InimigoDTO;
import br.gov.rs.canoas.bettercanoas.domain.report.CategoriaLixo;
import br.gov.rs.canoas.bettercanoas.domain.status.StatusDenuncia;

public record ReportResponseDTO (
    String justificativaIa,
    Integer severidade,
    Boolean valido,
    CategoriaLixo categoria,
    Integer dano,
    Double latitude, // y
    Double longitude, // x
    InimigoDTO inimigo
) {
    public static ReportResponseDTO fromEntity(DenunciaLixo denunciaLixo){
        return new ReportResponseDTO(
                denunciaLixo.getJustificativaIa(),
                denunciaLixo.getSeveridade(),
                denunciaLixo.getStatus() == StatusDenuncia.VALIDATED,
                denunciaLixo.getCategoria(),
                denunciaLixo.getDano(),
                denunciaLixo.getCoordenadas().getY(),
                denunciaLixo.getCoordenadas().getX(),
                denunciaLixo.getInimigo() != null ? InimigoDTO.fromEntity(denunciaLixo.getInimigo()) : null
        );
    }
}
