import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { Boom } from '@hapi/boom';
import { serverStore } from './dataStore';
import { processBotMessage, showMainMenu, normalizePhoneNumber } from '../src/services/whatsappBotService';
import { WhatsAppMessageItem, WhatsAppSession } from '../src/types';

export type BaileysConnectionState = 'DISCONNECTED' | 'SCAN_QR' | 'CONNECTING' | 'CONNECTED';

export interface BaileysStatus {
  status: BaileysConnectionState;
  qrCodeUrl: string | null;
  rawQr: string | null;
  connectedPhone: string | null;
  connectedName: string | null;
  lastConnectedTime: string | null;
  lastErrorMessage: string | null;
}

const AUTH_DIR = path.join(process.cwd(), 'data', 'baileys_auth');

class BaileysManager {
  private sock: WASocket | null = null;
  private status: BaileysConnectionState = 'DISCONNECTED';
  private qrCodeUrl: string | null = null;
  private rawQr: string | null = null;
  private connectedPhone: string | null = null;
  private connectedName: string | null = null;
  private lastConnectedTime: string | null = null;
  private lastErrorMessage: string | null = null;
  private isInitializing = false;

  constructor() {
    // Ensure data directory exists
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
  }

  public getStatus(): BaileysStatus {
    return {
      status: this.status,
      qrCodeUrl: this.qrCodeUrl,
      rawQr: this.rawQr,
      connectedPhone: this.connectedPhone,
      connectedName: this.connectedName,
      lastConnectedTime: this.lastConnectedTime,
      lastErrorMessage: this.lastErrorMessage,
    };
  }

