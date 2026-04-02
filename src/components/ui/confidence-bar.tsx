'use client'

import { useState } from 'react'
import { Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getConfidenceColor,
  getConfidenceTextColor,
  getConfidenceBorderColor,
} from '@/lib/pricing-engine'

interface ConfidenceBarProps {
  confidence: number // 0-95
  message: string
  compact?: boolean // mini version for inline steps
  tips?: string[] // missing field tips
  aiSuggestion?: string
  aiFactors?: string[]
  aiLoading?: boolean
}

export function ConfidenceBar({
  confidence,
  message,
  compact = false,
  tips,
  aiSuggestion,
  aiFactors,
  aiLoading,
}: ConfidenceBarProps) {
  const [showTips, setShowTips] = useState(false)

  // Compact version — just a thin bar with percentage
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2',
          getConfidenceBorderColor(confidence)
        )}
      >
        <div className="h-1.5 flex-1 rounded-full bg-gray-200">
          <div
            className={cn(
              'h-1.5 rounded-full transition-all',
              getConfidenceColor(confidence)
            )}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <span
          className={cn(
            'text-[10px] font-bold shrink-0',
            getConfidenceTextColor(confidence)
          )}
        >
          Quote accuracy: {confidence}%
        </span>
      </div>
    )
  }

  // Full version
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        getConfidenceBorderColor(confidence)
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2.5 flex-1 rounded-full bg-gray-200">
          <div
            className={cn(
              'h-2.5 rounded-full transition-all duration-500',
              getConfidenceColor(confidence)
            )}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <span
          className={cn(
            'text-xs font-bold shrink-0',
            getConfidenceTextColor(confidence)
          )}
        >
          {confidence}%
        </span>
      </div>
      <p
        className={cn(
          'text-xs font-medium',
          getConfidenceTextColor(confidence)
        )}
      >
        Quote Accuracy: {message}
      </p>

      {/* AI loading indicator */}
      {aiLoading && (
        <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" /> Analyzing your details...
        </p>
      )}

      {/* AI suggestion */}
      {aiSuggestion && !aiLoading && (
        <p className="mt-1 text-xs text-gray-600">{aiSuggestion}</p>
      )}

      {/* AI factors */}
      {aiFactors && aiFactors.length > 0 && !aiLoading && (
        <div className="mt-1 flex flex-wrap gap-1">
          {aiFactors.map((f, i) => (
            <span
              key={i}
              className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Tips toggle */}
      {tips && tips.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            <Info className="h-3 w-3" />
            {showTips ? 'Hide tips' : 'How to get the most accurate quote'}
          </button>
          {showTips && (
            <ul className="mt-2 space-y-1 text-xs text-gray-600">
              {tips.map((tip, i) => (
                <li key={i}>- {tip}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
