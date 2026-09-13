# Next.js App Directory Structure (Firebase Architecture)
#
# D:\Projek\our-little-place-v2\
# ├── app/
# │   ├── layout.tsx                        Root layout (providers, fonts, metadata)
# │   ├── page.tsx                          Landing / redirect
# │   ├── (auth)/
# │   │   ├── create/page.tsx               Create new room
# │   │   └── join/[roomId]/[token]/page.tsx Join via invite link
# │   └── room/
# │       └── [roomId]/
# │           ├── layout.tsx                Room shell (nav, audio dock)
# │           ├── page.tsx                  Home / Dashboard
# │           ├── memories/page.tsx         Memory gallery & photo upload
# │           ├── plans/page.tsx            Future plans & toggles
# │           ├── stories/page.tsx          Long-form stories & journals
# │           ├── calendar/page.tsx         Important dates & celebrations
# │           ├── quotes/page.tsx           Quotes & inside jokes
# │           ├── little-things/page.tsx    Daily little things
# │           └── settings/page.tsx         Room settings, members, invite tokens
# ├── components/
# │   ├── navigation/
# │   │   ├── Navbar.tsx
# │   │   └── BottomNav.tsx
# │   └── audio/
# │       └── AudioDock.tsx
# ├── context/
# │   ├── SessionContext.tsx
# │   └── AudioContext.tsx
# ├── lib/
# │   ├── firebase/
# │   │   └── client.ts                     Firebase SDK initialization (Firestore, Storage, Auth)
# │   ├── auth.ts                           Device auth, room creation, invite management
# │   └── storage.ts                        Firebase Storage upload, compression, media URL
# ├── types/
# │   └── database.ts                       TypeScript types & document interfaces
# ├── firestore.rules                       Firestore security rules
# ├── storage.rules                         Firebase Storage security rules
# ├── .env.local.example                    Firebase credentials template
# └── public/
#     └── manifest.json
