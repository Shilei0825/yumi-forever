import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { MobileCTA } from "@/components/layout/mobile-cta"
import { ChatWidget } from "@/components/chat/chat-widget"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileCTA />
      <ChatWidget />
    </>
  )
}
