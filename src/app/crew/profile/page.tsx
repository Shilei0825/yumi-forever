'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Phone,
  Mail,
  DollarSign,
  LogOut,
  Camera,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  cn,
  formatCurrency,
  getStatusLabel,
} from '@/lib/utils'
import type { Profile, CrewPayProfile } from '@/types'

export default function CrewProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [payProfile, setPayProfile] = useState<CrewPayProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // Editable fields
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const fetchProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/crew-login')
        return
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        return
      }

      setProfile(profileData)
      setPhone(profileData.phone || '')
      setAvatarUrl(profileData.avatar_url || '')

      // Fetch pay profile
      const { data: payData } = await supabase
        .from('crew_pay_profiles')
        .select('*')
        .eq('profile_id', user.id)
        .eq('is_active', true)
        .single()

      if (payData) setPayProfile(payData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    setSaved(false)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: phone || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) {
        console.error('Error updating profile:', error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/crew-login')
    } catch (error) {
      console.error('Sign out error:', error)
      setSigningOut(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500">Unable to load profile</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-20">
      <h2 className="text-xl font-bold text-gray-900">My Profile</h2>

      {/* Avatar and Name */}
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                <User className="h-8 w-8 text-gray-500" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-gray-900">
              {profile.full_name}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
              <Mail className="h-3.5 w-3.5" />
              <span className="truncate">{profile.email}</span>
            </div>
            {profile.phone && (
              <div className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                <Phone className="h-3.5 w-3.5" />
                {profile.phone}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Edit Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              setSaved(false)
            }}
            className="h-12 text-base"
          />

          <Input
            label="Avatar URL"
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={avatarUrl}
            onChange={(e) => {
              setAvatarUrl(e.target.value)
              setSaved(false)
            }}
            className="h-12 text-base"
          />

          <div className="flex items-center gap-3">
            <Button
              className="h-12 flex-1 text-base"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              Save Changes
            </Button>
            {saved && (
              <span className="text-sm font-medium text-green-600">
                Saved!
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pay Info */}
      {payProfile && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" />
              Pay Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Pay Type</span>
                <span className="font-medium text-gray-900">
                  {payProfile.pay_type === 'hourly'
                    ? 'Hourly'
                    : 'Per Job'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Rate</span>
                <span className="text-lg font-semibold text-gray-900">
                  {payProfile.pay_type === 'hourly'
                    ? `${formatCurrency(payProfile.hourly_rate || 0)}/hr`
                    : `${formatCurrency(payProfile.per_job_rate || 0)}/job`}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className="font-medium text-green-700">
                  {payProfile.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Contact management to update pay information.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sign Out */}
      <Button
        variant="outline"
        className="h-14 w-full border-red-200 text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        {signingOut ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <LogOut className="mr-2 h-5 w-5" />
        )}
        Sign Out
      </Button>
    </div>
  )
}
