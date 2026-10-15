<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON payload.']);
    exit;
}

// Check admin authentication
$token = isset($data['token']) ? $data['token'] : '';
$password = isset($data['password']) ? $data['password'] : '';

if ($token !== 'authenticated' && $password !== 'admin123') {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized. Please log in with admin password.']);
    exit;
}

$content = isset($data['content']) ? $data['content'] : $data;

// Validate minimal structure
if (!isset($content['menu']) || !isset($content['menu']['categories'])) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Invalid content structure: missing menu.categories.']);
    exit;
}

// Target file path
$targetDir = __DIR__ . '/../data';
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
}
$targetFile = $targetDir . '/content.json';

// Create a backup first
if (file_exists($targetFile)) {
    copy($targetFile, $targetFile . '.bak');
}

$jsonString = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($jsonString === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to encode JSON: ' . json_last_error_msg()]);
    exit;
}

$written = file_put_contents($targetFile, $jsonString, LOCK_EX);
if ($written === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to write to content.json file. Check permissions.']);
    exit;
}

// Log change
$auditFile = $targetDir . '/audit_log.json';
$auditLog = [];
if (file_exists($auditFile)) {
    $auditLog = json_decode(file_get_contents($auditFile), true) ?: [];
}
$auditLog[] = [
    'timestamp' => date('c'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'action' => 'content_update',
    'bytes' => $written
];
if (count($auditLog) > 50) {
    $auditLog = array_slice($auditLog, -50);
}
@file_put_contents($auditFile, json_encode($auditLog, JSON_PRETTY_PRINT));

echo json_encode([
    'success' => true,
    'message' => 'Menu content successfully saved to server!',
    'timestamp' => time(),
    'bytes' => $written
]);
