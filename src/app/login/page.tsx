import { login } from './actions'
import { AuthCard, AuthLink, Field, SubmitButton } from '../ui/AuthCard'
import { PasswordField } from '../ui/PasswordField'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; email?: string }>
}) {
    const { error, email } = await searchParams

    return (
        <AuthCard
            title="Entrar"
            subtitle="Acesse o painel com seu email e senha."
            error={error}
            footer={<>Ainda não tem conta? <AuthLink href="/signup">Criar conta</AuthLink></>}
        >
            <form action={login} className="space-y-4">
                <Field
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    defaultValue={email}
                    placeholder="voce@exemplo.com"
                />
                <PasswordField
                    label="Senha"
                    name="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                />
                <SubmitButton>Entrar</SubmitButton>
            </form>
        </AuthCard>
    )
}
