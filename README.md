# Harbor Sweep

A two-minute browser game: pilot a trash-collecting rover around a San Pedro harbor. Steer it yourself, then plan a route and let it drive itself.

Play: https://jaime888888.github.io/harbor-sweep/

## Leaderboard

Every finished game is saved to a shared leaderboard (Today and All time, best score per player).
Scores are stored in a Google Sheet through a small Apps Script web app:

1. Make a new Google Sheet (sheets.new) named "Harbor Sweep scores".
2. Extensions > Apps Script. Delete what is there, paste [`leaderboard/Code.gs`](leaderboard/Code.gs), click Save.
3. Deploy > New deployment > gear icon > Web app. Execute as: **Me**. Who has access: **Anyone**. Deploy, then allow access.
4. Copy the Web app URL (ends in `/exec`) into `leaderboardUrl` near the top of `index.html`.

Each game adds a row to the sheet's "Scores" tab. Delete a row to remove a bad name.
Until a URL is set, each device keeps its own leaderboard. Scores that can't be sent (no signal) wait on the phone and upload next time.

Student concept by a USC WRIT 340 ATLAS team for Clean Earth Rovers. Game scores are not real cleanup data.
