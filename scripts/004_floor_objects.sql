-- Floor plan objects table for the visual editor
CREATE TABLE IF NOT EXISTS public.floor_objects (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('table','billiard','plant','wall','logo')),
  x           FLOAT NOT NULL DEFAULT 0,
  y           FLOAT NOT NULL DEFAULT 0,
  rotation    FLOAT NOT NULL DEFAULT 0,
  seats       INTEGER DEFAULT 4,
  status      TEXT  DEFAULT 'free' CHECK (status IN ('free','reserved','occupied','blocked')),
  label       TEXT,
  area_id     TEXT  DEFAULT 'restaurant140',
  data_json   JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.floor_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_full_access_floor_objects"
  ON public.floor_objects FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- Seed default layout for Restaurant 140 Zoll
INSERT INTO public.floor_objects (id, type, x, y, rotation, seats, status, label, area_id) VALUES
  ('t10',  'table',   59,  47,  0, 4, 'free',     '10',  'restaurant140'),
  ('t30',  'table',  184,  47,  0, 4, 'free',     '30',  'restaurant140'),
  ('t52',  'table',  339, 157,  0, 4, 'free',     '52',  'restaurant140'),
  ('t53',  'table',  429, 157,  0, 4, 'free',     '53',  'restaurant140'),
  ('t54',  'table',  521, 157,  0, 8, 'free',     '54',  'restaurant140'),
  ('t51',  'table',  339, 255,  0, 4, 'free',     '51',  'restaurant140'),
  ('t50',  'table',  430, 258,  0, 4, 'free',     '50',  'restaurant140'),
  ('t58',  'table',  589, 255,  0, 4, 'free',     '58',  'restaurant140'),
  ('t59',  'table',  729, 255,  0, 2, 'free',     '59',  'restaurant140'),
  ('t61',  'table',  652, 330,  0, 4, 'occupied', '61',  'restaurant140'),
  ('t60',  'table',  742, 330,  0, 4, 'free',     '60',  'restaurant140'),
  ('t67',  'table',  652, 418,  0, 4, 'free',     '67',  'restaurant140'),
  ('t66',  'table',  742, 418,  0, 4, 'free',     '66',  'restaurant140'),
  ('t62',  'table',  652, 480,  0, 4, 'occupied', '62',  'restaurant140'),
  ('t63',  'table',  742, 480,  0, 4, 'occupied', '63',  'restaurant140'),
  ('t64',  'table',  310, 470,  0, 4, 'occupied', '64',  'restaurant140'),
  ('t65',  'table',  400, 470,  0, 4, 'occupied', '65',  'restaurant140'),
  ('b1',   'billiard', 580, 12, 0, 0, 'free',     'Billard 1', 'restaurant140'),
  ('b2',   'billiard', 706, 12, 0, 0, 'reserved', 'Billard 2', 'restaurant140'),
  ('b3',   'billiard', 500, 330, -38, 0, 'free',  'Billard 3', 'restaurant140')
ON CONFLICT (id) DO NOTHING;
