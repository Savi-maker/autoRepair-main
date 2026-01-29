export function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
    return !!gl
  } catch (e) {
    return false
  }
}
