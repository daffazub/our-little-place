# Next.js App Directory Structure
#
# D:\Projek\our-little-place-v2\
# ├── app/
# │   ├── layout.tsx                        Root layout (providers, fonts, metadata)
# │   ├── page.tsx                          Landing / redirect
# │   ├── (auth)/
# │   │   ├── create/page.tsx               Create new room
# │   │   └── join/[roomId]/[token]/page.tsx Join via invite link
# │   ├── room/
# │   │   └── [roomId]/
# │   │       ├── layout.tsx                Room shell (nav, audio dock)
# │   │       ├── page.tsx                  Home / Dashboard
# │   │       ├── memories/page.tsx         Memory gallery
# │   │       ├── plans/page.tsx            Future plans
# │   │       ├── stories/page.tsx          Long-form stories
# │   │       ├── calendar/page.tsx         Interactive calendar
# │   │       ├── quotes/page.tsx           Quotes & inside jokes
# │   │       ├── little-things/page.tsx    Little things
# │   │       └── settings/page.tsx         Room settings, members, invite
# │   └── api/
# │       └── keep-alive/route.ts           Supabase ping cron
# ├── components/
# │   ├── ui/                               Base UI primitives
# │   │   ├── Button.tsx
# │   │   ├── Input.tsx
# │   │   ├── Modal.tsx
# │   │   ├── Skeleton.tsx
# │   │   └── Avatar.tsx
# │   ├── navigation/
# │   │   ├── Navbar.tsx
# │   │   ├── BottomNav.tsx
# │   │   └── Sidebar.tsx
# │   ├── memory/
# │   │   ├── MemoryCard.tsx
# │   │   ├── MemoryGrid.tsx
# │   │   ├── AddMemoryModal.tsx
# │   │   ├── MemoryLightbox.tsx
# │   │   ├── ReactionBar.tsx
# │   │   └── CommentThread.tsx
# │   ├── home/
# │   │   ├── HeroMarquee.tsx
# │   │   ├── OnThisDayCard.tsx
# │   │   └── StatsBanner.tsx
# │   └── audio/
# │       └── AudioDock.tsx
# ├── context/
# │   ├── SessionContext.tsx
# │   └── AudioContext.tsx
# ├── lib/
# │   ├── supabase/
# │   │   ├── client.ts
# │   │   └── server.ts
# │   ├── auth.ts
# │   └── storage.ts
# ├── types/
# │   └── database.ts
# ├── hooks/
# │   ├── useMemories.ts
# │   ├── usePlans.ts
# │   ├── useRealtime.ts
# │   └── useSession.ts
# ├── supabase/
# │   └── migrations/
# │       ├── 001_initial_schema.sql
# │       ├── 002_rls_policies.sql
# │       └── 003_storage_buckets.sql
# └── public/
#     └── manifest.json

