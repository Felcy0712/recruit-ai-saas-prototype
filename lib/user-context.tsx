"use client"

import { createContext, useContext, useState, useEffect } from "react"

type User = {
  name: string
  email: string
  company: string
}

const UserContext = createContext<{
  user: User | null
  setUser: (u: User | null) => void
}>({
  user: null,
  setUser: () => {},
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)

  // load from localStorage on first render
  useEffect(() => {
    const saved = localStorage.getItem("recruitai-user")
    if (saved) setUserState(JSON.parse(saved))
  }, [])

  const setUser = (u: User | null) => {
    if (!u) {
      localStorage.removeItem("recruitai-user")
      setUserState(null)
      return
    }

    localStorage.setItem("recruitai-user", JSON.stringify(u))
    setUserState(u)
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
