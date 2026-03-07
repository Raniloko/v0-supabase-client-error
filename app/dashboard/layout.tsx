import Sidebar from "@/components/sidebar"
import Topbar from "@/components/topbar"
import CustomCursor from "@/components/custom-cursor"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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
