import net from 'node:net';
import tls from 'node:tls';
import type { Socket } from 'node:net';

class SMTPChannel {
  private socket: Socket | tls.TLSSocket;
  private buffer = '';
  private lines: string[] = [];
  private waiting: Array<(line: string) => void> = [];
  private onData = (chunk: Buffer) => {
    this.buffer += chunk.toString('utf8');
    let boundary = this.buffer.indexOf('\r\n');
    while (boundary >= 0) {
      const line = this.buffer.slice(0, boundary);
      this.buffer = this.buffer.slice(boundary + 2);
      const waiter = this.waiting.shift();
      if (waiter) waiter(line); else this.lines.push(line);
      boundary = this.buffer.indexOf('\r\n');
    }
  };

  constructor(socket: Socket | tls.TLSSocket) { this.socket = socket; this.attach(socket); }
  private attach(socket: Socket | tls.TLSSocket) { this.socket = socket; socket.on('data', this.onData); }
  async readLine(): Promise<string> {
    const line = this.lines.shift();
    if (line !== undefined) return line;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.waiting = this.waiting.filter((item) => item !== receive); reject(new Error('SMTP response timed out.')); }, 15000);
      const receive = (value: string) => { clearTimeout(timer); resolve(value); };
      this.waiting.push(receive);
    });
  }
  async response(): Promise<string[]> {
    const result: string[] = [];
    for (;;) {
      const line = await this.readLine();
      result.push(line);
      if (/^\d{3} /.test(line)) {
        if (!/^[23]\d\d /.test(line)) throw new Error(`SMTP server rejected the message (${line.slice(0, 3)}).`);
        return result;
      }
    }
  }
  async command(value: string) { this.socket.write(`${value}\r\n`); return this.response(); }
  async data(value: string) {
    await new Promise<void>((resolve, reject) => this.socket.write(value, (error) => error ? reject(error) : resolve()));
    return this.response();
  }
  upgrade(host: string): Promise<void> {
    const previous = this.socket;
    previous.removeListener('data', this.onData);
    this.buffer = ''; this.lines = [];
    return new Promise((resolve, reject) => {
      const secure = tls.connect({ socket: previous, servername: host });
      secure.once('secureConnect', () => { this.attach(secure); resolve(); });
      secure.once('error', reject);
    });
  }
  close() { this.socket.end(); }
}

function cleanAddress(value: string) {
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value) || /[\r\n]/.test(value)) throw new Error('Invalid SMTP email address configuration.');
  return value;
}

export async function sendSupportEmail(input: { ticketId: string; name: string; email: string; phone: string; topic: string; orderId: string; message: string }) {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  if (!host || !user || !password) return false;
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid SMTP port configuration.');
  const secure = process.env.SMTP_SECURE?.toLowerCase() === 'true';
  const from = cleanAddress(process.env.SMTP_FROM?.trim() || user);
  const to = cleanAddress(process.env.SUPPORT_EMAIL?.trim() || 'support@fabbazaar.com');
  const socket = secure ? tls.connect({ host, port, servername: host }) : net.createConnection({ host, port });
  socket.setTimeout(20000, () => socket.destroy(new Error('SMTP connection timed out.')));
  await new Promise<void>((resolve, reject) => {
    const readyEvent = secure ? 'secureConnect' : 'connect';
    socket.once(readyEvent, resolve);
    socket.once('error', reject);
  });
  const smtp = new SMTPChannel(socket);
  try {
    await smtp.response();
    const hello = await smtp.command('EHLO fabbazaar.local');
    if (!secure) {
      if (!hello.some((line) => /^\d{3}[- ]STARTTLS$/i.test(line))) throw new Error('The SMTP server does not offer STARTTLS.');
      await smtp.command('STARTTLS');
      await smtp.upgrade(host);
      await smtp.command('EHLO fabbazaar.local');
    }
    await smtp.command('AUTH LOGIN');
    await smtp.command(Buffer.from(user).toString('base64'));
    await smtp.command(Buffer.from(password).toString('base64'));
    await smtp.command(`MAIL FROM:<${from}>`);
    await smtp.command(`RCPT TO:<${to}>`);
    await smtp.command('DATA');
    const subject = Buffer.from(`FabBazaar support ${input.ticketId} · ${input.topic}`).toString('base64');
    const body = [
      `Support ticket: ${input.ticketId}`,
      `Customer: ${input.name}`,
      `Reply to: ${input.email}`,
      `Phone: ${input.phone || 'Not provided'}`,
      `Topic: ${input.topic}`,
      `Order: ${input.orderId || 'Not provided'}`,
      '', input.message
    ].join('\r\n');
    const encodedBody = Buffer.from(body, 'utf8').toString('base64').match(/.{1,76}/g)?.join('\r\n') ?? '';
    await smtp.data(`From: FabBazaar Support <${from}>\r\nTo: <${to}>\r\nReply-To: <${cleanAddress(input.email)}>\r\nSubject: =?UTF-8?B?${subject}?=\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${encodedBody}\r\n.\r\n`);
    await smtp.command('QUIT');
    return true;
  } finally { smtp.close(); }
}
