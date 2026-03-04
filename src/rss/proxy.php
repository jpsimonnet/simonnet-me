<?php
/**
 * proxy.php — Relai CORS minimaliste pour flux RSS.
 * Optionnel : l'application fonctionne sans ce fichier (fallback sur proxies publics).
 */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Point de detection par le JS
if (isset($_GET['check'])) {
    header('Content-Type: text/plain; charset=utf-8');
    echo 'ok';
    exit;
}

$url = isset($_GET['url']) ? $_GET['url'] : '';

if (!$url || !filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'URL invalide';
    exit;
}

// Limiter aux protocoles HTTP/HTTPS
if (!preg_match('/^https?:\/\//i', $url)) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Protocole non autorise';
    exit;
}

$ctx = stream_context_create([
    'http' => [
        'timeout' => 15,
        'user_agent' => 'RSS-Reader/1.0',
        'follow_location' => true,
        'max_redirects' => 5
    ],
    'ssl' => [
        'verify_peer' => true,
        'verify_peer_name' => true
    ]
]);

$content = @file_get_contents($url, false, $ctx);

if ($content === false) {
    http_response_code(502);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Impossible de recuperer le flux';
    exit;
}

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=300'); // Cache 5 min
echo $content;
