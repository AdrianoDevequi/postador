'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const password = formData.get('password')
    const correctPassword = process.env.ADMIN_PASSWORD

    if (password === correctPassword) {
        // Set cookie valid for 7 days
        const cookieStore = await cookies();
        cookieStore.set('admin_session', password.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        })

        redirect('/')
    }
}
