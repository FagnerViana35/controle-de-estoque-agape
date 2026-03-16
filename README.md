# Estoque Agapé

Sistema de controle de estoque (React/Vite) usando `json-server` como API.

## Desenvolvimento local

- **Backend (json-server)**:

```bash
cd backend
npm install
npm run dev
```

- **Frontend**:

```bash
cd frontend
npm install
npm run dev
```

Por padrão:
- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

## Deploy (produção “do jeito certo” com Vercel + Render)

### Backend no Render (persistente)

1. Suba este repositório para o GitHub.
2. No Render, crie um **Web Service** apontando para o repo.
3. O projeto já vem com `render.yaml`, então o Render deve detectar:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Depois do deploy, copie a URL do Render (ex.: `https://estoque-agape-json-server.onrender.com`).

Endpoints ficam assim:
- `GET /users`
- `GET /products`
- `GET /raw-materials`
- etc.

### Frontend na Vercel

1. Faça o deploy do diretório `frontend` na Vercel.
2. Configure a variável de ambiente do projeto na Vercel:
   - **`VITE_API_BASE_URL`** = URL do Render (ex.: `https://estoque-agape-json-server.onrender.com`)
3. Re-deploy.

Pronto: o frontend vai chamar a API externa e seus dados vão persistir.

## Credenciais iniciais

- **Usuário**: `admin`
- **Senha**: `admin`

