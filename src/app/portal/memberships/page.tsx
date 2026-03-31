'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Crown,
  Check,
  Loader2,
  AlertCircle,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { MEMBERSHIP_PLANS } from '@/lib/constants'
import type { Subscription } from '@/types'

export default function MembershipsPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)

  const supabase = createClient()

  const fetchSubscription = useCallback(async () => {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', user.id)
      .in('status', ['active', 'past_due', 'paused'])
      .maybeSingle()

    setSubscription(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  async function handleCancel() {
    if (!subscription) return
    setCanceling(true)

    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('id', subscription.id)

    if (!error) {
      setSubscription({ ...subscription, status: 'canceled' })
      setCancelConfirm(false)
    }

    setCanceling(false)
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-20 md:pb-0">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Memberships
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {subscription
            ? 'Manage your current membership plan.'
            : 'Choose a plan that fits your needs.'}
        </p>
      </div>

      {/* Active Subscription */}
      {subscription && subscription.status !== 'canceled' && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crown className="h-5 w-5 text-amber-500" />
                Your Current Plan
              </CardTitle>
              <Badge
                className={cn(
                  subscription.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : subscription.status === 'past_due'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                )}
              >
                {subscription.status === 'active'
                  ? 'Active'
                  : subscription.status === 'past_due'
                    ? 'Past Due'
                    : 'Paused'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {subscription.plan_name}
              </h3>
              {/* Find matching plan to show features */}
              {MEMBERSHIP_PLANS.find(
                (p) => p.name === subscription.plan_name
              ) && (
                <p className="mt-1 text-sm text-gray-600">
                  {
                    MEMBERSHIP_PLANS.find(
                      (p) => p.name === subscription.plan_name
                    )!.description
                  }
                </p>
              )}
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>
                  Period: {formatDate(subscription.current_period_start)} -{' '}
                  {formatDate(subscription.current_period_end)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>
                  Renews: {formatDate(subscription.current_period_end)}
                </span>
              </div>
            </div>

            {/* Plan Features */}
            {MEMBERSHIP_PLANS.find(
              (p) => p.name === subscription.plan_name
            ) && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Included Features
                  </p>
                  <ul className="mt-2 space-y-2">
                    {MEMBERSHIP_PLANS.find(
                      (p) => p.name === subscription.plan_name
                    )!.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <Check className="h-4 w-4 shrink-0 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <Separator />

            {/* Cancel Section */}
            {!cancelConfirm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelConfirm(true)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Cancel Membership
              </Button>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Cancel your membership?
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                      You will lose access to your membership benefits at the
                      end of the current billing period.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={canceling}
                        onClick={handleCancel}
                      >
                        {canceling ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Canceling...
                          </>
                        ) : (
                          'Yes, Cancel'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancelConfirm(false)}
                      >
                        Keep Plan
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      {(!subscription || subscription.status === 'canceled') && (
        <>
          <div className="text-center">
            <Sparkles className="mx-auto h-10 w-10 text-amber-400" />
            <h3 className="mt-3 text-lg font-semibold text-gray-900">
              Choose Your Plan
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Save on regular services with a monthly membership.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MEMBERSHIP_PLANS.map((plan, index) => {
              const isPopular = index === MEMBERSHIP_PLANS.length - 1

              return (
                <Card
                  key={plan.slug}
                  className={cn(
                    'relative flex flex-col',
                    isPopular && 'border-gray-900 shadow-md'
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gray-900 text-white">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="flex-1">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="pt-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-sm text-gray-500">
                        /{plan.interval}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Separator />
                    <ul className="space-y-2.5">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={isPopular ? 'default' : 'outline'}
                      asChild
                    >
                      <a href={`/api/subscribe?plan=${plan.slug}`}>
                        Subscribe
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
