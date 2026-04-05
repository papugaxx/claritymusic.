<!-- Коментар пояснює призначення наступного XML блока -->

# Smoke test checklist

<!-- Коментар пояснює призначення наступного XML блока -->
## Auth
1. Register a new account.
2. Confirm the email flow.
3. Log in and call `/api/auth/me`.
4. Change password, log out, and log back in with the new password.

<!-- Коментар пояснює призначення наступного XML блока -->
## User profile
1. Upload avatar through `/api/uploads/avatar`.
2. Update `/api/me/profile` with display name and avatar URL.
3. Replace avatar and verify the old file is no longer referenced.

<!-- Коментар пояснює призначення наступного XML блока -->
## Playlists
1. Create playlist.
2. Rename playlist.
3. Add and remove a track.
4. Upload and remove a playlist cover.
5. Delete playlist.

<!-- Коментар пояснює призначення наступного XML блока -->
## Likes and follows
1. Like a track, check `/api/likes` and `/api/likes/ids`.
2. Unlike the same track.
3. Follow an artist, then verify `/api/me/following`.
4. Unfollow the same artist.

<!-- Коментар пояснює призначення наступного XML блока -->
## Artist studio
1. Log in as an artist account.
2. Create or update the owned artist profile through `/api/artist/me`.
3. Create a track.
4. Update the track.
5. Toggle track status.
6. Delete the track.

<!-- Коментар пояснює призначення наступного XML блока -->
## Admin
1. Create artist from `/api/admin/artists`.
2. Update artist owner, slug and images.
3. Create track from `/api/admin/tracks`.
4. Update track and status.
5. Delete track, then delete the artist when no tracks remain.

<!-- Коментар пояснює призначення наступного XML блока -->
## Play tracking
1. Call `POST /api/tracks/{id}/play`.
2. Call the same endpoint again within 30 seconds and verify `Deduped = true`.
3. Call again after the window and verify `PlaysCount` increases.