  public async startConnection(): Promise<BaileysStatus> {
    if (this.status === 'CONNECTED' && this.sock) {
      return this.getStatus();
    }

    if (this.isInitializing) {
      return this.getStatus();
    }

    this.isInitializing = true;
    this.status = 'CONNECTING';
    this.lastErrorMessage = null;

    try {
      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['PUSAKA Bakery OS', 'Chrome', '1.0.0'],
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.rawQr = qr;
          this.status = 'SCAN_QR';
          try {
            this.qrCodeUrl = await QRCode.toDataURL(qr, {
              margin: 2,
              width: 300,
              color: {
                dark: '#292524',
                light: '#ffffff',
              },
            });
          } catch (qrErr) {
            console.error('Failed to generate QR Data URL:', qrErr);
          }
        }

        if (connection === 'close') {
          const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = reason !== DisconnectReason.loggedOut;
          
          this.connectedPhone = null;
          this.connectedName = null;
          this.qrCodeUrl = null;
          this.rawQr = null;

          if (shouldReconnect) {
            this.status = 'CONNECTING';
            this.lastErrorMessage = 'Koneksi terputus sesaat, mencoba menghubungkan kembali...';
            setTimeout(() => {
              this.isInitializing = false;
              this.startConnection();
            }, 3000);
          } else {
            this.status = 'DISCONNECTED';
            this.lastErrorMessage = 'Sesi telah keluar (Logged Out). Silakan klik Sambungkan & Scan QR kembali.';
            this.clearAuthData();
            this.isInitializing = false;
          }
        } else if (connection === 'open') {
          this.status = 'CONNECTED';
          this.qrCodeUrl = null;
          this.rawQr = null;
          this.lastErrorMessage = null;
          this.lastConnectedTime = new Date().toISOString();

          // Extract connected user info
          if (this.sock?.user) {
            const rawId = this.sock.user.id || '';
            const phone = rawId.split(':')[0] || rawId.split('@')[0];
            this.connectedPhone = phone;
            this.connectedName = this.sock.user.name || 'Nomor Toko PUSAKA';
          }
          this.isInitializing = false;
        }
      });

      // Handle Incoming Messages
      this.sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
          // Ignore messages sent by the bot itself or broadcast/status updates
          if (!msg.message || msg.key.fromMe) continue;
          const from = msg.key.remoteJid;
          if (!from || from.includes('@broadcast') || from.includes('@newsletter')) continue;

          // Extract message text
          const incomingText =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.buttonsResponseMessage?.selectedDisplayText ||
            msg.message.buttonsResponseMessage?.selectedButtonId ||
            msg.message.templateButtonReplyMessage?.selectedId ||
            msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
            '';

          if (!incomingText && !msg.message.imageMessage?.caption) continue;
          const text = incomingText || msg.message.imageMessage?.caption || '';

          const senderNumber = from.replace(/[^0-9]/g, '');
          const customerPushName = msg.pushName || 'Pelanggan';

          await this.handleIncomingUserMessage(from, senderNumber, customerPushName, text);
        }
      });

      return this.getStatus();
    } catch (err: any) {
      console.error('Failed to init Baileys socket:', err);
      this.status = 'DISCONNECTED';
      this.lastErrorMessage = err?.message || 'Gagal memulai koneksi WhatsApp';
      this.isInitializing = false;
      return this.getStatus();
    }
  }

  private async handleIncomingUserMessage(
    remoteJid: string,
    senderNumber: string,
    customerName: string,
    text: string
  ) {
    try {
      const cleanSender = normalizePhoneNumber(senderNumber);
      const profile = serverStore.getBusinessProfile();
      const activeProducts = serverStore.getProducts(true);

      // 1. Get or create session in store
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

      // Append user's incoming message
      const userMsg: WhatsAppMessageItem = {
        id: `msg-in-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: timeNow,
      };
      session.messages.push(userMsg);
      session.lastMessageTime = timeNow;

      // 2. Check if currently handled by human admin
      if (session.isHumanHandled) {
        const cleanInput = text.trim().toLowerCase();
        if (cleanInput === '0' || cleanInput === 'menu' || cleanInput === 'kembali' || cleanInput === 'menu utama') {
          session.isHumanHandled = false;
          session.currentStep = 'MAIN_MENU';
        } else {
          serverStore.saveWhatsAppSession(session);
          // Human handled -> Bot stays completely quiet (Zero AI)
          return;
        }
      }

      // 3. Process Deterministic 4-Menu State Machine
      const result = processBotMessage(session, text, null, activeProducts, profile);

      // 4. Create Order on SaaS Backend if confirmed
      if (result.orderToCreate) {
        const createdOrder = serverStore.createOrder(result.orderToCreate);
        console.log(`[Baileys Engine] Order dibuat dari WA: ${createdOrder.invoiceNumber} (${cleanSender})`);
      }

      // Append bot's reply message to history
      if (result.replyMessage) {
        result.session.messages.push(result.replyMessage);
        result.session.lastMessageTime = timeNow;
      }

      // Save session
      serverStore.saveWhatsAppSession(result.session);

      // 5. Send WhatsApp Message back to user directly via Baileys socket
      if (result.shouldReply !== false && result.replyText && this.sock) {
        await this.sock.sendMessage(remoteJid, {
          text: result.replyText,
        });
      }
    } catch (msgErr) {
      console.error('Error handling message in Baileys:', msgErr);
    }
  }

  public async disconnect(): Promise<BaileysStatus> {
    try {
      if (this.sock) {
        try {
          await this.sock.logout();
        } catch (e) {
          // ignore
        }
        this.sock.end(undefined);
        this.sock = null;
      }
      this.clearAuthData();
      this.status = 'DISCONNECTED';
      this.qrCodeUrl = null;
      this.rawQr = null;
      this.connectedPhone = null;
      this.connectedName = null;
      this.lastErrorMessage = null;
      return this.getStatus();
    } catch (err: any) {
      this.status = 'DISCONNECTED';
      return this.getStatus();
    }
  }

  private clearAuthData() {
    try {
      if (fs.existsSync(AUTH_DIR)) {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      }
    } catch (e) {
      console.error('Error clearing auth dir:', e);
    }
  }

  public async sendDirectMessage(phone: string, text: string): Promise<boolean> {
    if (!this.sock || this.status !== 'CONNECTED') {
      throw new Error('WhatsApp belum tersambung. Silakan scan QR terlebih dahulu.');
    }
    const clean = normalizePhoneNumber(phone);
    const jid = `${clean}@s.whatsapp.net`;
    await this.sock.sendMessage(jid, { text });
    return true;
  }
}

export const baileysManager = new BaileysManager();
