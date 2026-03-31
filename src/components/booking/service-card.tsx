'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface ServiceCardProps {
  name: string
  description: string
  basePrice: number
  duration: number
  requiresQuote: boolean
  requiresDeposit: boolean
  depositAmount?: number
  mostPopular?: boolean
  selected?: boolean
  onClick?: () => void
}

export function ServiceCard({
  name,
  description,
  basePrice,
  duration,
  requiresQuote,
  requiresDeposit,
  depositAmount,
  mostPopular,
  selected = false,
  onClick,
}: ServiceCardProps) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remaining = minutes % 60
    if (remaining === 0) return `${hours}h`
    return `${hours}h ${remaining}m`
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:border-primary/50',
        selected && 'border-primary ring-2 ring-primary/20'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{name}</CardTitle>
            {mostPopular && (
              <Badge variant="default" className="shrink-0 text-xs">Most Popular</Badge>
            )}
          </div>
          {requiresQuote ? (
            <Badge variant="warning" className="shrink-0">Request Quote</Badge>
          ) : (
            <span className="text-lg font-bold text-primary shrink-0">
              {formatCurrency(basePrice)}+
            </span>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {duration > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(duration)}</span>
            </div>
          )}
          {requiresDeposit && depositAmount && (
            <Badge variant="secondary" className="text-xs">
              {formatCurrency(depositAmount)} deposit
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
