import { FileText } from "lucide-react"

export default function TagesabschlussPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold" style={{ color: "#f5f0e8" }}>Tagesabschluss</h2>
        <p className="text-sm mt-1" style={{ color: "#6b6b6b" }}>Tagesbericht und Abschluss-Zusammenfassung</p>
      </div>
      <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-24 gap-4">
        <FileText className="w-12 h-12" style={{ color: "#3a3a3a" }} />
        <p className="text-sm" style={{ color: "#6b6b6b" }}>Tagesabschluss – in Kürze verfügbar</p>
      </div>
    </div>
  )
}
