# BetterCanoas (`descarte-lixo`)

Plataforma web para guia de descarte/coleta seletiva em Canoas (RS) e sistema gamificado de denúncias de lixo com validação por IA e mapa geoespacial.

## Estrutura do Projeto
- `backend/` — API REST em Java 21 + Spring Boot 4.1.1 (Maven).
- `frontend/` — SPA em React 19 + TypeScript + Vite.
- `database/init/` — Scripts SQL de inicialização do PostgreSQL/PostGIS (`01-schema.sql`, `02-seed.sql`, `03-data.sql`).
- `bruno/` — Coleção de requisições HTTP para testar a API.
- `docker-compose.yml` — Orquestra `postgres` (`5432`), `app` (`8080`) e `frontend` (`5173`).

## Stack & Comandos
- **Backend:** Java 21, Spring Boot 4.1.1, Spring Security (JWT), Spring Data JPA, Hibernate Spatial (JTS), Spring AI (Google GenAI), `postgis/postgis:15-3.3`.
- **Frontend:** React 19.3.1, TypeScript, Vite, Leaflet (`react-leaflet`), Tailwind CSS 4, DaisyUI 5, React Router 7.
- **Testes Backend:** `cd backend && ./mvnw test` (nunca pule testes com `-DskipTests`).
- **Build/Typecheck e Lint Frontend:** `cd frontend && npm run build && npm run lint` (ou `npx tsc -b --noEmit && npm run lint`).
- **Subir ambiente completo:** `docker compose up --build` (requer `.env` com `AI_API_KEY`).

## Arquitetura Básica
### Backend (`br.gov.rs.canoas.bettercanoas`)
- `controllers/` — Endpoints REST em `/api/v1/` (`auth`, `bairros`, `combat`, `reports`). Apenas roteamento, validação (`@Valid`) e mapeamento HTTP.
- `domain/` — Entidades JPA, DTOs (`record`), enums e repositories (`user`, `bairro`, `inimigo`, `report`, `status`, `ai`).
- `services/` — Regras de negócio, cálculo de dano/combate, armazenamento/otimização de imagens e orquestração da análise por IA.
- `infra/` — Segurança stateless com JWT (`security/`), tratamento global de erros (`exception/`) e adaptadores de IA (`ai/`).

### Frontend (`frontend/src`)
- `pages/` — `Home`, `Guias` e `ColetaDomiciliar`.
- `components/` — Mapa (`Map.tsx`), busca (`BarraBusca.tsx`) e cards de pontos/materiais/coleta.
- `data/` — Dados estáticos em JSON (`bairros.json`, `materiais.json`, `pontos-coleta.json`) usados pelas telas atuais.
- `types/` e `css/` — Tipagens TypeScript e estilos (Tailwind + CSS modular por página/componente).

## Convenções & Regras Essenciais
- **Banco de Dados:** Não altere os scripts em `database/init/` sem solicitação explícita; mantenha as entidades JPA alinhadas ao `01-schema.sql`.
- **Geolocalização:** Use sempre SRID `4326` (WGS 84) em geometrias JTS (`Coordinate(longitude, latitude)`).
- **IA:** Nunca acople `services/` ou `domain/` diretamente a um SDK de provedor; use sempre `AiProvider` / `AiProviderChain`.
- **Segurança:** Apenas `/api/v1/auth/login`, `/api/v1/auth/register` e `/error` são públicos; demais rotas exigem `Bearer` token JWT.
- **Nomenclatura:** Mantenha os padrões já existentes no projeto (campos de API/domínio em português onde já definidos nos DTOs e no schema).
