<?php
/*************************************************
 * Financial Dashboard — GET Method (HTML only)
 * - Course style: mysqli_* + setcookie + superglobals
 * - Always renders 8 blocks with the same HTML structure as dashboard.txt
 * - Visible blocks first (saved order), others appended and marked invisible
 *************************************************/

/* ---------- DB connection (adjust to your Docker credentials) ---------- */
$db_host = "mydb";
$db_user = "dummy";
$db_pass = "c3322b";
$db_name = "db3322";

$db_conn = mysqli_connect($db_host, $db_user, $db_pass, $db_name)
  or die("Connection Error! ".mysqli_connect_error());

/* ---------- Tiny UUID v4 helper ---------- */
function uuidv4(): string {
  $d = random_bytes(16);
  $d[6] = chr((ord($d[6]) & 0x0f) | 0x40); // version 4
  $d[8] = chr((ord($d[8]) & 0x3f) | 0x80); // variant
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
}


/* ---------- The app has exactly 8 blocks with IDs 1..8 ---------- */
$ALL_IDS = [1,2,3,4,5,6,7,8];

/* ================================================================
   PUT METHOD: save preferences (visible order) for future visits
   ================================================================ */
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Housekeeping: remove expired rows (silent)
    $now = time();
    @mysqli_query($db_conn, "DELETE FROM user_prefs WHERE expires_at < $now");

    // Must carry uid cookie and JSON body with 'visible' array
    if (!isset($_COOKIE['uid'])) {
        http_response_code(400);
        exit('Missing uid cookie');
    }
    $uid = $_COOKIE['uid'];

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data) || !isset($data['visible']) || !is_array($data['visible'])) {
        http_response_code(400);
        exit('Missing preferences (visible)');
    }

    // Normalize visible ids; infer hidden (complement of 1..8)
    $visible = array_values(array_intersect(array_map('intval', $data['visible']), $ALL_IDS));
    $hidden  = array_values(array_diff($ALL_IDS, $visible));
    $visibleCsv = implode(',', $visible);
    $hiddenCsv  = implode(',', $hidden);

    // Is uid valid (exists)?
    $uid_safe = mysqli_real_escape_string($db_conn, $uid);
    $rs = @mysqli_query($db_conn, "SELECT uid, expires_at FROM user_prefs WHERE uid = '$uid_safe' LIMIT 1");

    if ($rs && mysqli_num_rows($rs) > 0) {
        // VALID uid: update prefs; DO NOT change expires_at (expiry remains fixed)
        mysqli_free_result($rs);
        $sql = "UPDATE user_prefs SET visible='$visibleCsv', hidden='$hiddenCsv' WHERE uid='$uid_safe'";
        if (@mysqli_query($db_conn, $sql)) {
            http_response_code(200);
            exit; // No body needed
        } else {
            http_response_code(500);
            exit('DB update error');
        }
    } else {
        // INVALID uid: create NEW uid record, respond 200 with JSON { uid: ... }
        if ($rs) { mysqli_free_result($rs); }

        $newUid = uuidv4();
        $newUidSafe = mysqli_real_escape_string($db_conn, $newUid);
        $expires = time() + 300; // 5 minutes

        $sql = "INSERT INTO user_prefs (uid, visible, hidden, expires_at)
                VALUES ('$newUidSafe', '$visibleCsv', '$hiddenCsv', $expires)";
        if (@mysqli_query($db_conn, $sql)) {
            header('Content-Type: application/json');
            http_response_code(200);
            echo json_encode(['uid' => $newUid]);
            exit;
        } else {
            http_response_code(500);
            exit('DB insert error');
        }
    }
}


