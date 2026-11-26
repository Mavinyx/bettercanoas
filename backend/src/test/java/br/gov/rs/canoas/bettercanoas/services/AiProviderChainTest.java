package br.gov.rs.canoas.bettercanoas.services;

import br.gov.rs.canoas.bettercanoas.domain.ai.AiAnalysisResult;
import br.gov.rs.canoas.bettercanoas.domain.report.CategoriaLixo;
import br.gov.rs.canoas.bettercanoas.infra.ai.AiProvider;
import org.junit.jupiter.api.Test;
import org.springframework.ai.content.Media;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AiProviderChainTest {

    @Test
    void shouldFallbackToSecondaryProviderWhenPrimaryFailsWith503() {
        AiProvider primary = mock(AiProvider.class);
        AiProvider fallback = mock(AiProvider.class);
        Media media = mock(Media.class);

        AiAnalysisResult expected = new AiAnalysisResult(
                true,
                CategoriaLixo.ENTULHO,
                4,
                "Entulho visível na calçada"
        );

        when(primary.name()).thenReturn("default-primary(gemini-3.5-flash)");
        when(primary.analyze(media)).thenThrow(new RuntimeException("503 Service Unavailable"));

        when(fallback.name()).thenReturn("default-fallback(gemini-2.5-flash-lite)");
        when(fallback.analyze(media)).thenReturn(expected);

        AiProviderChain chain = new AiProviderChain(List.of(primary, fallback));
        AiAnalysisResult actual = chain.analyze(media);

        assertEquals(expected, actual);
        verify(primary, times(1)).analyze(media);
        verify(fallback, times(1)).analyze(media);
    }

    @Test
    void shouldThrowAiUnavailableExceptionWhenAllProvidersFail() {
        AiProvider primary = mock(AiProvider.class);
        AiProvider fallback = mock(AiProvider.class);
        Media media = mock(Media.class);

        when(primary.name()).thenReturn("primary");
        when(primary.analyze(media)).thenThrow(new RuntimeException("503 primary overloaded"));

        when(fallback.name()).thenReturn("fallback");
        RuntimeException lastError = new RuntimeException("503 fallback overloaded");
        when(fallback.analyze(media)).thenThrow(lastError);

        AiProviderChain chain = new AiProviderChain(List.of(primary, fallback));

        AiAnalysisService.AiUnavailableException thrown = assertThrows(
                AiAnalysisService.AiUnavailableException.class,
                () -> chain.analyze(media)
        );
        assertSame(lastError, thrown.getCause());
    }
}
