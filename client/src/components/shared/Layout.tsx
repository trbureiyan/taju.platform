import type { ReactNode } from 'react'
import { Nav } from './Nav'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-superficie-base flex flex-col">
      <Nav />
      <main className="flex-1 w-full max-w-contenedor mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
