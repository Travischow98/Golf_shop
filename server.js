import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendOrderToSheet } from './sheets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const STORE_FILE = path.join(__dirname, 'data', 'store.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const productCatalog = [
  { id: 'polo-heritage', name: 'Heritage Golf Polo', price: 89 },
  { id: 'windbreaker-elite', name: 'Elite Windbreaker', price: 149 },
  { id: 'visor-tour', name: 'Tour Visor', price: 38 },
  { id: 'glove-pro', name: 'Pro Leather Glove', price: 26 },
  { id: 'bucket-hat-link', name: 'Links Bucket Hat', price: 52 },
  { id: 'bag-range', name: 'Range Duffle Bag', price: 118 }
];

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

async function readStore() {
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return { orderCount: parsed.length, orders: parsed };
    }

    return {
      orderCount: Number(parsed.orderCount) || 0,
      orders: Array.isArray(parsed.orders) ? parsed.orders : []
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { orderCount: 0, orders: [] };
    }
    throw error;
  }
}

async function writeStore(store) {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2));
}

function json(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function parseBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  return body ? JSON.parse(body) : {};
}

function sanitizeOrderPayload(body) {
  const selectedProducts = Array.isArray(body.products) ? body.products : [];
  const validProducts = selectedProducts
    .map((id) => productCatalog.find((product) => product.id === id))
    .filter(Boolean);

  if (!body.customerName || !body.email || !body.phone || validProducts.length === 0) {
    return null;
  }

  return {
    id: `ORD-${Date.now()}`,
    customerName: String(body.customerName).trim(),
    email: String(body.email).trim(),
    phone: String(body.phone).trim(),
    products: validProducts.map((product) => product.name),
    productIds: validProducts.map((product) => product.id),
    totalAmount: validProducts.reduce((sum, product) => sum + product.price, 0),
    createdAt: new Date().toISOString()
  };
}

async function serveStatic(res, pathname) {
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  const resolved = path.resolve(path.join(PUBLIC_DIR, relative));

  if (!resolved.startsWith(path.resolve(PUBLIC_DIR))) {
    return json(res, 403, { error: 'Forbidden' });
  }

  try {
    const ext = path.extname(resolved);
    const content = await fs.readFile(resolved);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    json(res, 404, { error: 'Not found' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  if (req.method === 'GET' && pathname === '/api/products') {
    return json(res, 200, { products: productCatalog });
  }

  if (req.method === 'GET' && pathname === '/api/orders/summary') {
    const store = await readStore();
    return json(res, 200, {
      totalOrders: store.orderCount,
      totalRevenue: store.orders.reduce((sum, order) => sum + order.totalAmount, 0)
    });
  }

  if (req.method === 'GET' && pathname === '/api/orders') {
    const adminKey = process.env.ADMIN_KEY;
    if (!adminKey || req.headers['x-admin-key'] !== adminKey) {
      return json(res, 401, { error: 'Unauthorized' });
    }

    const store = await readStore();
    return json(res, 200, store);
  }

  if (req.method === 'POST' && pathname === '/api/orders') {
    try {
      const body = await parseBody(req);
      const order = sanitizeOrderPayload(body);

      if (!order) {
        return json(res, 400, { error: 'Please provide name, email, phone, and at least one product.' });
      }

      const store = await readStore();
      const orderCount = store.orderCount + 1;
      const orderWithCount = { ...order, orderCount };
      const nextStore = { orderCount, orders: [...store.orders, orderWithCount] };

      await writeStore(nextStore);
      const googleSync = await appendOrderToSheet(orderWithCount, orderCount);

      return json(res, 201, {
        message: 'Order received successfully!',
        orderId: order.id,
        totalOrders: orderCount,
        googleSync
      });
    } catch {
      return json(res, 500, { error: 'Could not process order right now.' });
    }
  }

  return serveStatic(res, pathname);
});

server.listen(PORT, () => {
  console.log(`Golf shop running at http://localhost:${PORT}`);
});
