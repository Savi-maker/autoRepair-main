export async function hashPassword(password: string, salt: string = ''): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function sanitizeString(input: string): string {
  return String(input).trim()
}

export function sanitizeEmail(email: string): string {
  return String(email).trim().toLowerCase()
}

export function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Hasło musi mieć minimum 8 znaków' }
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Hasło musi zawierać co najmniej jedną wielką literę' }
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Hasło musi zawierać co najmniej jedną małą literę' }
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Hasło musi zawierać co najmniej jedną cyfrę' }
  }
  
  return { isValid: true, message: 'Hasło jest silne' }
}
