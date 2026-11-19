package br.gov.rs.canoas.bettercanoas.infra.ai;

import br.gov.rs.canoas.bettercanoas.domain.ai.AiAnalysisResult;
import org.springframework.ai.content.Media;

public interface AiProvider {

    String name();

    AiAnalysisResult analyze(Media media);
}
