import Sidebar from "@/components/sidebar"
import Topbar from "@/components/topbar"
import CustomCursor from "@/components/custom-cursor"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  return (
    <>
      <CustomCursor />
      <Sidebar />
      <Topbar />
      <main
        className="min-h-screen"
        style={{ marginLeft: "220px", paddingTop: "56px" }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </>
  )
}
