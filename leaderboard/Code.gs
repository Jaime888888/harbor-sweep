/**
 * Harbor Sweep leaderboard, stored in a Google Sheet.
 *
 * Setup (about 2 minutes):
 *   1. Make a new Google Sheet (sheets.new). Name it "Harbor Sweep scores".
 *   2. Extensions > Apps Script. Delete what is there, paste this whole file, click Save.
 *   3. Deploy > New deployment > gear icon > Web app.
 *        Execute as: Me.   Who has access: Anyone.   Click Deploy and allow access.
 *   4. Copy the Web app URL (it ends in /exec) and put it in CONFIG.leaderboardUrl in index.html.
 *
 * Every finished game adds one row to the "Scores" tab. To remove a bad name, delete its row.
 * If you edit this script later, use Deploy > Manage deployments > Edit > New version,
 * so the URL stays the same.
 */

var SHEET_NAME = 'Scores';
var HEAD = ['Time', 'Name', 'Total', 'Remote control', 'Autopilot', 'Kept %', 'Escaped', 'Safety stops', 'Player'];
var TZ = 'America/Los_Angeles';   // "Today" resets at midnight Pacific
var TOP_N = 10;
var BLOCK = ['fuck', 'shit', 'bitch', 'cunt', 'nigg', 'faggot', 'pussy', 'whore', 'slut', 'nazi', 'hitler',
             'asshole', 'retard', 'puto', 'pendej', 'mierda', 'verga', 'chinga', 'culero', 'pinche'];

function doGet(e) {
  var p = (e && e.parameter) || {};
  return out_(boards_(rows_(), cleanId_(p.player), cleanName_(p.name, true)));
}

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, error: 'bad request' }); }
  var player = cleanId_(d.player);
  if (!player) return out_({ ok: false, error: 'no player' });
  var l1 = num_(d.l1, 150), l2 = num_(d.l2, 150), kept = num_(d.kept, 100), esc = num_(d.escaped, 400), stops = num_(d.stops, 100);
  if ([l1, l2, kept, esc, stops].indexOf(null) >= 0) return out_({ ok: false, error: 'bad score' });
  var name = cleanName_(d.name, false);

  var cache = CacheService.getScriptCache();
  var gameId = cleanId_(d.gid) || String(d.t || '').replace(/[^0-9]/g, '').slice(0, 15);
  var gameKey = 'g' + player + '_' + gameId;
  if (gameId && cache.get(gameKey)) return out_(boards_(rows_(), player, name));   // same game sent twice: already saved
  var rateKey = 'r' + player, recent = Number(cache.get(rateKey)) || 0;
  if (recent >= 8) return out_({ ok: false, error: 'too fast' });               // a real game takes two minutes

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return out_({ ok: false, error: 'busy' });
  try {
    sheet_().appendRow([new Date(), name, l1 + l2, l1, l2, kept, esc, stops, player]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  if (gameId) cache.put(gameKey, '1', 21600);
  cache.put(rateKey, String(recent + 1), 60);
  return out_(boards_(rows_(), player, name));
}

/* ---------- helpers ---------- */
function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold');
  }
  return sh;
}

function rows_() {
  var sh = sheet_(), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, HEAD.length).getValues().map(function (r) {
    var t = r[0] instanceof Date ? r[0] : new Date(r[0]);
    return { t: t, name: String(r[1]), total: Number(r[2]) || 0, kept: Number(r[5]) || 0, player: String(r[8]) };
  }).filter(function (r) { return !isNaN(r.t.getTime()) && r.name; });
}

function boards_(rows, player, name) {
  var today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  var todays = rows.filter(function (r) { return Utilities.formatDate(r.t, TZ, 'yyyy-MM-dd') === today; });
  var meKey = player && name ? player + '|' + name.toLowerCase() : '';
  return { ok: true, today: board_(todays, meKey), all: board_(rows, meKey) };
}

/* Best score per person (device + name), highest first. Player ids never leave the server. */
function board_(rows, meKey) {
  var best = {};
  rows.forEach(function (r) {
    var k = r.player + '|' + r.name.toLowerCase(), b = best[k];
    if (!b || r.total > b.total || (r.total === b.total && r.kept > b.kept)) best[k] = { k: k, name: r.name, total: r.total, kept: r.kept, t: r.t };
  });
  var list = Object.keys(best).map(function (k) { return best[k]; });
  list.sort(function (a, b) { return b.total - a.total || b.kept - a.kept || a.t - b.t; });
  var top = list.slice(0, TOP_N).map(function (r, i) {
    return { rank: i + 1, name: r.name, total: r.total, kept: r.kept, me: r.k === meKey };
  });
  var mi = -1;
  if (meKey) for (var i = 0; i < list.length; i++) if (list[i].k === meKey) { mi = i; break; }
  return {
    players: list.length,
    top: top,
    me: mi >= 0 ? { rank: mi + 1, name: list[mi].name, total: list[mi].total, kept: list[mi].kept } : null
  };
}

function num_(v, max) {
  v = Math.round(Number(v));
  return isFinite(v) && v >= 0 && v <= max ? v : null;
}

function cleanId_(s) { return String(s || '').replace(/[^a-z0-9]/gi, '').slice(0, 24); }

/* Letters from any language, numbers and a little punctuation, starting with a letter or number,
   so nothing can turn into a formula. Must match cleanName in index.html. */
function cleanName_(s, allowEmpty) {
  s = String(s || '').normalize('NFC').replace(/[^\p{L}\p{M}\p{N} .'_!-]/gu, '')
    .replace(/\s+/g, ' ').trim()
    .replace(/^[^\p{L}\p{N}]+/u, '');
  s = Array.from(s).slice(0, 16).join('').trim();
  var flat = s.toLowerCase().replace(/[0@]/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e')
    .replace(/4/g, 'a').replace(/[5$]/g, 's').replace(/7/g, 't').replace(/[^a-z]/g, '');
  if (s && BLOCK.some(function (w) { return flat.indexOf(w) >= 0; })) s = '';
  return s || (allowEmpty ? '' : 'Rover pilot');
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
