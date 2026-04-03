'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface ReviewActionsProps {
  reviewId: string
  field: 'is_approved' | 'is_featured'
  currentValue: boolean
  labelOn: string
  labelOff: string
  rating?: number
  hasProfileId?: boolean
}

export function ReviewActions({
  reviewId,
  field,
  currentValue,
  labelOn,
  labelOff,
  rating,
  hasProfileId,
}: ReviewActionsProps) {
  const router = useRouter()
  const [value, setValue] = useState(currentValue)
  const [toggling, setToggling] = useState(false)

  async function handleToggle() {
    setToggling(true)
    const newValue = !value

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue }),
      })

      if (res.ok) {
        setValue(newValue)

        // When approving a review, issue credit + crew bonus
        if (field === 'is_approved' && newValue === true) {
          // Issue customer credit (only if they have a profile)
          if (hasProfileId) {
            fetch('/api/reviews/credit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ review_id: reviewId }),
            }).catch(() => {})
          }

          // Issue crew bonus (only for 5-star reviews)
          if (rating === 5) {
            fetch('/api/reviews/crew-bonus', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ review_id: reviewId }),
            }).catch(() => {})
          }
        }

        router.refresh()
      }
    } catch {
      // Silently fail
    } finally {
      setToggling(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      className="disabled:opacity-50"
    >
      <Badge
        variant={value ? 'success' : 'secondary'}
        className="cursor-pointer"
      >
        {toggling ? '...' : value ? labelOn : labelOff}
      </Badge>
    </button>
  )
}
