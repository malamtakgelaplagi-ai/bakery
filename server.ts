import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { serverStore } from './server/dataStore';
import { baileysManager } from './server/baileysService';
import {
  processBotMessage,
  showMainMenu,
  normalizePhoneNumber,
} from './src/services/whatsappBotService';
import { WhatsAppSession, WhatsAppMessageItem } from './src/types';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // CORS middleware for Vercel / cross-domain frontend communication
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // =========================================================================
  // REST API ENDPOINTS
  // =========================================================================

  // 1. Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'PUSAKA Bakery API & WhatsApp Webhook Engine',
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Business Profile Endpoints
  app.get('/api/business-profile', (req, res) => {
    const profile = serverStore.getBusinessProfile();
    res.json(profile);
  });

  app.put('/api/business-profile', (req, res) => {
    const updated = serverStore.updateBusinessProfile(req.body);
    res.json(updated);
  });

  // 3. Products Endpoints
  app.get('/api/products', (req, res) => {
    const activeOnly = req.query.status === 'active';
    const products = serverStore.getProducts(activeOnly);
    res.json(products);
  });

  app.get('/api/products/:id', (req, res) => {
    const product = serverStore.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  });

  // 4. Orders Endpoints
  app.get('/api/orders', (req, res) => {
    const orders = serverStore.getOrders();
    res.json(orders);
  });

  app.get('/api/orders/:id', (req, res) => {
    const order = serverStore.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  });

  app.post('/api/orders', (req, res) => {
    try {
      const orderData = req.body;
      if (!orderData || !orderData.items || orderData.items.length === 0) {
        return res.status(400).json({ error: 'Order items are required' });
      }
      const created = serverStore.createOrder(orderData);
      res.status(201).json(created);
    } catch (err: any) {
      console.error('Error creating order:', err);
      res.status(500).json({ error: err?.message || 'Failed to create order' });
    }
  });

  app.put('/api/orders/:id', (req, res) => {
    const updated = serverStore.updateOrderStatus(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(updated);
  });

  // 5. Customers Endpoints
  app.get('/api/customers', (req, res) => {
    const customers = serverStore.getCustomers();
    res.json(customers);
  });

  // 6. WhatsApp Sessions Management
  app.get('/api/whatsapp/sessions', (req, res) => {
    const sessions = serverStore.getWhatsAppSessions();
    res.json(sessions);
  });

  // 7. WhatsApp Simulator API
  app.post('/api/whatsapp/simulate', (req, res) => {
    try {
      const { phone, text, payload, name } = req.body;
      const cleanPhone = normalizePhoneNumber(phone || '081298765432');

      let session = serverStore.getWhatsAppSessionByPhone(cleanPhone);
      const profile = serverStore.getBusinessProfile();
      const products = serverStore.getProducts(true);

      if (!session) {
        session = {
          id: `sess-${cleanPhone}`,
          customerPhone: cleanPhone,
          customerName: name || 'Pelanggan WhatsApp',
          currentStep: 'MAIN_MENU',
          isHumanHandled: false,
          lastMessageTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          messages: [showMainMenu({ id: '', customerPhone: cleanPhone, customerName: name || 'Pelanggan', currentStep: 'MAIN_MENU', isHumanHandled: false, lastMessageTime: '', messages: [] }, profile).replyMessage!],
        };
      }

      const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      // Append user message
      const userMsg: WhatsAppMessageItem = {
        id: `msg-user-${Date.now()}`,
        sender: 'user',
        text: text || (payload ? `[Pilih: ${payload}]` : ''),
        timestamp: timeNow,
      };
      session.messages.push(userMsg);
      session.lastMessageTime = timeNow;

      // Process state machine
      const result = processBotMessage(session, text || '', payload || null, products, profile);

      let createdOrder = null;
      if (result.orderToCreate) {
        createdOrder = serverStore.createOrder(result.orderToCreate);
      }

      if (result.replyMessage) {
        result.session.messages.push(result.replyMessage);
        result.session.lastMessageTime = timeNow;
      }

      serverStore.saveWhatsAppSession(result.session);

      res.json({
        reply: result.replyMessage,
        replyText: result.replyText,
        session: result.session,
        orderCreated: createdOrder,
      });
    } catch (err: any) {
      console.error('Simulation error:', err);
      res.status(500).json({ error: err?.message || 'Simulation failed' });
    }
  });

  // =========================================================================
  // 8. BAILEYS DIRECT WHATSAPP INTEGRATION (OPEN SOURCE & FREE SCAN QR)
  // =========================================================================
  app.get('/api/baileys/status', (req, res) => {
    try {
      res.json(baileysManager.getStatus());
    } catch (e: any) {
      res.status(200).json({
        status: 'DISCONNECTED',
        qrCodeUrl: null,
        rawQr: null,
        connectedPhone: null,
        connectedName: null,
        lastConnectedTime: null,
        lastErrorMessage: e?.message || null,
      });
    }
  });

  app.post('/api/baileys/connect', async (req, res) => {
    try {
      const status = await baileysManager.startConnection();
      res.json(status);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Gagal memulai koneksi' });
    }
  });

  app.post('/api/baileys/disconnect', async (req, res) => {
    try {
      const status = await baileysManager.disconnect();
      res.json(status);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Gagal memutuskan koneksi' });
    }
  });

  app.post('/api/baileys/send-test', async (req, res) => {
    try {
      const { phone, message } = req.body;
      if (!phone || !message) {
        return res.status(400).json({ error: 'Nomor telepon dan pesan wajib diisi' });
      }
      await baileysManager.sendDirectMessage(phone, message);
      res.json({ success: true, message: 'Pesan berhasil dikirim via Baileys!' });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'Gagal mengirim pesan' });
    }
  });

  // =========================================================================
  // 8. LIVE WHATSAPP WEBHOOK (FONNTE / CLOUD GATEWAY)
  // Supports: /api/webhook/whatsapp and /webhook/whatsapp
  // =========================================================================
  const handleWhatsAppWebhook = async (req: express.Request, res: express.Response) => {
    try {
      const sender = req.body.sender || req.body.from || req.body.phone;
      const message = req.body.message || req.body.text || '';
      const buttonPayload = req.body.button_postback || req.body.payload || null;
      const customerName = req.body.name || req.body.pushName || 'Pelanggan';

      if (!sender) {
        return res.status(200).json({ status: 'ignored_no_sender' });
      }

      const cleanSender = normalizePhoneNumber(sender);
      const profile = serverStore.getBusinessProfile();
      const activeProducts = serverStore.getProducts(true);

      // 1. Get or create session
      let session = serverStore.getWhatsAppSessionByPhone(cleanSender);
      if (!session) {
        session = {
          id: `sess-${cleanSender}`,
          customerPhone: cleanSender,
          customerName,
          currentStep: 'MAIN_MENU',
          isHumanHandled: false,
          lastMessageTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          messages: [],
        };
      }

      const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

      // Save user incoming message
      const userMsg: WhatsAppMessageItem = {
        id: `msg-in-${Date.now()}`,
        sender: 'user',
        text: message || (buttonPayload ? `[Payload: ${buttonPayload}]` : ''),
        timestamp: timeNow,
      };
      session.messages.push(userMsg);
      session.lastMessageTime = timeNow;

      // 2. Human handoff check
      if (session.isHumanHandled) {
        const cleanInput = String(buttonPayload || message || '').trim().toLowerCase();
        if (cleanInput === '0' || cleanInput === 'menu' || cleanInput === 'kembali' || cleanInput === 'menu utama') {
          session.isHumanHandled = false;
          session.currentStep = 'MAIN_MENU';
        } else {
          serverStore.saveWhatsAppSession(session);
          return res.status(200).json({
            status: 'human_handled',
            message: 'Percakapan sedang ditangani langsung oleh Admin (Zero AI)',
          });
        }
      }

      // 3. Process Deterministic 4-Menu State Machine
      const result = processBotMessage(session, message, buttonPayload, activeProducts, profile);

      // 4. Create Order on SaaS Backend if confirmed
      let createdOrder = null;
      if (result.orderToCreate) {
        createdOrder = serverStore.createOrder(result.orderToCreate);
        console.log(`[WhatsApp Webhook] Order created: ${createdOrder.invoiceNumber} for ${cleanSender}`);
      }

      if (result.replyMessage) {
        result.session.messages.push(result.replyMessage);
        result.session.lastMessageTime = timeNow;
      }

      // Save updated session
      serverStore.saveWhatsAppSession(result.session);

      // 5. Send WhatsApp Message via Fonnte Gateway if configured
      const fonnteToken = process.env.FONNTE_API_TOKEN || profile.whatsappGatewayApiKey;
      if (
        result.shouldReply !== false &&
        result.replyText &&
        fonnteToken &&
        fonnteToken.trim().length > 10 &&
        !fonnteToken.includes('YOUR_')
      ) {
        try {
          const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: fonnteToken.trim(),
            },
            body: JSON.stringify({
              target: cleanSender,
              message: result.replyText,
              countryCode: '62',
            }),
          });
          const fonnteData = await response.json();
          console.log('[Fonnte API Response]:', fonnteData);
        } catch (fErr) {
          console.error('Failed to send message via Fonnte:', fErr);
        }
      }

      return res.status(200).json({
        status: 'success',
        reply: result.replyText,
        order: createdOrder,
      });
    } catch (err: any) {
      console.error('Webhook error:', err);
      return res.status(500).json({ error: err?.message || 'Webhook processing failed' });
    }
  };

  app.post('/api/webhook/whatsapp', handleWhatsAppWebhook);
  app.post('/webhook/whatsapp', handleWhatsAppWebhook);

  // =========================================================================
  // VITE & STATIC SERVING
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` PUSAKA Bakery Full-Stack Server Running on Port ${PORT}`);
    console.log(` - REST API: http://localhost:${PORT}/api/products`);
    console.log(` - Profile API: http://localhost:${PORT}/api/business-profile`);
    console.log(` - Orders API: http://localhost:${PORT}/api/orders`);
    console.log(` - WhatsApp Webhook: http://localhost:${PORT}/api/webhook/whatsapp`);
    console.log(`=======================================================`);
  });

  // Graceful shutdown on SIGTERM / SIGINT
  const handleShutdown = (signal: string) => {
    console.log(`Received ${signal}. Shutting down server gracefully...`);
    server.close(() => {
      console.log('HTTP server closed successfully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
