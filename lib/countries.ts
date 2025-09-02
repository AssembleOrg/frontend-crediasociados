/**
 * Latin American countries with their phone codes
 */

export interface Country {
  code: string
  name: string
  phoneCode: string
  flag: string
}

export const LATIN_AMERICAN_COUNTRIES: Country[] = [
  { code: 'AR', name: 'Argentina', phoneCode: '54', flag: '🇦🇷' },
  { code: 'BO', name: 'Bolivia', phoneCode: '591', flag: '🇧🇴' },
  { code: 'BR', name: 'Brasil', phoneCode: '55', flag: '🇧🇷' },
  { code: 'CL', name: 'Chile', phoneCode: '56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', phoneCode: '57', flag: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica', phoneCode: '506', flag: '🇨🇷' },
  { code: 'CU', name: 'Cuba', phoneCode: '53', flag: '🇨🇺' },
  { code: 'DO', name: 'República Dominicana', phoneCode: '1', flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', phoneCode: '593', flag: '🇪🇨' },
  { code: 'SV', name: 'El Salvador', phoneCode: '503', flag: '🇸🇻' },
  { code: 'GT', name: 'Guatemala', phoneCode: '502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', phoneCode: '504', flag: '🇭🇳' },
  { code: 'MX', name: 'México', phoneCode: '52', flag: '🇲🇽' },
  { code: 'NI', name: 'Nicaragua', phoneCode: '505', flag: '🇳🇮' },
  { code: 'PA', name: 'Panamá', phoneCode: '507', flag: '🇵🇦' },
  { code: 'PY', name: 'Paraguay', phoneCode: '595', flag: '🇵🇾' },
  { code: 'PE', name: 'Perú', phoneCode: '51', flag: '🇵🇪' },
  { code: 'UY', name: 'Uruguay', phoneCode: '598', flag: '🇺🇾' },
  { code: 'VE', name: 'Venezuela', phoneCode: '58', flag: '🇻🇪' },
]

export const getCountryByCode = (code: string): Country | undefined => {
  return LATIN_AMERICAN_COUNTRIES.find(country => country.code === code)
}

export const getCountryByPhoneCode = (phoneCode: string): Country | undefined => {
  return LATIN_AMERICAN_COUNTRIES.find(country => country.phoneCode === phoneCode)
}
