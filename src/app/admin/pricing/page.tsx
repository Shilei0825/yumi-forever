"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Home, Car, DollarSign, Check, X } from 'lucide-react'
import type { PricingRule } from '@/lib/pricing'

// =====================================================
// Types
// =====================================================

type RuleEdit = {
  value: string
  is_active: boolean
}

type FeedbackMessage = {
  type: 'success' | 'error'
  text: string
}

// =====================================================
// Constants
// =====================================================

const HOME_RULE_TYPES = ['home_dirtiness', 'home_last_cleaned', 'home_floorplan', 'home_sqft'] as const
const AUTO_RULE_TYPES = ['auto_vehicle_class', 'auto_dirtiness', 'auto_condition'] as const

const RULE_TYPE_LABELS: Record<string, string> = {
  home_dirtiness: 'Dirtiness Level',
  home_last_cleaned: 'Last Cleaned',
  home_floorplan: 'Floor Plan',
  home_sqft: 'Square Footage',
  auto_vehicle_class: 'Vehicle Class',
  auto_dirtiness: 'Dirtiness Level',
  auto_condition: 'Condition Add-ons',
}

const VALUE_TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'warning'> = {
  multiplier: 'default',
  flat_addition: 'warning',
  base_price: 'secondary',
}

const VALUE_TYPE_LABELS: Record<string, string> = {
  multiplier: 'Multiplier',
  flat_addition: 'Flat $',
  base_price: 'Base Price',
}

// =====================================================
// Component
// =====================================================

