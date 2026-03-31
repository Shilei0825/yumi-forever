"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, getStatusLabel } from '@/lib/utils'
import { Plus, Pencil, Wrench, Package } from 'lucide-react'
import type { Service, ServiceCategoryRecord, ServiceAddon } from '@/types'

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategoryRecord[]>([])
  const [addons, setAddons] = useState<ServiceAddon[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edit service dialog
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editDuration, setEditDuration] = useState('')
  const [editActive, setEditActive] = useState(true)

  // Add service dialog
  const [showAddService, setShowAddService] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newDuration, setNewDuration] = useState('')
  const [newRequiresQuote, setNewRequiresQuote] = useState(false)
  const [newRequiresDeposit, setNewRequiresDeposit] = useState(false)
  const [newDepositAmount, setNewDepositAmount] = useState('')

  const [formError, setFormError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const [servicesRes, categoriesRes, addonsRes] = await Promise.all([
      supabase.from('services').select('*').order('sort_order'),
      supabase.from('service_categories').select('*').order('sort_order'),
      supabase.from('service_addons').select('*').order('name'),
    ])

    setServices(servicesRes.data || [])
    setCategories(categoriesRes.data || [])
    setAddons(addonsRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Group services by category
  const groupedServices: Record<string, { category: ServiceCategoryRecord; services: Service[] }> = {}
  for (const cat of categories) {
    groupedServices[cat.id] = {
      category: cat,
      services: services.filter((s) => s.category_id === cat.id),
    }
  }

  function openEditDialog(service: Service) {
    setEditingService(service)
    setEditPrice((service.base_price / 100).toString())
    setEditDuration(service.duration_minutes.toString())
    setEditActive(service.is_active)
  }

  async function handleSaveService() {
    if (!editingService) return
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('services')
      .update({
        base_price: Math.round(parseFloat(editPrice) * 100),
        duration_minutes: parseInt(editDuration) || 0,
        is_active: editActive,
      })
      .eq('id', editingService.id)

    if (error) {
      console.error('Error updating service:', error)
    }

    setEditingService(null)
    setSaving(false)
    await fetchData()
  }

  async function handleAddService() {
    if (!newName || !newCategory) {
      setFormError('Name and category are required.')
      return
    }

    setSaving(true)
    setFormError('')
    const supabase = createClient()

    const slug = newSlug || newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const { error } = await supabase.from('services').insert({
      category_id: newCategory,
      name: newName,
      slug,
      description: newDescription,
      base_price: Math.round(parseFloat(newPrice || '0') * 100),
      duration_minutes: parseInt(newDuration || '0'),
      requires_quote: newRequiresQuote,
      requires_deposit: newRequiresDeposit,
      deposit_amount: newRequiresDeposit ? Math.round(parseFloat(newDepositAmount || '0') * 100) : null,
      is_active: true,
      sort_order: services.length,
    })

    if (error) {
      setFormError(error.message || 'Failed to add service.')
      setSaving(false)
      return
    }

    setShowAddService(false)
    setNewName('')
    setNewSlug('')
    setNewDescription('')
    setNewCategory('')
    setNewPrice('')
    setNewDuration('')
    setNewRequiresQuote(false)
    setNewRequiresDeposit(false)
    setNewDepositAmount('')
    setSaving(false)
    await fetchData()
  }

  async function toggleAddonActive(addon: ServiceAddon) {
    const supabase = createClient()
    await supabase
      .from('service_addons')
      .update({ is_active: !addon.is_active })
      .eq('id', addon.id)
    await fetchData()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Catalog</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage services, pricing, and add-ons.
          </p>
        </div>
        <Button onClick={() => setShowAddService(true)}>
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Services grouped by category */}
      {Object.values(groupedServices).map(({ category, services: categoryServices }) => (
        <Card key={category.id}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              {category.name}
              <Badge variant="secondary" className="ml-2">
                {categoryServices.length} services
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryServices.length === 0 ? (
              <p className="text-sm text-gray-500">No services in this category.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-2 pr-4 text-left font-medium text-gray-500">Name</th>
                      <th className="pb-2 pr-4 text-right font-medium text-gray-500">Price</th>
                      <th className="pb-2 pr-4 text-center font-medium text-gray-500">Duration</th>
                      <th className="pb-2 pr-4 text-center font-medium text-gray-500">Quote Required</th>
                      <th className="pb-2 pr-4 text-center font-medium text-gray-500">Deposit Required</th>
                      <th className="pb-2 pr-4 text-center font-medium text-gray-500">Status</th>
                      <th className="pb-2 text-right font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categoryServices.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        <td className="py-2.5 pr-4">
                          <p className="font-medium text-gray-900">{service.name}</p>
                          <p className="text-xs text-gray-500 max-w-xs truncate">{service.description}</p>
                        </td>
                        <td className="py-2.5 pr-4 text-right text-gray-900">
                          {service.base_price > 0 ? formatCurrency(service.base_price) : 'Quote'}
                        </td>
                        <td className="py-2.5 pr-4 text-center text-gray-700">
                          {service.duration_minutes > 0 ? `${service.duration_minutes} min` : 'TBD'}
                        </td>
                        <td className="py-2.5 pr-4 text-center">
                          {service.requires_quote ? (
                            <Badge variant="warning" className="text-xs">Yes</Badge>
                          ) : (
                            <span className="text-xs text-gray-400">No</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-center">
                          {service.requires_deposit ? (
                            <Badge variant="secondary" className="text-xs">
                              {formatCurrency(service.deposit_amount || 0)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">No</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-center">
                          <Badge variant={service.is_active ? 'success' : 'secondary'}>
                            {service.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(service)}
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add-ons Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Service Add-ons
            <Badge variant="secondary" className="ml-2">
              {addons.length} add-ons
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {addons.length === 0 ? (
            <p className="text-sm text-gray-500">No add-ons configured.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 pr-4 text-left font-medium text-gray-500">Name</th>
                    <th className="pb-2 pr-4 text-left font-medium text-gray-500">Description</th>
                    <th className="pb-2 pr-4 text-right font-medium text-gray-500">Price</th>
                    <th className="pb-2 text-center font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {addons.map((addon) => (
                    <tr key={addon.id} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-4 font-medium text-gray-900">{addon.name}</td>
                      <td className="py-2.5 pr-4 text-gray-600 max-w-xs truncate">
                        {addon.description}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-gray-900">
                        {formatCurrency(addon.price)}
                      </td>
                      <td className="py-2.5 text-center">
                        <button onClick={() => toggleAddonActive(addon)}>
                          <Badge
                            variant={addon.is_active ? 'success' : 'secondary'}
                            className="cursor-pointer"
                          >
                            {addon.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Service Dialog */}
      <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service: {editingService?.name}</DialogTitle>
          </DialogHeader>
          <DialogClose onClick={() => setEditingService(null)} />
          <div className="space-y-4">
            <Input
              label="Price ($)"
              type="number"
              step="0.01"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
            />
            <Input
              label="Duration (minutes)"
              type="number"
              value={editDuration}
              onChange={(e) => setEditDuration(e.target.value)}
            />
            <Select
              label="Status"
              value={editActive ? 'active' : 'inactive'}
              onChange={(e) => setEditActive(e.target.value === 'active')}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingService(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveService} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={showAddService} onOpenChange={setShowAddService}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
          </DialogHeader>
          <DialogClose onClick={() => setShowAddService(false)} />
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md p-2">{formError}</p>
            )}
            <Input
              label="Service Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Premium Interior Detail"
            />
            <Select
              label="Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Select category..."
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Textarea
              label="Description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe the service..."
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price ($)"
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
              />
              <Input
                label="Duration (minutes)"
                type="number"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                placeholder="60"
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newRequiresQuote}
                  onChange={(e) => setNewRequiresQuote(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Requires Quote
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newRequiresDeposit}
                  onChange={(e) => setNewRequiresDeposit(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Requires Deposit
              </label>
            </div>
            {newRequiresDeposit && (
              <Input
                label="Deposit Amount ($)"
                type="number"
                step="0.01"
                value={newDepositAmount}
                onChange={(e) => setNewDepositAmount(e.target.value)}
                placeholder="50.00"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddService(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddService} disabled={saving}>
              {saving ? 'Adding...' : 'Add Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