/* ---------- Define the eight blocks as in dashboard.txt ---------- */
/* We keep the exact structure: <h2>...</h2><p><img ...></p> */
$BLOCKS = [
  1 => [ 'h2' => 'Block 1 - SP500',                  'img' => 'images/SP500.png',           'alt' => 'SP500' ],
  2 => [ 'h2' => 'Block 2 - Foreign Exchange',       'img' => 'images/Forex.png',           'alt' => 'Exchange Rates' ],
  3 => [ 'h2' => 'Block 3 - Hang Seng Index',        'img' => 'images/HangSengIndex.png',   'alt' => 'Hang Seng Index' ],
  4 => [ 'h2' => 'Block 4 - Nasdaq Composite index', 'img' => 'images/NasdaqIndex.png',     'alt' => 'NASDAQ' ],
  5 => [ 'h2' => 'Block 5 - Gold Price',             'img' => 'images/gold.png',            'alt' => 'Gold Price' ],
  6 => [ 'h2' => 'Block 6 - Financial Calculator',   'img' => 'images/finCalculator.png',   'alt' => 'Financial Calculator' ],
  7 => [ 'h2' => 'Block 7 - Cryptocurrency Prices',  'img' => 'images/cryptocurrency.png',  'alt' => 'Crypto Index' ],
  8 => [ 'h2' => 'Block 8 - Stock Volatility',       'img' => 'images/stockVolatility.png', 'alt' => 'Stock Volatility' ],
];
$DEFAULT_ORDER   = array_keys($BLOCKS);  // [1..8]
$DEFAULT_VISIBLE = $DEFAULT_ORDER;       // default: all visible

/* ---------- Read uid from cookie or optional ?uid= ---------- */
$cookieName    = 'uid';
$uidFromCookie = isset($_COOKIE[$cookieName]) ? $_COOKIE[$cookieName] : null;
$uidFromQuery  = isset($_GET['uid']) ? $_GET['uid'] : null;
$uid           = $uidFromQuery ?: $uidFromCookie;

/* ---------- Housekeeping: remove expired rows (simple) ---------- */
$now = time();
mysqli_query($db_conn, "DELETE FROM user_prefs WHERE expires_at < $now");

/* ---------- Load preference if uid exists ---------- */
$prefRow = null;
if ($uid) {
  $uid_safe = mysqli_real_escape_string($db_conn, $uid);
  $sql = "SELECT visible FROM user_prefs WHERE uid = '$uid_safe' LIMIT 1";
  $rs  = mysqli_query($db_conn, $sql) or die("Query Error!".mysqli_error($db_conn));
  if (mysqli_num_rows($rs) > 0) {
    $prefRow = mysqli_fetch_array($rs, MYSQLI_ASSOC);
  }
  mysqli_free_result($rs);
}

/* ---------- If first time or invalid uid: issue NEW 5-min cookie (before output) ---------- */
$uidIsValid = ($prefRow !== null);
if (!$uidIsValid) {
  $uid = uuidv4();
  setcookie($cookieName, $uid, time() + 300, "/");  // 5 minutes (unchanged on later visits)
}

/* ---------- Compute final order + visibilities ---------- */
if ($uidIsValid) {
  $visible = array_map('intval', array_filter(explode(',', $prefRow['visible']), 'strlen'));
  // retain only valid block IDs
  $visible = array_values(array_intersect($visible, $DEFAULT_ORDER));
  $hidden  = array_values(array_diff($DEFAULT_ORDER, $visible));
  $order   = array_merge($visible, $hidden);
} else {
  $visible = $DEFAULT_VISIBLE;
  $hidden  = [];
  $order   = $DEFAULT_ORDER;
}
$visibleSet = array_flip($visible);

/* ---------- Close DB; output HTML only from here ---------- */
mysqli_close($db_conn);
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Financial Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <!-- External assets only -->
  <link href="index.css" rel="stylesheet" />

</head>
<body>
  <div id="outmost" style="max-width:1000px;margin:1rem auto 0;">
    <h1>Financial Dashboard</h1>
     <button id="customizeBtn" class="custom-btn">Customize</button>

    <div id="container">

<?php foreach ($order as $id):
    $b = $BLOCKS[$id];
    $isVisible = isset($visibleSet[$id]);
    $cls = $isVisible ? 'visible' : 'invisible';
?>
  <div class="fin-block <?= $cls ?>" data-block-id="<?= htmlspecialchars($id) ?>">
    <h2><?= htmlspecialchars($b['h2']) ?></h2>
    <p>
      <img src="<?= htmlspecialchars($b['img']) ?>" alt="<?= htmlspecialchars($b['alt']) ?>">
    </p>
  </div>
<?php endforeach; ?>

    </div>
  </div>

  <!-- Link JS (no inline app logic; assignment asks for index.js) -->
 <script src="index.js"></script>
</body>
</html>
