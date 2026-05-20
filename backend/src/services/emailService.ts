import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transport = env.smtpHost && env.smtpUser && env.smtpPass
  ? nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    })
  : null;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  if (!transport) {
    console.warn('[EmailService] SMTP not configured. Email not sent.', options);
    return null;
  }

  const mail = {
    from: env.smtpFrom,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  try {
    return await transport.sendMail(mail);
  } catch (err) {
    console.error('[EmailService] Failed to send email:', err);
    throw err;
  }
}

export async function sendOutbidPurchaseOffer(
  to: string,
  customerName: string,
  productName: string,
  offerPrice: number,
  auctionUrl: string
) {
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(offerPrice);

  const html = `
    <p>Hi ${customerName || 'Customer'},</p>
    <p>Great news — the auction for <strong>${productName}</strong> has ended.</p>
    <p>We are giving you a second chance to buy it at a special price of <strong>${formattedPrice}</strong>.</p>
    <p>This offer is reserved for the top bidders and may expire soon.</p>
    <p>
      <a href="${auctionUrl}" style="display:inline-block;padding:12px 18px;background:#ff9900;color:#111;text-decoration:none;border-radius:6px;">View Auction Offer</a>
    </p>
    <p>If you have any questions, please visit the auction page.</p>
  `;

  const text = `Hi ${customerName || 'Customer'},

The auction for ${productName} has ended.
You have a second chance to buy it at ${formattedPrice}.

Open the auction page: ${auctionUrl}
`;

  return sendEmail({
    to,
    subject: `Second chance purchase offer for ${productName}`,
    html,
    text,
  });
}

export async function sendAuctionWinnerNotification(
  to: string,
  customerName: string,
  productName: string,
  winningBid: number,
  auctionUrl: string
) {
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(winningBid);

  const html = `
    <p>Hi ${customerName || 'Customer'},</p>
    <p>Congratulations! You won the auction for <strong>${productName}</strong>!</p>
    <p>Your winning bid was <strong>${formattedPrice}</strong>.</p>
    <p>An order has been created for you. Please complete the payment to secure your purchase.</p>
    <p>
      <a href="${auctionUrl}" style="display:inline-block;padding:12px 18px;background:#ff9900;color:#111;text-decoration:none;border-radius:6px;">View Your Order</a>
    </p>
    <p>If you have any questions, please visit the auction page.</p>
  `;

  const text = `Hi ${customerName || 'Customer'},

Congratulations! You won the auction for ${productName}!
Your winning bid was ${formattedPrice}.

An order has been created for you. Please complete the payment to secure your purchase.

Open the auction page: ${auctionUrl}
`;

  return sendEmail({
    to,
    subject: `You won the auction for ${productName}!`,
    html,
    text,
  });
}
