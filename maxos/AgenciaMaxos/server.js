import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// 👇 1. CREAR APP PRIMERO
const app = express();

// 👇 2. CONFIGURAR __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👇 3. AHORA SÍ usar app
app.use(express.static(__dirname));

// 👇 4. RUTA PRINCIPAL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 👇 5. MIDDLEWARES
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Multer para subir logo en memoria (base64)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

// 🔌 CONEXIÓN MYSQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'jcruzpd12',
  database: 'agencia_viajes'
});

db.connect(err => {
  if (err) console.log(err);
  else console.log("✅ Conectado a MySQL");
});


// =========================
// 🔐 LOGIN
// =========================
app.post('/login', (req, res) => {
  const { correo, contrasena } = req.body;
  db.query("SELECT * FROM usuarios WHERE correo=? AND contrasena=?", [correo, contrasena], (err, result) => {
    if (err) return res.send(err);
    if (result.length > 0) res.json({ success: true, user: result[0] });
    else res.json({ success: false });
  });
});


// =========================
// ⚙️ CONFIGURACIÓN AGENCIA
// =========================
app.get('/configuracion', (req, res) => {
  db.query("SELECT * FROM configuracion LIMIT 1", (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data[0] || { nombre: 'Travel CRM', logo_base64: null });
  });
});

app.put('/configuracion', upload.single('logo'), (req, res) => {
  const nombre = req.body.nombre || 'Travel CRM';
  let logoBase64 = req.body.logo_base64 || null;

  // Si vino archivo, convertir a base64
  if (req.file) {
    const mime = req.file.mimetype;
    logoBase64 = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
  }

  db.query("SELECT id FROM configuracion LIMIT 1", (err, rows) => {
    if (err) return res.status(500).send(err);
    if (rows.length > 0) {
      const sql = logoBase64
        ? "UPDATE configuracion SET nombre=?, logo_base64=? WHERE id=?"
        : "UPDATE configuracion SET nombre=? WHERE id=?";
      const params = logoBase64 ? [nombre, logoBase64, rows[0].id] : [nombre, rows[0].id];
      db.query(sql, params, (e) => {
        if (e) return res.status(500).send(e);
        res.json({ success: true });
      });
    } else {
      db.query("INSERT INTO configuracion(nombre,logo_base64) VALUES(?,?)", [nombre, logoBase64], (e) => {
        if (e) return res.status(500).send(e);
        res.json({ success: true });
      });
    }
  });
});


// =========================
// 👥 CLIENTES CRUD
// =========================
app.get('/clientes', (req, res) => {
  db.query("SELECT * FROM clientes ORDER BY id_cliente DESC", (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data);
  });
});

app.post('/clientes', (req, res) => {
  const { nombre, email, telefono, como_supieron } = req.body;
  db.query(
    "INSERT INTO clientes(nombre,email,telefono,como_supieron) VALUES(?,?,?,?)",
    [nombre, email, telefono, como_supieron || null],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Cliente agregado");
    }
  );
});

app.put('/clientes/:id', (req, res) => {
  const { nombre, email, telefono, como_supieron } = req.body;
  db.query(
    "UPDATE clientes SET nombre=?,email=?,telefono=?,como_supieron=? WHERE id_cliente=?",
    [nombre, email, telefono, como_supieron || null, req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Cliente actualizado");
    }
  );
});

app.delete('/clientes/:id', (req, res) => {
  db.query("DELETE FROM clientes WHERE id_cliente=?", [req.params.id], err => {
    if (err) return res.status(500).send(err);
    res.send("Cliente eliminado");
  });
});


// =========================
// 🏢 PROVEEDORES CRUD
// =========================
app.get('/proveedores', (req, res) => {
  db.query("SELECT * FROM proveedores ORDER BY id_proveedor DESC", (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data);
  });
});

app.post('/proveedores', (req, res) => {
  const { nombre, tipo, comision } = req.body;
  db.query(
    "INSERT INTO proveedores(nombre,tipo,comision) VALUES(?,?,?)",
    [nombre, tipo, comision],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Proveedor agregado");
    }
  );
});

app.put('/proveedores/:id', (req, res) => {
  const { nombre, tipo, comision } = req.body;
  db.query(
    "UPDATE proveedores SET nombre=?,tipo=?,comision=? WHERE id_proveedor=?",
    [nombre, tipo, comision, req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Proveedor actualizado");
    }
  );
});

