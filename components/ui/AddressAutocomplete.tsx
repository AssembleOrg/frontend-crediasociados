'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { TextField, Autocomplete, Box, Typography, CircularProgress, Chip } from '@mui/material'
import { LocationOn, Home, Info } from '@mui/icons-material'

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  error?: boolean
  helperText?: string
  label?: string
  placeholder?: string
  required?: boolean
  fullWidth?: boolean
}

interface GeoapifyResult {
  properties: {
    formatted: string
    address_line1: string
    address_line2: string
    street: string
    housenumber?: string
    suburb?: string
    city?: string
    state?: string
    postcode?: string
    country: string
    lat: number
    lon: number
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  error = false,
  helperText,
  label = 'Dirección (lugar de cobro)',
  placeholder = 'Ej: Av. Corrientes 1234, Buenos Aires',
  required = false,
  fullWidth = true,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [options, setOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Check if API key is configured
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY

  useEffect(() => {
    if (!apiKey) {
      setApiKeyMissing(true)
      console.warn('⚠️ Geoapify API key not configured')
    }
  }, [apiKey])

  // Fetch predictions from Geoapify
  const fetchPredictions = useCallback(async (input: string) => {
    if (!input || input.length < 3) {
      setOptions([])
      return
    }

    if (!apiKey) {
      setOptions([])
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setLoading(true)

    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?` +
        `text=${encodeURIComponent(input)}&` +
        `apiKey=${apiKey}&` +
        `lang=es&` +
        `filter=countrycode:ar`, // Solo Argentina
        {
          signal: abortControllerRef.current.signal,
        }
      )

      if (!response.ok) {
        throw new Error('Error fetching addresses from Geoapify')
      }

      const data = await response.json()
      const results: GeoapifyResult[] = data.features || []

      // Extract formatted addresses
      const addresses = results.map(result => {
        const props = result.properties
        // Construir dirección formateada
        let formattedAddress = ''
        
        if (props.housenumber && props.street) {
          formattedAddress = `${props.street} ${props.housenumber}`
        } else if (props.address_line1) {
          formattedAddress = props.address_line1
        } else {
          formattedAddress = props.formatted
        }
        
        // Agregar ciudad/localidad
        if (props.city || props.suburb) {
          formattedAddress += `, ${props.city || props.suburb}`
        }
        
        // Agregar provincia
        if (props.state) {
          formattedAddress += `, ${props.state}`
        }
        
        return formattedAddress
      })

      setOptions(addresses)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      console.error('Error fetching addresses from Geoapify:', err)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [apiKey])

  // Debounce input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== value && inputValue.length >= 3) {
        fetchPredictions(inputValue)
      }
    }, 300) // 300ms debounce (más rápido que antes)

    return () => clearTimeout(timer)
  }, [inputValue, value, fetchPredictions])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Handle input change
  const handleInputChange = useCallback(
    (_event: React.SyntheticEvent, newInputValue: string) => {
      setInputValue(newInputValue)
    },
    []
  )

  // Handle selection
  const handleChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string | null) => {
      if (newValue) {
        onChange(newValue)
      } else {
        onChange('')
      }
    },
    [onChange]
  )

  // If API key is missing, show warning but allow manual input
  if (apiKeyMissing) {
    return (
      <Box>
        <TextField
          label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          error={error}
          helperText={helperText}
          required={required}
          fullWidth={fullWidth}
          InputProps={{
            startAdornment: <Home color="action" sx={{ mr: 1 }} />,
          }}
        />
        <Chip
          icon={<Info />}
          label="Autocompletado deshabilitado (falta API key de Geoapify)"
          size="small"
          color="warning"
          variant="outlined"
          sx={{ mt: 1 }}
        />
      </Box>
    )
  }

  return (
    <Autocomplete
      freeSolo
      options={options}
      value={value}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleChange}
      loading={loading}
      loadingText="Buscando direcciones..."
      noOptionsText={
        inputValue.length < 3 
          ? "Escribe al menos 3 caracteres" 
          : loading 
          ? "Buscando..." 
          : "No se encontraron sugerencias. Puedes escribir manualmente."
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText || 'Escribe y selecciona una dirección, o escribe manualmente'}
          required={required}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <Home color="action" sx={{ mr: 1, ml: 1 }} />
                {params.InputProps.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option, state) => {
        const { key, ...restProps } = props as any
        return (
          <Box
            component="li"
            {...restProps}
            key={`geoapify-${state.index}`}
            sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
          >
            <LocationOn color="action" sx={{ flexShrink: 0 }} />
            <Typography variant="body2" color="text.primary" sx={{ flex: 1 }}>
              {option}
            </Typography>
          </Box>
        )
      }}
    />
  )
}
