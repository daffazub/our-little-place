# Architecture

## Runtime structure

```text
app/
├── layout.tsx                 Root layout, fonts, metadata, providers
├── page.tsx                   Landing page
├── (auth)/
│   ├── create/page.tsx        Create room
│   └── join/[roomId]/[token]/page.tsx
└── room/[roomId]/
    ├── layout.tsx             Room shell, navigation, audio dock
    ├── page.tsx               Dashboard
    ├── memories/page.tsx
    ├── stories/page.tsx
    ├── plans/page.tsx
    ├── calendar/page.tsx
    └── settings/page.tsx

components/
├── _dev/                      Design-system showcase components, excluded from runtime routes
├── audio/                     AudioDock
├── features/memories/         CategoryFilterBar shared by memory/plans filters
├── navigation/                Navbar and BottomNav
└── ui/                        Button, Input, Textarea, Card, Badge, DatePicker, and shared UI

context/                       Session, audio, and toast providers
lib/firebase/client.ts         Firebase app, Auth, Firestore, Storage
lib/services/rooms.ts          Room, member, session, and invite operations
lib/utils/image.ts             Image compression and Storage operations
lib/utils/date.ts              Date formatting and calendar helpers
types/index.ts                 Domain and Firestore document types
firestore.rules                Firestore security rules
storage.rules                  Storage security rules
public/manifest.json           PWA manifest
```

The current repository also contains `docs/`, `tests/`, and `.agents/`. The detailed component and service reorganization is planned for the code-structure phase; this document describes the current implementation without pretending that migration is complete.

## Provider and data flow

```text
RootLayout
└── SessionProvider
    └── AudioProvider
        └── ToastProvider
            └── App routes
                └── Firebase client
                    ├── Anonymous Auth
                    ├── Cloud Firestore
                    └── Firebase Storage
```

1. A browser route uses `SessionContext` to load or update the local room session.
2. `lib/firebase/client.ts` initializes Firebase once and exposes Auth, Firestore, and Storage clients.
3. Protected operations call Firebase Anonymous Authentication first.
4. Room and member operations live in `lib/auth.ts`; media upload and deletion live in `lib/storage.ts`.
5. Route pages read and write Firestore subcollections and use context hooks for session, audio, and toast feedback.
6. Photos are compressed in the browser before being written to Storage; their metadata and URLs are stored on memory documents.

## Firestore document model

```text
rooms/{roomId}
├── name: string
├── owner_id: string
├── created_at: string
├── members/{memberId}
├── usernames/{normalizedName}
├── memories/{memoryId}
├── stories/{storyId}
├── plans/{planId}
├── important_dates/{dateId}
└── invite_tokens/{tokenId}
```

### Room and member documents

- `rooms/{roomId}`: room name, owner identifier, and creation timestamp.
- `members/{memberId}`: display name, avatar, role (`owner` or `contributor`), device token, and join timestamp.
- `usernames/{normalizedName}`: atomic uniqueness lock for member names.
- `invite_tokens/{tokenId}`: random token, creator, revoked flag, and creation timestamp.

### Feature documents

- `memories`: title, caption, date, location, category, photo list, likes, creator, and creation timestamp. Rules enforce a maximum of ten photos.
- `stories`: title, content, creator, date, and creation timestamp.
- `plans`: title, description, date, time, location, status (`upcoming` or `completed`), creator, and timestamp.
- `important_dates`: title, date, recurring flag, creator, and timestamp.

## Security rules

### Firestore

`firestore.rules` currently requires an authenticated Firebase user for room and subcollection access. It also validates:

- room and member name lengths;
- allowed member roles;
- one-time creation of normalized username locks;
- maximum ten photos per memory;
- title/content lengths for memories and stories;
- allowed plan statuses;
- required date strings;
- invite token length and revoke-only updates;
- client-side room deletion is disabled.

The rules currently grant broad authenticated reads/writes within a room. Any future tightening must be tested against create, join, member management, and feature flows before deployment.

### Storage

`storage.rules` requires authentication for room photos and music. It limits:

- memory images to less than 5 MB and `image/webp`, `image/jpeg`, or `image/png`;
- music files to less than 15 MB and an `audio/*` content type.

Storage paths are organized under `rooms/{roomId}/memories/...` and `rooms/{roomId}/music/...`.

## Design and dependency boundaries

- Route files own page composition and feature-specific Firestore queries.
- Contexts own cross-route client state.
- `lib/firebase/client.ts` owns SDK initialization only.
- Domain operations and utilities should be moved into dedicated service/util folders during the code-structure phase without changing their public behavior.
- Types should remain independent from React rendering and Firebase initialization.