app.delete('/proveedores/:id', (req, res) => {
  db.query("DELETE FROM proveedores WHERE id_proveedor=?", [req.params.id], err => {
    if (err) return res.status(500).send(err);
    res.send("Proveedor eliminado");
  });
});


// =========================
// 💰 COTIZACIONES CRUD
// =========================
app.get('/cotizaciones', (req, res) => {
  const sql = `
    SELECT c.*, cl.nombre AS nombre_cliente, p.nombre AS nombre_proveedor
    FROM cotizaciones c
    LEFT JOIN clientes cl ON c.id_cliente = cl.id_cliente
    LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
    ORDER BY c.id_cotizacion DESC
  `;
  db.query(sql, (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data);
  });
});

app.post('/cotizaciones', (req, res) => {
  const { id_cliente, id_proveedor, destino, precio, fecha, fecha_viaje, estatus } = req.body;
  db.query(
    "INSERT INTO cotizaciones(id_cliente,id_proveedor,destino,precio,fecha,fecha_viaje,estatus) VALUES(?,?,?,?,?,?,?)",
    [id_cliente, id_proveedor, destino, precio, fecha, fecha_viaje || null, estatus],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Cotización creada");
    }
  );
});

app.put('/cotizaciones/:id', (req, res) => {
  const { id_cliente, id_proveedor, destino, precio, fecha, fecha_viaje, estatus } = req.body;
  db.query(
    "UPDATE cotizaciones SET id_cliente=?,id_proveedor=?,destino=?,precio=?,fecha=?,fecha_viaje=?,estatus=? WHERE id_cotizacion=?",
    [id_cliente, id_proveedor, destino, precio, fecha, fecha_viaje || null, estatus, req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Cotización actualizada");
    }
  );
});

app.delete('/cotizaciones/:id', (req, res) => {
  db.query("DELETE FROM cotizaciones WHERE id_cotizacion=?", [req.params.id], err => {
    if (err) return res.status(500).send(err);
    res.send("Cotización eliminada");
  });
});


// =========================
// 🧾 RESERVAS CRUD
// =========================
app.get('/reservas', (req, res) => {
  const sql = `
    SELECT r.*, cl.nombre AS nombre_cliente, p.nombre AS nombre_proveedor
    FROM reservas r
    LEFT JOIN clientes cl ON r.id_cliente = cl.id_cliente
    LEFT JOIN proveedores p ON r.id_proveedor = p.id_proveedor
    ORDER BY r.id_reserva DESC
  `;
  db.query(sql, (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data);
  });
});

app.post('/reservas', (req, res) => {
  const { id_cliente, id_proveedor, tipo, monto_total, tipo_pago, tipo_caja, fecha, comision } = req.body;
  db.query(
    "INSERT INTO reservas(id_cliente,id_proveedor,tipo,monto_total,tipo_pago,tipo_caja,fecha,comision) VALUES(?,?,?,?,?,?,?,?)",
    [id_cliente, id_proveedor || null, tipo, monto_total, tipo_pago, tipo_caja || null, fecha, comision],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Reserva creada");
    }
  );
});

app.put('/reservas/:id', (req, res) => {
  const { id_cliente, id_proveedor, tipo, monto_total, tipo_pago, tipo_caja, fecha, comision } = req.body;
  db.query(
    "UPDATE reservas SET id_cliente=?,id_proveedor=?,tipo=?,monto_total=?,tipo_pago=?,tipo_caja=?,fecha=?,comision=? WHERE id_reserva=?",
    [id_cliente, id_proveedor || null, tipo, monto_total, tipo_pago, tipo_caja || null, fecha, comision, req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Reserva actualizada");
    }
  );
});

app.delete('/reservas/:id', (req, res) => {
  db.query("DELETE FROM reservas WHERE id_reserva=?", [req.params.id], err => {
    if (err) return res.status(500).send(err);
    res.send("Reserva eliminada");
  });
});


// =========================
// 🏆 COMISIONES CRUD
// =========================
app.get('/comisiones', (req, res) => {
  const sql = `
    SELECT cm.*, cl.nombre AS nombre_cliente, p.nombre AS nombre_proveedor
    FROM comisiones cm
    LEFT JOIN clientes cl ON cm.id_cliente = cl.id_cliente
    LEFT JOIN proveedores p ON cm.id_proveedor = p.id_proveedor
    ORDER BY cm.id_comision DESC
  `;
  db.query(sql, (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data);
  });
});

