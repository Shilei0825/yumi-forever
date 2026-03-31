"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'

interface ReviewPublishToggleProps {
  reviewId: string
  isPublished: boolean
}

export function ReviewPublishToggle({ reviewId, isPublished }: ReviewPublishToggleProps) {
  const router = useRouter()
  const [published, setPublished] = useState(isPublished)
  const [toggling, setToggling] = useState(false)

  async function handleToggle() {
    setToggling(true)
    const supabase = createClient()

    const newValue = !published
    const { error } = await supabase
      .from('reviews')
      .update({ is_published: newValue })
      .eq('id', reviewId)

    if (!error) {
      setPublished(newValue)
      router.refresh()
    }
    setToggling(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      className="disabled:opacity-50"
    >
      <Badge
        variant={published ? 'success' : 'secondary'}
        className="cursor-pointer"
      >
        {toggling ? '...' : published ? 'Published' : 'Hidden'}
      </Badge>
    </button>
  )
}
