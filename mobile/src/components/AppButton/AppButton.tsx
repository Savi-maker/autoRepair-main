import React from 'react'
import './AppButton.css'

type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'back'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AppButtonVariant
  loading?: boolean
}

const AppButton: React.FC<Props> = ({
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  children,
  ...rest
}) => {
  const isDisabled = Boolean(disabled) || loading

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={`app-btn app-btn--${variant} ${isDisabled ? 'app-btn--disabled' : ''} ${className}`.trim()}
    >
      {loading ? 'Ładowanie…' : children}
    </button>
  )
}

export default AppButton

