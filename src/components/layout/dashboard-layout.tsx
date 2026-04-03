"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  User,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BRAND } from "@/lib/constants"
import { SidebarNav, type NavItem } from "./sidebar-nav"

interface DashboardLayoutProps {
  children: React.ReactNode
  navigation: NavItem[]
  title: string
  userDisplayName?: string
  userRole?: string
}

export function DashboardLayout({
  children,
  navigation,
  title,
  userDisplayName = "User",
  userRole = "member",
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden flex-col border-r border-gray-200 bg-white transition-all duration-200 md:flex",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Sidebar Header */}
        <div className="border-b border-gray-200 px-4 py-4">
          {!sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-3">
              <Link href="/">
                <Image src="/logo-horizontal.png" alt={BRAND.name} width={1536} height={1024} className="h-14 w-auto" />
              </Link>
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <ExternalLink className="h-3 w-3" />
                Back to Website
              </Link>
            </div>
          ) : (
            <Link href="/" className="flex justify-center">
              <Image src="/logo-horizontal.png" alt={BRAND.name} width={1536} height={1024} className="h-8 w-auto" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "mt-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900",
              sidebarCollapsed ? "mx-auto flex" : "ml-auto flex"
            )}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav items={navigation} collapsed={sidebarCollapsed} />
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-gray-200 p-4">
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900",
              sidebarCollapsed && "justify-center"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 md:hidden"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "hidden rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline-flex",
                userRole === "admin"
                  ? "bg-purple-100 text-purple-800"
                  : userRole === "dispatch"
                    ? "bg-blue-100 text-blue-800"
                    : userRole === "crew"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
              )}
            >
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600">
              <User className="h-4 w-4" />
            </div>
            <span className="hidden text-sm font-medium text-gray-700 sm:inline">
              {userDisplayName}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Nav Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity md:hidden",
          mobileNavOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Nav Panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Image src="/logo-horizontal.png" alt={BRAND.name} width={1536} height={1024} className="h-12 w-auto" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Link
            href="/"
            className="mt-2 flex items-center gap-1.5 rounded-md px-1 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <ExternalLink className="h-3 w-3" />
            Back to Website
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav items={navigation} onItemClick={() => setMobileNavOpen(false)} />
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {userDisplayName}
              </p>
              <p className="text-xs text-gray-500">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white md:hidden">
        <div className="flex items-center justify-around py-2">
          {navigation.slice(0, 5).map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-1 text-xs transition-colors",
                  isActive
                    ? "text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center",
                    isActive && "text-gray-900"
                  )}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
