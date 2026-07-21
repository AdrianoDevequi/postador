'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { endSession, startSession, verifyPassword } from '@/lib/auth'

export async function login(formData: FormData) {
    const email = String(formData.get('email') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')

    // Same message for unknown email and wrong password, so the response
    // doesn't reveal which accounts exist.
    const invalid =
        `/login?error=${encodeURIComponent('Email ou senha inválidos.')}` +
        `&email=${encodeURIComponent(email)}`

    if (!email || !password) redirect(invalid)

    const user = email ? await prisma.user.findUnique({ where: { email } }) : null
    if (!user || !(await verifyPassword(password, user.passwordHash))) redirect(invalid)

    await startSession(user.id)
    redirect('/')
}

export async function logout() {
    await endSession()
    redirect('/login')
}