export default function AdminPricingPage() {
  const [rules, setRules] = useState<PricingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [edits, setEdits] = useState<Record<string, RuleEdit>>({})
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null)
  const [activeTab, setActiveTab] = useState('home_care')

  // --------------------------------------------------
  // Fetch rules
  // --------------------------------------------------

  const fetchRules = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .order('sort_order')

    if (error) {
      console.error('Error fetching pricing rules:', error)
      setFeedback({ type: 'error', text: 'Failed to load pricing rules.' })
      setLoading(false)
      return
    }

    // Map the DB "key" column to "rule_key" to match PricingRule type
    const mapped: PricingRule[] = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      rule_type: row.rule_type as string,
      category: row.category as 'home_care' | 'auto_care',
      rule_key: row.key as string,
      value: Number(row.value),
      value_type: row.value_type as 'multiplier' | 'flat_addition' | 'base_price',
      service_id: (row.service_id as string) ?? null,
      description: (row.description as string) ?? '',
      is_active: row.is_active as boolean,
    }))

    setRules(mapped)
    setEdits({})
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  // --------------------------------------------------
  // Edit helpers
  // --------------------------------------------------

  function getEditValue(rule: PricingRule): string {
    return edits[rule.id]?.value ?? rule.value.toString()
  }

  function getEditActive(rule: PricingRule): boolean {
    return edits[rule.id]?.is_active ?? rule.is_active
  }

  function hasEdits(rule: PricingRule): boolean {
    const edit = edits[rule.id]
    if (!edit) return false
    return edit.value !== rule.value.toString() || edit.is_active !== rule.is_active
  }

  function handleValueChange(rule: PricingRule, newValue: string) {
    setEdits((prev) => ({
      ...prev,
      [rule.id]: {
        value: newValue,
        is_active: prev[rule.id]?.is_active ?? rule.is_active,
      },
    }))
  }

  function handleActiveToggle(rule: PricingRule) {
    const currentActive = getEditActive(rule)
    setEdits((prev) => ({
      ...prev,
      [rule.id]: {
        value: prev[rule.id]?.value ?? rule.value.toString(),
        is_active: !currentActive,
      },
    }))
  }

  // --------------------------------------------------
  // Save a single rule
  // --------------------------------------------------

  async function handleSaveRule(rule: PricingRule) {
    const edit = edits[rule.id]
    if (!edit) return

    const numericValue = parseFloat(edit.value)
    if (isNaN(numericValue)) {
      setFeedback({ type: 'error', text: `Invalid value for "${rule.description}". Please enter a valid number.` })
      return
    }

    setSavingIds((prev) => new Set(prev).add(rule.id))
    setFeedback(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('pricing_rules')
      .update({ value: numericValue, is_active: edit.is_active })
      .eq('id', rule.id)

    setSavingIds((prev) => {
      const next = new Set(prev)
      next.delete(rule.id)
      return next
    })

    if (error) {
      console.error('Error saving pricing rule:', error)
      setFeedback({ type: 'error', text: `Failed to save "${rule.description}": ${error.message}` })
      return
    }

    // Update local state to reflect the save
    setRules((prev) =>
      prev.map((r) =>
        r.id === rule.id ? { ...r, value: numericValue, is_active: edit.is_active } : r
      )
    )
    setEdits((prev) => {
      const next = { ...prev }
      delete next[rule.id]
      return next
    })

    setFeedback({ type: 'success', text: `"${rule.description}" saved successfully.` })
    setTimeout(() => setFeedback(null), 3000)
  }

  // --------------------------------------------------
  // Group rules by rule_type
  // --------------------------------------------------

  function groupRulesByType(ruleTypes: readonly string[], category: string) {
    const groups: Record<string, PricingRule[]> = {}
    for (const rt of ruleTypes) {
      groups[rt] = rules.filter((r) => r.rule_type === rt && r.category === category)
    }
    return groups
  }

  // --------------------------------------------------
  // Render a rule group card
  // --------------------------------------------------

  function renderRuleGroup(ruleType: string, groupRules: PricingRule[]) {
    if (groupRules.length === 0) return null

    return (
      <Card key={ruleType}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {RULE_TYPE_LABELS[ruleType] || ruleType}
            <Badge variant="secondary" className="ml-2">
              {groupRules.length} rules
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 pr-4 text-left font-medium text-gray-500">Description</th>
                  <th className="pb-2 pr-4 text-left font-medium text-gray-500">Key</th>
                  <th className="pb-2 pr-4 text-left font-medium text-gray-500">Value</th>
                  <th className="pb-2 pr-4 text-center font-medium text-gray-500">Type</th>
                  <th className="pb-2 pr-4 text-center font-medium text-gray-500">Status</th>
                  <th className="pb-2 text-right font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groupRules.map((rule) => {
                  const isSaving = savingIds.has(rule.id)
                  const edited = hasEdits(rule)
                  const isActive = getEditActive(rule)

                  return (
                    <tr key={rule.id} className={`hover:bg-gray-50 ${edited ? 'bg-yellow-50/50' : ''}`}>
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-gray-900">{rule.description}</p>
                        {rule.service_id && (
                          <p className="text-xs text-gray-400">Service-specific</p>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                          {rule.rule_key}
                        </code>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Input
                          type="number"
                          step="any"
                          className="h-8 w-28 text-sm"
                          value={getEditValue(rule)}
                          onChange={(e) => handleValueChange(rule, e.target.value)}
                          disabled={isSaving}
                        />
                      </td>
                      <td className="py-2.5 pr-4 text-center">
                        <Badge variant={VALUE_TYPE_VARIANTS[rule.value_type] || 'secondary'}>
                          {VALUE_TYPE_LABELS[rule.value_type] || rule.value_type}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-center">
                        <button
                          onClick={() => handleActiveToggle(rule)}
                          disabled={isSaving}
                          className="inline-flex"
                        >
                          <Badge
                            variant={isActive ? 'success' : 'destructive'}
                            className="cursor-pointer"
                          >
                            {isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-2.5 text-right">
                        {edited && (
                          <Button
                            size="sm"
                            onClick={() => handleSaveRule(rule)}
                            disabled={isSaving}
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    )
  }

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  const homeGroups = groupRulesByType(HOME_RULE_TYPES, 'home_care')
  const autoGroups = groupRulesByType(AUTO_RULE_TYPES, 'auto_care')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pricing Controls</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage pricing rules, multipliers, and adjustments for all services.
        </p>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-md p-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="h-4 w-4 shrink-0" />
          ) : (
            <X className="h-4 w-4 shrink-0" />
          )}
          {feedback.text}
        </div>
      )}

      {/* Tabs for Home Care / Auto Care */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="home_care" className="gap-1.5">
            <Home className="h-3.5 w-3.5" />
            Home Care
          </TabsTrigger>
          <TabsTrigger value="auto_care" className="gap-1.5">
            <Car className="h-3.5 w-3.5" />
            Auto Care
          </TabsTrigger>
        </TabsList>

        {/* Home Care Tab */}
        <TabsContent value="home_care">
          <div className="space-y-6 mt-4">
            {HOME_RULE_TYPES.map((rt) => renderRuleGroup(rt, homeGroups[rt]))}
            {HOME_RULE_TYPES.every((rt) => homeGroups[rt].length === 0) && (
              <p className="text-sm text-gray-500">No home care pricing rules found.</p>
            )}
          </div>
        </TabsContent>

        {/* Auto Care Tab */}
        <TabsContent value="auto_care">
          <div className="space-y-6 mt-4">
            {AUTO_RULE_TYPES.map((rt) => renderRuleGroup(rt, autoGroups[rt]))}
            {AUTO_RULE_TYPES.every((rt) => autoGroups[rt].length === 0) && (
              <p className="text-sm text-gray-500">No auto care pricing rules found.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

    </div>
  )
}
