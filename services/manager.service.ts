import api from './api'

export interface ManagerDashboardData {
  capitalDisponible: number
  capitalAsignado: number
  recaudadoEsteMes: number
  valorCartera: number
}

class ManagerService {
  async getDashboardData(): Promise<ManagerDashboardData> {
    const response = await api.get('/users/manager/dashboard')
    return response.data.data
  }
}

export default new ManagerService()
