# Harbor Sweep

A two-minute browser game: pilot a trash-collecting rover around a San Pedro harbor. Steer it yourself, then plan a route and let it drive itself.

Play: https://jaime888888.github.io/harbor-sweep/

## Leaderboard

Every finished game is saved to one shared leaderboard (Today and All time, best score per player).

- **Where scores live:** the Google Sheet "Harbor Sweep scores" in the owner's Google Drive (tab "Scores"). One row per game. Delete a row to remove a bad name.
- **Copy in this repo:** [`leaderboard/scores.json`](leaderboard/scores.json) is refreshed every hour by the "Save leaderboard" GitHub Action (Actions tab > Save leaderboard > Run workflow to refresh now).
- **How it connects:** the Sheet runs [`leaderboard/Code.gs`](leaderboard/Code.gs) as an Apps Script web app. Its address is `leaderboardUrl` near the top of `index.html`.
- **Editing the script later:** in Apps Script use Deploy > Manage deployments > Edit > Version: New version, so the address stays the same.
- **No signal:** scores wait on the phone and upload next time the game is opened or finished.

Student concept by a USC WRIT 340 ATLAS team for Clean Earth Rovers. Game scores are not real cleanup data.
