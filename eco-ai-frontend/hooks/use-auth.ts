"use client"

import { useState, useEffect, useCallback } from "react"
import { type User, UserRole } from "@/types"
import { api } from "@/lib/api"

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("access_token")

    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser)
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        })
      } catch {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    } else {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.auth.login(email, password)
    setState({
      user: response.user,
      isLoading: false,
      isAuthenticated: true,
    })
    return response
  }, [])

  const register = useCallback(
    async (data: {
      email: string
      password: string
      full_name?: string
      role: UserRole
    }) => {
      return api.auth.register(data)
    },
    [],
  )

  const logout = useCallback(() => {
    api.auth.logout()
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const user = await api.auth.getCurrentUser()
      localStorage.setItem("user", JSON.stringify(user))
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      })
    } catch {
      logout()
    }
  }, [logout])

  const hasRole = useCallback(
    (roles: UserRole | UserRole[]) => {
      if (!state.user) return false
      const roleArray = Array.isArray(roles) ? roles : [roles]
      return roleArray.includes(state.user.role)
    },
    [state.user],
  )

  const isOfficerOrAdmin = useCallback(() => {
    return hasRole([UserRole.OFFICER, UserRole.ADMIN])
  }, [hasRole])

  const isAdmin = useCallback(() => {
    return hasRole(UserRole.ADMIN)
  }, [hasRole])

  return {
    ...state,
    login,
    register,
    logout,
    refreshUser,
    hasRole,
    isOfficerOrAdmin,
    isAdmin,
  }
}
