import { Suspense } from "react"
import FloorPlanClient from "@/components/floor-plan/floor-plan-client"

export default function RaumplanPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(201,168,76,0.2)", borderTopColor: "#c9a84c" }} />
      </div>
    }>
      <FloorPlanClient />
    </Suspense>
  )
}
