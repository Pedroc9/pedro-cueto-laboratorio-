<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Configuración de la base de datos
$host = "localhost";
$user = "root";
$pass = ""; // Cambiar si tienes contraseña en AppServ
$db   = "aura_ai_db";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die(json_encode(["error" => "Error de conexión: " . $conn->connect_error]));
}

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['action'] ?? '';

// Obtener datos del cuerpo de la petición
$input = json_decode(file_get_contents('php://input'), true);

switch ($path) {
    case 'register':
        if ($method == 'POST') {
            $stmt = $conn->prepare("INSERT INTO pending_users (name, email, date) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $input['name'], $input['email'], $input['date']);
            if ($stmt->execute()) {
                echo json_encode(["message" => "Solicitud enviada"]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => $conn->error]);
            }
        }
        break;

    case 'pending':
        $result = $conn->query("SELECT * FROM pending_users");
        $users = [];
        while ($row = $result->fetch_assoc()) $users[] = $row;
        echo json_encode($users);
        break;

    case 'approve':
        if ($method == 'POST') {
            $email = $input['email'];
            $username = $input['username'];
            $password = $input['password'];

            $res = $conn->query("SELECT * FROM pending_users WHERE email = '$email'");
            if ($user = $res->fetch_assoc()) {
                $stmt = $conn->prepare("INSERT INTO approved_users (name, email, username, password) VALUES (?, ?, ?, ?)");
                $stmt->bind_param("ssss", $user['name'], $user['email'], $username, $password);
                if ($stmt->execute()) {
                    $conn->query("DELETE FROM pending_users WHERE email = '$email'");
                    echo json_encode(["message" => "Usuario aprobado"]);
                }
            }
        }
        break;

    case 'reject':
        if ($method == 'POST') {
            $email = $input['email'];
            $res = $conn->query("SELECT * FROM pending_users WHERE email = '$email'");
            if ($user = $res->fetch_assoc()) {
                $date = date("d/m/Y");
                $stmt = $conn->prepare("INSERT INTO rejected_users (name, email, date) VALUES (?, ?, ?)");
                $stmt->bind_param("sss", $user['name'], $user['email'], $date);
                if ($stmt->execute()) {
                    $conn->query("DELETE FROM pending_users WHERE email = '$email'");
                    echo json_encode(["message" => "Rechazado"]);
                }
            }
        }
        break;

    case 'approved':
        $result = $conn->query("SELECT id, name, email, username, password FROM approved_users");
        $users = [];
        while ($row = $result->fetch_assoc()) $users[] = $row;
        echo json_encode($users);
        break;

    case 'rejected':
        $result = $conn->query("SELECT * FROM rejected_users");
        $users = [];
        while ($row = $result->fetch_assoc()) $users[] = $row;
        echo json_encode($users);
        break;

    case 'delete':
        if ($method == 'DELETE') {
            $email = $_GET['email'];
            $table = ($_GET['type'] == 'approved') ? 'approved_users' : 'rejected_users';
            $conn->query("DELETE FROM $table WHERE email = '$email'");
            echo json_encode(["message" => "Eliminado"]);
        }
        break;

    case 'login':
        if ($method == 'POST') {
            $userOrEmail = $input['userOrEmail'];
            $password = $input['password'];
            $stmt = $conn->prepare("SELECT * FROM approved_users WHERE (username = ? OR email = ?) AND password = ?");
            $stmt->bind_param("sss", $userOrEmail, $userOrEmail, $password);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($user = $result->fetch_assoc()) {
                echo json_encode($user);
            } else {
                http_response_code(401);
                echo json_encode(["error" => "Credenciales inválidas"]);
            }
        }
        break;

    case 'upload-photo':
        if ($method == 'POST') {
            $username = $input['username'];
            $photo = $input['photo'];
            $stmt = $conn->prepare("UPDATE approved_users SET photo = ? WHERE username = ?");
            $stmt->bind_param("ss", $photo, $username);
            $stmt->execute();
            echo json_encode(["message" => "OK"]);
        }
        break;

    case 'get-photo':
        $username = $_GET['username'];
        $res = $conn->query("SELECT photo FROM approved_users WHERE username = '$username'");
        if ($row = $res->fetch_assoc()) {
            echo json_encode(["photo" => $row['photo']]);
        }
        break;
}

$conn->close();
?>
