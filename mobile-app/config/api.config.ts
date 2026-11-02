const PRODUCTION_API_URL = 'https://hisabbarabar.qzz.io/api'

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL

if (__DEV__ && !configuredApiUrl) {
  throw new Error(
    'EXPO_PUBLIC_API_URL is required in development. Set it to an API URL reachable from this device.'
  )
}

export const API_URL = configuredApiUrl || PRODUCTION_API_URL

export default {
  API_URL,
  PRODUCTION_API_URL,
}
