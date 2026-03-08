import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { guest, pax, date, startTime, endTime, note, tableLabel, area } = body

    const supabase = await createClient()

    // Insert reservation — table_id and area_id are optional UUIDs;
    // we store what we have and rely on guest_name / dates as the key data.
    const { data, error } = await supabase
      .from("reservations")
      .insert({
        guest_name:       guest,
        party_size:       Number(pax),
        reservation_date: date,
        start_time:       startTime,
        end_time:         endTime,
        internal_note:    note ?? "",
        status:           "confirmed",
      })
      .select()
      .single()

    if (error) throw error

    // Log the activity
    await supabase.from("activity_log").insert({
      action:      "reservation_created",
      admin_name:  "Admin",
      details:     `Neue Reservierung: ${guest} · ${pax} Pers. · ${tableLabel ?? ""} · ${date} ${startTime}-${endTime}`,
      reservation_id: data.id,
    })

    return NextResponse.json({ ok: true, id: data.id })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("start_time", { ascending: true })

    if (error) throw error
    return NextResponse.json({ ok: true, data })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
