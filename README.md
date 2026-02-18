# 💰 Financy

> **Gestão Financeira Pessoal Inteligente** — Uma plataforma moderna, escalável e poderosa para controlar suas finanças com precisão e insights em tempo real.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-BaaS-green?style=flat-square&logo=supabase)

---

## 🎯 Sobre o Projeto

**Financy** é uma aplicação web completa de gestão financeira pessoal construída com as tecnologias mais modernas e melhores práticas do mercado. Oferece um dashboard intuitivo, controle detalhado de transações, cartões de crédito, categorizações automáticas e relatórios visuais para ajudá-lo a tomar melhores decisões financeiras.

### ✨ Principais Características

- 📊 **Dashboard Inteligente** — Visualize seu estado financeiro em tempo real com gráficos interativos
- 💳 **Gestão de Cartões de Crédito** — Rastreie limites, faturas e ciclos de pagamento
- 🏷️ **Categorias Dinâmicas** — Organize despesas com categorias personalizáveis
- 📱 **Transações Detalhadas** — Registre cada movimentação com anexos e notas
- 📈 **Parcelamentos** — Acompanhe crediários e pagamentos em múltiplas parcelas
- ⏱️ **Time Tracking** — Acompanhe horas trabalhadas e produtividade
- 🔔 **Alertas Financeiros** — Notificações sobre contas próximas do vencimento
- 📊 **Relatórios Avançados** — Análises profundas de fluxo de caixa e tendências
- 🔐 **Autenticação Segura** — Sistema de autenticação com Supabase
- 📱 **Responsivo** — Funciona perfeitamente em desktop, tablet e mobile

---

## 🏗️ Arquitetura & Stack Tecnológico

### Frontend
- **Next.js 16.1** — Framework React com SSR/SSG, otimizado para performance
- **React 19** — Componentes modernos com server/client components
- **TypeScript** — Type safety rigoroso em toda a base de código
- **Tailwind CSS 4** — Estilização utilitária com sistema de design consistente

### Backend & Dados
- **Supabase** — Backend as a Service com:
  - PostgreSQL para dados relacionais
  - Row Level Security (RLS) para segurança
  - Autenticação integrada
  - Storage para anexos
  - Realtime para atualizações ao vivo

### UI & Visualização
- **Recharts** — Gráficos interativos e responsivos para análises
- **Lucide React** — Ícones modernos e consistentes
- **Tailwind + Clsx** — Composição de classes com segurança tipográfica

---

## 📁 Estrutura do Projeto

```
financy/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Rotas protegidas
│   │   ├── dashboard/            # Dashboard principal
│   │   ├── transactions/         # Gestão de transações
│   │   ├── bills/               # Controle de contas
│   │   ├── credit-cards/        # Gestão de cartões
│   │   ├── categories/          # Categorias personalizáveis
│   │   ├── installments/        # Rastreamento de parcelas
│   │   ├── time-tracking/       # Acompanhamento de horas
│   │   ├── accounts/            # Gestão de contas
│   │   ├── reports/             # Relatórios e análises
│   │   └── profile/             # Configurações de perfil
│   ├── (auth)/                  # Rotas de autenticação
│   │   ├── login/               # Página de login
│   │   └── register/            # Registro de usuário
│   ├── layout.tsx               # Layout raiz
│   └── page.tsx                 # Home
├── components/                   # Componentes reutilizáveis
│   ├── ui/                      # Componentes primitivos
│   ├── dashboard/               # Componentes do dashboard
│   ├── layout/                  # Componentes de layout
│   ├── transactions/            # Componentes de transações
│   └── time-tracking/           # Componentes de time tracking
├── lib/                         # Utilitários e clientes
│   ├── supabase/               # Clientes Supabase
│   ├── time-tracking.ts        # Lógica de time tracking
│   └── utils.ts                # Funções utilitárias
├── types/                      # Tipos TypeScript
│   └── database.types.ts       # Tipos gerados do banco
├── supabase/                   # Migrações e configuração
│   └── migrations/
└── public/                     # Assets estáticos
```

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+ e npm/yarn
- Conta no [Supabase](https://supabase.com)
- Variáveis de ambiente configuradas

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/financy.git
cd financy
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

Adicione suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

4. **Execute as migrações do banco de dados**
```bash
npx supabase db push
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📦 Dependências Principais

| Pacote | Versão | Propósito |
|--------|--------|----------|
| `next` | 16.1.6 | Framework React |
| `react` | 19.2.3 | Biblioteca UI |
| `typescript` | 5 | Type safety |
| `tailwindcss` | 4 | Estilização |
| `@supabase/ssr` | 0.5.2 | Cliente Supabase |
| `recharts` | 3.7 | Gráficos |
| `lucide-react` | 0.574 | Ícones |

---

## 💻 Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento na porta 3000
npm run build    # Build producción otimizado
npm start        # Inicia servidor em modo produção
npm run lint     # Verifica código com ESLint
```

---

## 🏛️ Padrões & Convenções

### Linguagem de Código
- **Código, variáveis, funções e comentários:** 🇬🇧 Inglês
- **Interface & UX:** 🇧🇷 Português (pt-BR)

### TypeScript & Type Safety
- ✅ Strict mode habilitado
- ✅ Sem uso de `any` — use `unknown` ou tipos específicos
- ✅ Interfaces definidas para todas as props
- ✅ Validação com Zod para schemas

### Componentes React
- 🎯 **Padrão:** Server Components por padrão
- 🔄 **Client Components:** Apenas quando necessário (interatividade, hooks, APIs do browser)
- 🎨 **Styling:** Tailwind CSS com função `cn()` para merge seguro de classes

### Commits
- Segue **Conventional Commits**: `feat:`, `fix:`, `chore:`, `refactor:`
- Exemplo: `feat: add transaction filters` ou `fix: correct dashboard metrics`

---

## 🔒 Segurança

- 🔐 **Row Level Security (RLS)** ativado em todas as tabelas
- 🔑 **Autenticação com Supabase Auth** — integrada e segura
- 🛡️ **Validação em Server Components** — não confie apenas em validação cliente
- 📋 **Políticas de acesso** — implementadas e testadas

---

## 📊 Monitoramento & Performance

- ⚡ Next.js com otimizações automáticas (code splitting, lazy loading)
- 🎭 React 19 com suporte a Server Components
- 📉 Tailwind CSS 4 com tree-shaking automático
- 🚀 Pronto para deploy em Vercel (ideal para Next.js)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Desenvolvimento

### Tecnologias Utilizadas
- Modern JavaScript (ES2024+)
- Async/Await para operações assíncronas
- React Hooks e Context API
- TanStack Query (quando necessário)
- CSS-in-JS com Tailwind

### Boas Práticas
- ✏️ ESLint para linting
- 🎨 Prettier para formatação (configurar se necessário)
- 🧪 Testes unitários (a implementar)
- 📚 Documentação inline em código complexo

---

## 🙋 Suporte

Tem dúvidas ou encontrou um bug? Abra uma [Issue](https://github.com/seu-usuario/financy/issues) ou entre em contato através de email.

---

**Feito com ❤️ usando Next.js, React e Supabase**
