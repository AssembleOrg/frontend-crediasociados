'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { TextField, Box, Typography, Chip, InputAdornment, Autocomplete as MuiAutocomplete, CircularProgress } from '@mui/material'
import { LocationOn, Home, Info } from '@mui/icons-material'
import { useLoadScript } from '@react-google-maps/api'

const libraries: ("places")[] = ["places"]

interface GoogleAddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  error?: boolean
  helperText?: string
  label?: string
  placeholder?: string
  required?: boolean
  fullWidth?: boolean
}

interface PlacePrediction {
  description: string
  place_id: string
}

export function GoogleAddressAutocomplete({
  value,
  onChange,
  error = false,
  helperText,
  label = 'Dirección (lugar de cobro)',
  placeholder = 'Ej: Av. Corrientes 1234, Buenos Aires',
  required = false,
  fullWidth = true,
}: GoogleAddressAutocompleteProps) {
  const [apiKeyMissing, setApiKeyMissing] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [options, setOptions] = useState<PlacePrediction[]>([])
  const [loading, setLoading] = useState(false)
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesService = useRef<google.maps.places.PlacesService | null>(null)
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null)

  // Get API key from environment
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
    libraries,
  })

  useEffect(() => {
    if (!apiKey) {
      setApiKeyMissing(true)
      console.warn('⚠️ Google Maps API key not configured')
      return
    }
  }, [apiKey])

  // Initialize Google Places services
  useEffect(() => {
    if (!isLoaded) return

    try {
      autocompleteService.current = new google.maps.places.AutocompleteService()
      sessionToken.current = new google.maps.places.AutocompleteSessionToken()
      
      // Create a dummy div for PlacesService (required by Google)
      const div = document.createElement('div')
      placesService.current = new google.maps.places.PlacesService(div)
    } catch (err) {
      console.error('Error initializing Google Places services:', err)
    }
  }, [isLoaded])

  // Fetch predictions
  const fetchPredictions = useCallback(
    async (input: string) => {
      if (!input || input.length < 3 || !autocompleteService.current) {
        setOptions([])
        return
      }

      setLoading(true)

      try {
        autocompleteService.current.getPlacePredictions(
          {
            input,
            componentRestrictions: { country: 'ar' },
            types: ['address'],
            sessionToken: sessionToken.current || undefined,
          },
          (predictions, status) => {
            setLoading(false)
            
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              setOptions(predictions.map(p => ({
                description: p.description,
                place_id: p.place_id
              })))
            } else {
              setOptions([])
            }
          }
        )
      } catch (err) {
        console.error('Error fetching predictions:', err)
        setLoading(false)
        setOptions([])
      }
    },
    []
  )

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPredictions(inputValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue, fetchPredictions])

  // Handle input change
  const handleInputChange = useCallback(
    (_event: any, newInputValue: string) => {
      setInputValue(newInputValue)
    },
    []
  )

  // Handle selection
  const handleChange = useCallback(
    (_event: any, newValue: PlacePrediction | string | null) => {
      if (typeof newValue === 'string') {
        onChange(newValue)
        setInputValue(newValue)
      } else if (newValue && newValue.description) {
        onChange(newValue.description)
        setInputValue(newValue.description)
        // Create new session token for next search
        sessionToken.current = new google.maps.places.AutocompleteSessionToken()
      }
    },
    [onChange]
  )

  // Show error if API key is missing
  if (apiKeyMissing) {
    return (
      <Box>
        <TextField
          fullWidth={fullWidth}
          label={label}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          error={error}
          helperText={helperText || 'API key de Google Maps no configurada. Escribe la dirección manualmente.'}
          required={required}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Home color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
        <Chip
          icon={<Info />}
          label="Autocomplete no disponible"
          size="small"
          color="warning"
          variant="outlined"
          sx={{ mt: 1 }}
        />
      </Box>
    )
  }

  // Show error if script failed to load
  if (loadError) {
    return (
      <Box>
        <TextField
          fullWidth={fullWidth}
          label={label}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          error={error}
          helperText={helperText || 'Error al cargar Google Maps. Escribe la dirección manualmente.'}
          required={required}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Home color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
        <Chip
          icon={<Info />}
          label="Error al cargar autocomplete"
          size="small"
          color="error"
          variant="outlined"
          sx={{ mt: 1 }}
        />
      </Box>
    )
  }

  // Show loading state while script loads
  if (!isLoaded) {
    return (
      <TextField
        fullWidth={fullWidth}
        label={label}
        placeholder="Cargando..."
        disabled
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Home color="action" />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          }
        }}
      />
    )
  }

  return (
    <Box>
      <MuiAutocomplete
        freeSolo
        options={options}
        getOptionLabel={(option) => typeof option === 'string' ? option : option.description}
        value={value}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onChange={handleChange}
        loading={loading}
        loadingText="Buscando direcciones..."
        noOptionsText={
          inputValue.length < 3
            ? "Escribe al menos 3 caracteres"
            : "No se encontraron sugerencias"
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            error={error}
            helperText={helperText || 'Escribe y selecciona una dirección de Google Maps'}
            required={required}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <Home color="action" />
                  </InputAdornment>
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
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        )}
        renderOption={(props, option) => {
          return (
            <Box
              component="li"
              {...props}
              key={typeof option === 'string' ? option : option.place_id}
              sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <LocationOn color="action" sx={{ flexShrink: 0 }} />
              <Typography variant="body2" color="text.primary" sx={{ flex: 1 }}>
                {typeof option === 'string' ? option : option.description}
              </Typography>
            </Box>
          )
        }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        <LocationOn sx={{ fontSize: 16, color: 'success.main' }} />
        <Typography variant="caption" color="success.main">
          Autocomplete de Google Places activo
        </Typography>
      </Box>
    </Box>
  )
}

