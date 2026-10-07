export function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  if (typeof window === 'undefined') return configuredUrl.replace(/\/+$/, '');

  try {
    const apiUrl = new URL(configuredUrl);
    if (apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1') {
      apiUrl.hostname = window.location.hostname;
    }
    return apiUrl.toString().replace(/\/+$/, '');
  } catch {
    return configuredUrl.replace(/\/+$/, '');
  }
}
