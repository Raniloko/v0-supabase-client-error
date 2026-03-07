import { RefreshCw } from "lucide-react"

export default function WiederkehrendPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: "#f5f0e8" }}>Wiederkehrende Reservierungen</h2>
        <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>Wöchentliche und zweiwöchentliche Stammgäste</p>
      </div>
      <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-24 gap-4">
        <RefreshCw className="w-12 h-12" style={{ color: "#3a3a3a" }} />
        <p className="text-sm" style={{ color: "#6b6b6b" }}>Wiederkehrende Reservierungen – in Kürze verfügbar</p>
      </div>
    </div>
  )
}