app.post('/comisiones', (req, res) => {
  const { id_reserva, id_cliente, id_proveedor, monto_comision, fecha_inicio, fecha_fin, pagada, notas } = req.body;
  db.query(
    "INSERT INTO comisiones(id_reserva,id_cliente,id_proveedor,monto_comision,fecha_inicio,fecha_fin,pagada,notas) VALUES(?,?,?,?,?,?,?,?)",
    [id_reserva || null, id_cliente, id_proveedor || null, monto_comision, fecha_inicio || null, fecha_fin || null, pagada, notas || null],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Comisión registrada");
    }
  );
});

app.put('/comisiones/:id', (req, res) => {
  const { id_reserva, id_cliente, id_proveedor, monto_comision, fecha_inicio, fecha_fin, pagada, notas } = req.body;
  db.query(
    "UPDATE comisiones SET id_reserva=?,id_cliente=?,id_proveedor=?,monto_comision=?,fecha_inicio=?,fecha_fin=?,pagada=?,notas=? WHERE id_comision=?",
    [id_reserva || null, id_cliente, id_proveedor || null, monto_comision, fecha_inicio || null, fecha_fin || null, pagada, notas || null, req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Comisión actualizada");
    }
  );
});

app.delete('/comisiones/:id', (req, res) => {
  db.query("DELETE FROM comisiones WHERE id_comision=?", [req.params.id], err => {
    if (err) return res.status(500).send(err);
    res.send("Comisión eliminada");
  });
});


// =========================
// 📊 REPORTES
// =========================

// Cotizaciones por rango de fecha
app.get('/reportes/cotizaciones', (req, res) => {
  const { fecha_inicio, fecha_fin, id_proveedor } = req.query;
  let sql = `
    SELECT c.*, cl.nombre AS nombre_cliente, p.nombre AS nombre_proveedor
    FROM cotizaciones c
    LEFT JOIN clientes cl ON c.id_cliente = cl.id_cliente
    LEFT JOIN proveedores p ON c.id_proveedor = p.id_proveedor
    WHERE 1=1
  `;
  const params = [];
  if (fecha_inicio) { sql += " AND c.fecha >= ?"; params.push(fecha_inicio); }
  if (fecha_fin)    { sql += " AND c.fecha <= ?"; params.push(fecha_fin); }
  if (id_proveedor) { sql += " AND c.id_proveedor = ?"; params.push(id_proveedor); }
  sql += " ORDER BY c.fecha DESC";

  db.query(sql, params, (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data);
  });
});

// Reservas por rango de fecha / mes
app.get('/reportes/reservas', (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  let sql = `
    SELECT r.*, cl.nombre AS nombre_cliente, p.nombre AS nombre_proveedor
    FROM reservas r
    LEFT JOIN clientes cl ON r.id_cliente = cl.id_cliente
    LEFT JOIN proveedores p ON r.id_proveedor = p.id_proveedor
    WHERE 1=1
  `;
  const params = [];
  if (fecha_inicio) { sql += " AND r.fecha >= ?"; params.push(fecha_inicio); }
  if (fecha_fin)    { sql += " AND r.fecha <= ?"; params.push(fecha_fin); }
  sql += " ORDER BY r.fecha DESC";

  db.query(sql, params, (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data);
  });
});

// Comisiones pendientes / pagadas
app.get('/reportes/comisiones', (req, res) => {
  const { pagada } = req.query;
  let sql = `
    SELECT cm.*, cl.nombre AS nombre_cliente, p.nombre AS nombre_proveedor
    FROM comisiones cm
    LEFT JOIN clientes cl ON cm.id_cliente = cl.id_cliente
    LEFT JOIN proveedores p ON cm.id_proveedor = p.id_proveedor
    WHERE 1=1
  `;
  const params = [];
  if (pagada) { sql += " AND cm.pagada = ?"; params.push(pagada); }
  sql += " ORDER BY cm.fecha_inicio ASC";

  db.query(sql, params, (err, data) => {
    if (err) return res.status(500).send(err);
    res.json(data);
  });
});


// =========================
// 🚀 SERVER
// =========================
app.listen(3000, () => {
  console.log("🚀 Servidor en http://localhost:3000");
});