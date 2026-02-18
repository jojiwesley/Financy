import { redirect } from 'next/navigation';

// A rota raiz redireciona para o dashboard dentro do grupo (app)
export default function RootPage() {
  redirect('/dashboard');
}
