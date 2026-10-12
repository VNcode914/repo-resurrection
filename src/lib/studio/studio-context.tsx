import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type StudioContextValue = {
  query: string
  setQuery: (value: string) => void
  notice: string | null
  setNotice: (value: string | null) => void
}

const StudioContext = createContext<StudioContextValue | null>(null)

export function useStudio() {
  const ctx = useContext(StudioContext)
  if (!ctx) {
    throw new Error('useStudio must be used inside StudioProvider')
  }
  return ctx
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  const value = useMemo(
    () => ({ query, setQuery, notice, setNotice }),
    [query, notice],
  )

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}
