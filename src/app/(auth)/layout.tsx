import Link from 'next/link'
import Image from 'next/image'
import { BRAND } from '@/lib/constants'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 px-4 py-12">
      <div className="mb-8">
        <Link href="/">
          <Image
            src="/logo-vertical.png"
            alt={BRAND.name}
            width={1024}
            height={1536}
            className="h-28 w-auto"
            priority
          />
        </Link>
      </div>

      <div className="w-full max-w-md">{children}</div>

      <p className="mt-8 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
      </p>
    </div>
  )
}
