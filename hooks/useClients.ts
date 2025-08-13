'use client';

import { useState, useCallback, useEffect } from 'react';
import { useClientsStore } from '@/stores/clients';
import { clientsService } from '@/services/clients.service';
import {
  apiClientToClient,
  clientToCreateDto,
  clientToUpdateDto,
} from '@/types/transforms';
import type {
  Client,
  CreateClientDto,
  UpdateClientDto,
  PaginationParams,
  ApiError,
} from '@/types/auth';

/**
 * THE CHEF/CONTROLLER - useClients Hook
 * The brain of the clients management operation.
 * - Calls the Service
 * - Handles loading and error states
 * - Gives simple orders to the Store to update data
 * - Returns everything the UI needs
 */
export const useClients = () => {
  const clientsStore = useClientsStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(
    async (params?: PaginationParams): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        // Merge with current filters
        const filters = { ...clientsStore.filters, ...params };

        // Call the service
        const response = await clientsService.getClients(filters);

        // Transform API clients to frontend clients
        const clients = response.data.map(apiClientToClient);

        // Update the store with simple actions
        clientsStore.setClients(clients);
        clientsStore.setPagination(response.meta);
        clientsStore.setFilters(filters);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to fetch clients');
      } finally {
        setIsLoading(false);
      }
    },
    []
  ); // ✅ Sin dependencias - clientsStore es estable

  const createClient = useCallback(
    async (
      clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        // Transform to API format (excluding job field for create)
        const createDto = clientToCreateDto(clientData);

        // Call the service to create the client
        const apiClient = await clientsService.createClient(createDto);

        // If client has a job, update it separately since CreateDto doesn't support job
        if (clientData.job) {
          const updateDto = clientToUpdateDto({ job: clientData.job });
          const updatedApiClient = await clientsService.updateClient(apiClient.id, updateDto);
          
          // Transform back to frontend format
          const newClient = apiClientToClient(updatedApiClient);
          
          // Update the store
          clientsStore.addClient(newClient);
        } else {
          // Transform back to frontend format
          const newClient = apiClientToClient(apiClient);
          
          // Update the store
          clientsStore.addClient(newClient);
        }

        return true;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to create client');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateClient = useCallback(
    async (id: string, clientData: Partial<Client>): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        // Transform to API format
        const updateDto = clientToUpdateDto(clientData);

        // Call the service
        const apiClient = await clientsService.updateClient(id, updateDto);

        // Transform back to frontend format
        const updatedClient = apiClientToClient(apiClient);

        // Update the store
        clientsStore.updateClient(updatedClient);

        return true;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to update client');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteClient = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the service
      await clientsService.deleteClient(id);

      // Update the store
      clientsStore.removeClient(id);

      return true;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to delete client');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getClientById = useCallback(
    async (id: string): Promise<Client | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Call the service
        const apiClient = await clientsService.getClientById(id);

        // Transform to frontend format
        const client = apiClientToClient(apiClient);

        // Update selected client in store
        clientsStore.setSelectedClient(client);

        return client;
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to fetch client');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const searchClient = useCallback(async (query: string): Promise<Client[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the service
      const apiClients = await clientsService.searchClient(query);

      // Transform to frontend format
      const clients = apiClients.map(apiClientToClient);

      return clients;
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to search clients');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch clients when hook initializes
  useEffect(() => {
    fetchClients();
  }, []); // Only on mount - fetchClients handles filter updates

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSelectedClient = useCallback(() => {
    clientsStore.setSelectedClient(null);
  }, []);

  return {
    clients: clientsStore.clients,
    selectedClient: clientsStore.selectedClient,
    pagination: clientsStore.pagination,
    filters: clientsStore.filters,

    isLoading,
    error,

    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    getClientById,
    searchClient,
    clearSelectedClient,
    clearError,

    getFilteredClients: clientsStore.getFilteredClients,
    getTotalClients: clientsStore.getTotalClients,
    getClientByDni: clientsStore.getClientByDni,
    getClientByCuit: clientsStore.getClientByCuit,
  };
};
