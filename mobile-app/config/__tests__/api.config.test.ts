describe('API URL configuration', () => {
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = originalApiUrl ?? ''
  })

  it('uses the configured URL', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://10.0.2.2:3000/api'

    jest.isolateModules(() => {
      const { API_URL } = jest.requireActual<typeof import('../api.config')>(
        '../api.config'
      )
      expect(API_URL).toBe('http://10.0.2.2:3000/api')
    })
  })

  it('fails clearly when a development URL is missing', () => {
    process.env.EXPO_PUBLIC_API_URL = ''

    expect(() => {
      jest.isolateModules(() => {
        jest.requireActual('../api.config')
      })
    }).toThrow('EXPO_PUBLIC_API_URL is required in development')
  })
})
