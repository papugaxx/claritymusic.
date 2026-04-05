<!-- Коментар пояснює призначення наступного XML блока -->

# Backend notes for defense

<!-- Коментар пояснює призначення наступного XML блока -->
## Scope decisions
- The current domain keeps **one primary artist per track** through `Track.ArtistId`.
- Multi-artist collaborations and featured contributors were **not added intentionally** in this pass. That would change the domain model, API contracts and frontend scope instead of improving the existing codebase.
- Artist management endpoints stay in the backend because they are part of the current role/ownership model, even if the frontend only exposes part of that surface today.

<!-- Коментар пояснює призначення наступного XML блока -->
## Roles and ownership
- **Admin** can manage artists, tracks, genres and moods.
- **Artist** manages only the artist profile linked to the current account and only tracks that belong to that artist.
- **Authenticated user** can manage personal playlists, likes, follows and the profile page.

<!-- Коментар пояснює призначення наступного XML блока -->
## Important backend flows
- Playlist mutations are centralized in `PlaylistMutationService`.
- Artist and track write flows are centralized in `ArtistMutationService` and `TrackMutationService`.
- Track play counting is handled by `TrackPlayService`, including the 30-second dedupe window.
- Profile update flow is handled by `UserProfileService`, including avatar cleanup when a file is replaced.

<!-- Коментар пояснює призначення наступного XML блока -->
## Upload lifecycle
- Uploaded files are saved under managed public folders.
- Temporary uploads are registered so abandoned files can be deleted safely.
- Physical deletion happens only after the database state confirms that no entity still references the file.
