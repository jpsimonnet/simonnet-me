<?php
/**
 * proxy.php — Relai CORS minimaliste pour flux RSS.
 * Utilise cURL pour un meilleur support des redirections et SSL.
 */
error_reporting(0);
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

if (!preg_match('/^https?:\/\//i', $url)) {
    http_response_code(400);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Protocole non autorise';
    exit;
}

if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; RSS-Reader/1.0)',
        CURLOPT_ENCODING => '',  // Accept gzip, deflate
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);
    $content = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);

    if ($content === false || $httpCode >= 400) {
        http_response_code(502);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Erreur ' . $httpCode . ': ' . ($error ?: 'Impossible de recuperer le flux');
        exit;
    }
} else {
    // Fallback file_get_contents
    $ctx = stream_context_create([
        'http' => [
            'timeout' => 15,
            'user_agent' => 'Mozilla/5.0 (compatible; RSS-Reader/1.0)',
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
}

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=300');
echo $content;
