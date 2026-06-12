# DevUniverse Web

Frontend interativo do DevUniverse construído com Vite, React 18, React Three
Fiber e Zustand.

## Requisitos

- Node.js 20.19 ou superior
- Backend `devuniverse-api` configurado e em execução

## Configuração

1. Copie `.env.example` para `.env`.
2. Ajuste `VITE_API_URL` para a URL do backend.
3. Instale as dependências e inicie o Vite:

```bash
npm install
npm run dev
```

Abra a URL informada pelo Vite, normalmente `http://localhost:5173`.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Fluxo

1. A Landing recebe o username.
2. O usuário pode explorar como guest ou buscar seu próprio planeta.
3. No login, `useGitHub` chama `POST /auth/login` no backend.
4. O JWT retornado permanece somente na memória do Zustand.
5. O hook carrega a lista de planetas e o planeta do usuário.
6. A nave explora o sistema solar, portais e planetas reais cadastrados.

A nave mantém movimento frontal contínuo. `W`/seta para cima aumenta a
velocidade, `S`/seta para baixo freia e `A`/`D` ou setas laterais controlam o
yaw. Ao ultrapassar a zona habitada, a interface oferece retorno automático ao
sistema solar.

O frontend nunca chama a API do GitHub diretamente. Todas as requisições são
feitas para `VITE_API_URL` por meio de `src/services/api.js`.

Para deploy na Vercel, configure a raiz do projeto como `devuniverse-web` e
adicione o secret `devuniverse_api_url` ou a variável `VITE_API_URL`.
