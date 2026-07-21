import { signup } from './actions'
import { AuthCard, AuthLink, Field, SubmitButton } from '../ui/AuthCard'
import { PasswordField } from '../ui/PasswordField'

export default async function SignupPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; email?: string; name?: string }>
}) {
    const { error, email, name } = await searchParams

    return (
        <AuthCard
            title="Criar conta"
            subtitle="Cadastre-se para gerenciar seus perfis do Instagram."
            error={error}
            footer={<>Já tem conta? <AuthLink href="/login">Entrar</AuthLink></>}
        >
            <form action={signup} className="space-y-4">
                <Field label="Nome" name="name" defaultValue={name} placeholder="Seu nome (opcional)" />
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
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                />
                <PasswordField
                    label="Confirmar senha"
                    name="confirm"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Repita a senha"
                />
                <SubmitButton>Criar conta</SubmitButton>
            </form>
        </AuthCard>
    )
}
