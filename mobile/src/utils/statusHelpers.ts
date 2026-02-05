export type AppointmentStatus = 'oczekujacy' | 'zaakceptowany' | 'wykonano'

export function formatAppointmentStatus(status: string | null | undefined): string {
  if (!status) return '—'
  
  const statusMap: Record<string, string> = {
    'oczekujacy': 'Oczekujący',
    'zaakceptowany': 'Zaakceptowany',
    'wykonano': 'Wykonano',
  }
  
  return statusMap[status.toLowerCase()] || status
}

export type OrderStatus = 'nowe' | 'w_trakcie' | 'zakonczone' | 'anulowane'

export function formatOrderStatus(status: string | null | undefined): string {
  if (!status) return '—'
  
  const statusMap: Record<string, string> = {
    'nowe': 'Oczekujące',
    'w_trakcie': 'W trakcie',
    'zakonczone': 'Zakończone',
    'anulowane': 'Anulowane',
  }
  
  return statusMap[status.toLowerCase()] || status
}

export type InvoiceStatus = 'wystawiona' | 'oczekuje' | 'zaplacona' | 'anulowana'

export function formatInvoiceStatus(status: string | null | undefined): string {
  if (!status) return '—'
  
  const statusMap: Record<string, string> = {
    'wystawiona': 'Wystawiona',
    'oczekuje': 'Oczekuje',
    'zaplacona': 'Zapłacona',
    'anulowana': 'Anulowana',
  }
  
  return statusMap[status.toLowerCase()] || status
}

export function getStatusColor(status: string | null | undefined, type: 'appointment' | 'order' | 'invoice'): string {
  if (!status) return '#666'
  
  const s = status.toLowerCase()
  
  if (type === 'appointment') {
    if (s === 'oczekujacy') return '#ff9800'
    if (s === 'zaakceptowany') return '#2196f3'
    if (s === 'wykonano') return '#4caf50'
  }
  
  if (type === 'order') {
    if (s === 'nowe') return '#ff9800'
    if (s === 'w_trakcie') return '#2196f3'
    if (s === 'zakonczone') return '#4caf50'
    if (s === 'anulowane') return '#f44336'
  }
  
  if (type === 'invoice') {
    if (s === 'wystawiona' || s === 'oczekuje') return '#ff9800'
    if (s === 'zaplacona') return '#4caf50'
    if (s === 'anulowana') return '#f44336'
  }
  
  return '#666'
}
