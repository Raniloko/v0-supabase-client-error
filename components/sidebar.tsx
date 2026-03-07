"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Map, CalendarDays, BarChart2, Clock,
  List, RefreshCw, Mail, Activity, FileText, Settings,
  Dices, Sofa, Tv2, Trophy, Crown, LogOut, ChevronRight,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const NAV = [
  {
    label: "ÜBERSICHT",
    items: [
      { href: "/dashboard",              icon: LayoutDashboard, label: "Dashboard" },
      { href: "/dashboard/raumplan",     icon: Map,             label: "Raumplan" },
      { href: "/dashboard/reservierungen", icon: CalendarDays,  label: "Reservierungen", badge: true },
      { href: "/dashboard/kalender",     icon: Clock,           label: "Kalender" },
      { href: "/dashboard/auslastung",   icon: BarChart2,       label: "Auslastung" },
    ],
  },
  {
    label: "BEREICHE",
    items: [
      { href: "/dashboard/raumplan?area=billard", icon: Dices,  label: "Billard Tisch" },
      { href: "/dashboard/raumplan?area=salitos", icon: Sofa,   label: "Salitos Lounge" },
      { href: "/dashboard/raumplan?area=rest140", icon: Tv2,    label: "Restaurant 140\"" },
      { href: "/dashboard/raumplan?area=rest75",  icon: Trophy, label: "Restaurant 75\"" },
      { href: "/dashboard/raumplan?area=vip",     icon: Crown,  label: "VIP Raum" },
    ],
  },
  {
    label: "VERWALTUNG",
    items: [
      { href: "/dashboard/warteliste",      icon: List,       label: "Warteliste" },
      { href: "/dashboard/wiederkehrend",   icon: RefreshCw,  label: "Wiederkehrend" },
      { href: "/dashboard/email-center",    icon: Mail,       label: "E-Mail Center" },
      { href: "/dashboard/aktivitaet",      icon: Activity,   label: "Aktivitäts-Log" },
      { href: "/dashboard/tagesabschluss",  icon: FileText,   label: "Tagesabschluss" },
      { href: "/dashboard/einstellungen",   icon: Settings,   label: "Einstellungen" },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isActive = (href: string) => {
    if (href.includes("?")) {
      return pathname + (typeof window !== "undefined" ? window.location.search : "") === href
    }
    return pathname === href
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[220px] flex flex-col z-40 select-none"
      style={{
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(201,168,76,0.1)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg font-display text-xl"
          style={{ background: "#c9a84c", color: "#0a0a0a" }}
        >
          R
        </div>
        <div>
          <div className="font-display text-base tracking-widest" style={{ color: "#f5f0e8" }}>RONDO</div>
          <div className="text-xs" style={{ color: "#6b6b6b" }}>Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV.map((section) => (
          <div key={section.label} className="mb-5">
            <div className="text-xs font-semibold tracking-widest mb-2 px-2" style={{ color: "#3a3a3a" }}>
              {section.label}
            </div>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-200 group relative",
                        active
                          ? "text-[#c9a84c]"
                          : "text-[#6b6b6b] hover:text-[#f5f0e8]"
                      )}
                      style={
                        active
                          ? {
                              background: "rgba(201,168,76,0.08)",
                              borderLeft: "2px solid #c9a84c",
                              paddingLeft: "9px",
                            }
                          : {}
                      }
                    >
                      <item.icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-[#c9a84c]" : "text-[#4a4a4a] group-hover:text-[#c9a84c]")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="text-xs rounded-full px-1.5 py-0.5 font-mono" style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c" }}>
                          7
                        </span>
                      )}
                      {active && <ChevronRight className="w-3 h-3 text-[#c9a84c]" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Admin footer */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(201,168,76,0.08)" }}>
        <div className="flex items-center gap-2.5 mb-3 px-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.2)" }}
          >
            AD
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium truncate" style={{ color: "#f5f0e8" }}>Admin</div>
            <div className="text-xs truncate" style={{ color: "#6b6b6b" }}>Administrator</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-sm transition-all duration-200 hover:text-[#f5f0e8]"
          style={{ color: "#6b6b6b" }}
        >
          <LogOut className="w-4 h-4" />
          <span>Abmelden</span>
        </button>
      </div>
    </aside>
  )
}
