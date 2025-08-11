'use client'

import { useRouter } from 'next/navigation'

export function useNavigation() {
  const router = useRouter()

  const navigateToLogin = () => {
    console.log('🔄 Navigating to login...')
    router.push('/login')
  }

  const navigateToHome = () => {
    console.log('🔄 Navigating to home...')
    router.push('/')
  }

  const navigateToUserDashboard = (forceUser?: any) => {
    if (!forceUser) {
      console.log('❌ No user provided to navigate to dashboard')
      return
    }

    // Solo permitir admin y prestamista
    if (!['admin', 'prestamista'].includes(forceUser.role)) {
      console.log('❌ Role not allowed:', forceUser.role)
      navigateToLogin()
      return
    }

    const dashboardRoute = `/dashboard/${forceUser.role}`
    console.log(`🔄 SIMPLE NAVIGATION: Going to ${dashboardRoute}`)
    
    router.push(dashboardRoute)
  }

  const navigateToRoute = (route: string) => {
    console.log(`🔄 Navigating to route: ${route}`)
    router.push(route)
  }

  return {
    navigateToLogin,
    navigateToHome,
    navigateToUserDashboard,
    navigateToRoute,
  }
}