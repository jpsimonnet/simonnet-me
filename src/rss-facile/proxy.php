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

// Trouver le bundle de certificats CA
$caBundle = '';
$caPaths = [
    '/opt/homebrew/etc/ca-certificates/cert.pem',
    '/opt/homebrew/etc/openssl@3/cert.pem',
    '/etc/ssl/certs/ca-certificates.crt',      // Linux (Debian/Ubuntu)
    '/etc/pki/tls/certs/ca-bundle.crt',         // Linux (RHEL/CentOS)
    '/usr/local/share/ca-certificates/cacert.pem',
    ini_get('openssl.cafile'),
    ini_get('curl.cainfo'),
];
foreach ($caPaths as $p) {
    if ($p && file_exists($p)) { $caBundle = $p; break; }
}

function curlFetch($url, $caBundle, $verifySsl = true) {
    $ch = curl_init();
    $opts = [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        CURLOPT_ENCODING => '',  // Accept gzip, deflate
        CURLOPT_HTTPHEADER => [
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language: fr-FR,fr;q=0.9,en;q=0.8',
            'Sec-Fetch-Dest: document',
            'Sec-Fetch-Mode: navigate',
            'Sec-Fetch-Site: none',
            'Sec-Fetch-User: ?1',
            'Upgrade-Insecure-Requests: 1',
        ],
    ];
    if ($verifySsl) {
        $opts[CURLOPT_SSL_VERIFYPEER] = true;
        $opts[CURLOPT_SSL_VERIFYHOST] = 2;
        if ($caBundle) {
            $opts[CURLOPT_CAINFO] = $caBundle;
        }
    } else {
        $opts[CURLOPT_SSL_VERIFYPEER] = false;
        $opts[CURLOPT_SSL_VERIFYHOST] = 0;
    }
    curl_setopt_array($ch, $opts);
    $content = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    return ['content' => $content, 'httpCode' => $httpCode, 'error' => $error];
}

if (function_exists('curl_init')) {
    // 1ere tentative avec verification SSL
    $result = curlFetch($url, $caBundle, true);

    // Si erreur SSL (cert intermediaire manquant, CA introuvable…),
    // retry sans verification SSL — courant pour les serveurs mal configures
    if ($result['content'] === false && strpos($result['error'], 'SSL') !== false) {
        $result = curlFetch($url, $caBundle, false);
    }

    $content = $result['content'];
    $httpCode = $result['httpCode'];
    $error = $result['error'];

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
            'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
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
        // Retry sans verification SSL
        $ctx = stream_context_create([
            'http' => [
                'timeout' => 15,
                'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'follow_location' => true,
                'max_redirects' => 5
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ]);
        $content = @file_get_contents($url, false, $ctx);
    }
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
