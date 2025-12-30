"use client"

import type React from "react"
import { useState } from "react"

interface TooltipProps {
  message: string
}

export const Tooltip: React.FC<TooltipProps> = ({ message }) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="tooltip-container" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      <span className="tooltip-icon">ⓘ</span>
      {isVisible && <div className="tooltip-content">{message}</div>}
    </div>
  )
}

