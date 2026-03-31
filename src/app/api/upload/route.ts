import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bookingId = formData.get('booking_id') as string | null
    const photoType = (formData.get('photo_type') as string) || 'other'
    const caption = formData.get('caption') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing booking_id' },
        { status: 400 }
      )
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${bookingId}/${photoType}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('booking-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('booking-photos').getPublicUrl(uploadData.path)

    // Save photo record
    const { data: photo, error: photoError } = await supabase
      .from('uploaded_photos')
      .insert({
        booking_id: bookingId,
        uploaded_by: user.id,
        photo_type: photoType,
        url: publicUrl,
        caption: caption || null,
      })
      .select()
      .single()

    if (photoError) {
      console.error('Photo record error:', photoError)
      return NextResponse.json(
        { error: 'Failed to save photo record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ photo, url: publicUrl }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
