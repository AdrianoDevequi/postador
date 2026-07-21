'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { hashPassword, startSession } from '@/lib/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function signup(formData: FormData) {
    const name = String(formData.get('name') || '').trim()
    const email = String(formData.get('email') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')
    const confirm = String(formData.get('confirm') || '')

    const back = (msg: string) =>
        `/signup?error=${encodeURIComponent(msg)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`

    if (!EMAIL_RE.test(email)) redirect(back('Informe um email válido.'))
    if (password.length < 8) redirect(back('A senha precisa ter pelo menos 8 caracteres.'))
    if (password !== confirm) redirect(back('As senhas não conferem.'))

    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
        redirect(back('Já existe uma conta com esse email.'))
    }

    const user = await prisma.user.create({
        data: { email, name: name || null, passwordHash: await hashPassword(password) },
    })

    // Profiles created before accounts existed have no owner — the first
    // account to be created adopts them.
    await prisma.profile.updateMany({ where: { userId: null }, data: { userId: user.id } })

    await startSession(user.id)
    redirect('/')
}
