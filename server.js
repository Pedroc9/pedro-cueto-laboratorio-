const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Cambiar si tienes contraseña
    database: 'aura_ai_db'
});

db.connect(err => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Endpoints
app.post('/api/register', (req, res) => {
    const { name, email, date } = req.body;
    const query = 'INSERT INTO pending_users (name, email, date) VALUES (?, ?, ?)';
    db.query(query, [name, email, date], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Solicitud enviada' });
    });
});

app.get('/api/pending', (req, res) => {
    db.query('SELECT * FROM pending_users', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/approve', (req, res) => {
    const { email, username, password } = req.body;
    
    // Get user from pending
    db.query('SELECT * FROM pending_users WHERE email = ?', [email], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        const user = results[0];
        const insertQuery = 'INSERT INTO approved_users (name, email, username, password) VALUES (?, ?, ?, ?)';
        
        db.query(insertQuery, [user.name, user.email, username, password], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Remove from pending
            db.query('DELETE FROM pending_users WHERE email = ?', [email], () => {
                res.json({ message: 'Usuario aprobado', username, password });
            });
        });
    });
});

app.post('/api/reject', (req, res) => {
    const { email } = req.body;
    db.query('SELECT * FROM pending_users WHERE email = ?', [email], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: 'No encontrado' });
        const user = results[0];
        db.query('INSERT INTO rejected_users (name, email, date) VALUES (?, ?, ?)', [user.name, user.email, new Date().toLocaleDateString()], () => {
            db.query('DELETE FROM pending_users WHERE email = ?', [email], () => {
                res.json({ message: 'Usuario rechazado' });
            });
        });
    });
});

app.get('/api/approved', (req, res) => {
    db.query('SELECT id, name, email, username, password FROM approved_users', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/rejected', (req, res) => {
    db.query('SELECT * FROM rejected_users', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.delete('/api/user/:email', (req, res) => {
    const { email } = req.params;
    const { type } = req.query;
    const table = type === 'approved' ? 'approved_users' : 'rejected_users';
    
    db.query(`DELETE FROM ${table} WHERE email = ?`, [email], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Usuario eliminado' });
    });
});

app.post('/api/login', (req, res) => {
    const { userOrEmail, password } = req.body;
    const query = 'SELECT * FROM approved_users WHERE (username = ? OR email = ?) AND password = ?';
    db.query(query, [userOrEmail, userOrEmail, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(401).json({ error: 'Credenciales inválidas' });
        }
    });
});

app.post('/api/upload-photo', (req, res) => {
    const { username, photo } = req.body;
    db.query('UPDATE approved_users SET photo = ? WHERE username = ?', [photo, username], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Foto actualizada' });
    });
});

app.get('/api/get-photo/:username', (req, res) => {
    const { username } = req.params;
    db.query('SELECT photo FROM approved_users WHERE username = ?', [username], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json({ photo: results[0].photo });
    });
});

app.listen(port, () => {
    console.log(`Servidor Aura AI corriendo en http://localhost:${port}`);
});
