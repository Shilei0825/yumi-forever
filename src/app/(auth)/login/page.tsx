import Link from 'next/link'
import { User, Shield } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
        <p className="mt-2 text-sm text-gray-500">
          Choose how you&apos;d like to sign in
        </p>
      </div>

      <div className="grid gap-4">
        <Link href="/login/user" className="block">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <User className="h-6 w-6 text-gray-900" />
              </div>
              <div>
                <CardTitle className="text-lg">Customer Login</CardTitle>
                <CardDescription>
                  For customers only
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-500">
                Book services, manage your account, and track your bookings.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/login/crew" className="block">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-900">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Crew Login</CardTitle>
                <CardDescription>
                  For Yumi Forever crew members only
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-500">
                Access your daily jobs, track hours, and manage your work.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-primary hover:underline"
        >
          Sign up as a customer
        </Link>
      </p>
    </div>
  )
}
