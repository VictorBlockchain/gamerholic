'use client'

import React from 'react'
import { DynamicWidget } from '@dynamic-labs/sdk-react-core'

export function WalletConnectButton() {
  // Renders Dynamic's widget which includes connect/disconnect and wallet management
  return (
    <div className="dynamic-wallet-theme flex items-center">
      <DynamicWidget />
    </div>
  )
}
