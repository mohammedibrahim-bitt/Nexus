import React from 'react'
import './index.scss'

const BeforeLogin: React.FC = () => {
  return (
    <div className="nx-login-before">
      {/* Brand pill */}
      <div className="nx-login-before__badge">
        <span className="nx-login-before__badge-dot" />
        Nexus Admin
      </div>

      {/* Headline */}
      <h1 className="nx-login-before__title">
        Welcome back
      </h1>
      <p className="nx-login-before__subtitle">
        Sign in to manage your platform — content, users, and settings — all in one place.
      </p>
    </div>
  )
}

export default BeforeLogin
