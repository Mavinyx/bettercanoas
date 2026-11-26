package br.gov.rs.canoas.bettercanoas.infra.ai;

import com.google.genai.Client;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.HttpRetryOptions;
import io.micrometer.observation.ObservationRegistry;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.ai.model.tool.DefaultToolCallingManager;
import org.springframework.ai.model.tool.ToolCallingManager;
import org.springframework.ai.retry.RetryUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.annotation.Order;
import org.springframework.core.retry.RetryTemplate;
import org.springframework.util.StringUtils;

import java.util.logging.Logger;

@Configuration
public class AiClientConfig {

    private static final Logger LOGGER = Logger.getLogger(AiClientConfig.class.getName());

    @Bean
    public Client aiProviderClient(@Value("${ai.provider.api-key:}") String apiKeyProperty) {
        String key = apiKeyProperty;
        String origem = "application.properties";

        if (!StringUtils.hasText(key) || key.startsWith("${")) {
            key = System.getenv("AI_API_KEY");
            origem = "System.getenv(AI_API_KEY)";
        }

        if (!StringUtils.hasText(key) || key.startsWith("${")) {
            throw new IllegalStateException("Nenhuma chave de API válida foi encontrada em ai.provider.api-key ou AI_API_KEY!");
        }

        LOGGER.info("=== [BETTERCANOAS AI] Inicializando cliente do provedor configurado ===");
        LOGGER.info("=== Origem da Chave: " + origem);

        return Client.builder()
                .apiKey(key)
                .httpOptions(HttpOptions.builder()
                        .timeout(60_000)
                        .retryOptions(HttpRetryOptions.builder().attempts(2).build())
                        .build())
                .build();
    }

    @Bean
    @Primary
    public GoogleGenAiChatModel aiChatModel(
            Client aiProviderClient,
            @Value("${ai.provider.model:gemini-3.5-flash}") String defaultModel
    ) {
        LOGGER.info("=== [BETTERCANOAS AI] Configurando modelo primário de IA: " + defaultModel + " ===");
        return buildChatModel(aiProviderClient, defaultModel);
    }

    @Bean
    public ChatClient.Builder chatClientBuilder(GoogleGenAiChatModel chatModel) {
        return ChatClient.builder(chatModel);
    }

    @Bean
    @Order(0)
    public AiProvider primaryAiProvider(
            GoogleGenAiChatModel primaryChatModel,
            @Value("${ai.provider.name:default}") String providerName,
            @Value("${ai.provider.model:gemini-3.5-flash}") String primaryModel
    ) {
        ChatClient client = ChatClient.builder(primaryChatModel).build();
        return new SpringAiProvider(client, providerName + "-primary(" + primaryModel + ")");
    }

    @Bean
    @Order(1)
    public AiProvider fallbackAiProvider(
            Client aiProviderClient,
            @Value("${ai.provider.name:default}") String providerName,
            @Value("${ai.provider.model:gemini-3.5-flash}") String primaryModel,
            @Value("${ai.provider.fallback-model:gemini-2.5-flash-lite}") String fallbackModel
    ) {
        String resolvedFallback = resolveDistinctFallbackModel(primaryModel, fallbackModel);
        LOGGER.info("=== [BETTERCANOAS AI] Configurando modelo de fallback de IA: " + resolvedFallback + " ===");
        GoogleGenAiChatModel fallbackChatModel = buildChatModel(aiProviderClient, resolvedFallback);
        ChatClient client = ChatClient.builder(fallbackChatModel).build();
        return new SpringAiProvider(client, providerName + "-fallback(" + resolvedFallback + ")");
    }

    private GoogleGenAiChatModel buildChatModel(Client aiProviderClient, String modelName) {
        GoogleGenAiChatOptions options = GoogleGenAiChatOptions.builder()
                .model(modelName)
                .temperature(0.0)
                .build();

        ToolCallingManager toolCallingManager = DefaultToolCallingManager.builder().build();
        ObservationRegistry observationRegistry = ObservationRegistry.NOOP;
        RetryTemplate retryTemplate = RetryUtils.DEFAULT_RETRY_TEMPLATE;

        return new GoogleGenAiChatModel(
                aiProviderClient,
                options,
                toolCallingManager,
                retryTemplate,
                observationRegistry
        );
    }

    private String resolveDistinctFallbackModel(String primaryModel, String configuredFallback) {
        if (StringUtils.hasText(configuredFallback)
                && !configuredFallback.trim().equalsIgnoreCase(primaryModel.trim())) {
            return configuredFallback.trim();
        }
        return "gemini-2.5-flash-lite".equalsIgnoreCase(primaryModel.trim())
                ? "gemini-2.5-flash"
                : "gemini-2.5-flash-lite";
    }
}
