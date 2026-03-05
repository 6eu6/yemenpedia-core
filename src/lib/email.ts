/**
 * Email Service - Resend Integration
 * 
 * Handles all system emails:
 * - Password reset
 * - Email verification
 * - Welcome emails
 * - Notifications
 */

import type { ReactElement } from 'react'
import { render } from '@react-email/components'

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured - email not sent')
    return { success: false, error: 'Email service not configured' }
  }

  const fromEmail = options.from || process.env.EMAIL_FROM || 'noreply@yemenpedia.org'
  const to = Array.isArray(options.to) ? options.to : [options.to]

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend API error:', error)
      return { success: false, error: 'Failed to send email' }
    }

    const data = await response.json()
    return { success: true, messageId: data.id }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Render React email component to HTML
 */
export function renderEmail(component: ReactElement): { html: string; text: string } {
  const html = render(component)
  // Simple text extraction - remove HTML tags
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  return { html, text }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  resetUrl: string
): Promise<EmailResult> {
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إعادة تعيين كلمة المرور</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px;">
    <h1 style="color: #18181b; text-align: center; margin-bottom: 30px;">يمنبيديا</h1>
    <p style="color: #3f3f46; font-size: 16px; line-height: 1.6;">مرحباً،</p>
    <p style="color: #3f3f46; font-size: 16px; line-height: 1.6;">لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. اضغط على الزر أدناه لإنشاء كلمة مرور جديدة:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}?token=${resetToken}" style="background: #18181b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px;">إعادة تعيين كلمة المرور</a>
    </div>
    <p style="color: #71717a; font-size: 14px; line-height: 1.6;">هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد.</p>
    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;">
    <p style="color: #a1a1aa; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} يمنبيديا - الموسوعة الوطنية لليمن</p>
  </div>
</body>
</html>
  `

  return sendEmail({
    to: email,
    subject: 'إعادة تعيين كلمة المرور - يمنبيديا',
    html,
    text: `لإعادة تعيين كلمة المرور، افتح هذا الرابط: ${resetUrl}?token=${resetToken}`
  })
}

/**
 * Send email verification
 */
export async function sendVerificationEmail(
  email: string,
  verifyToken: string,
  verifyUrl: string
): Promise<EmailResult> {
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد البريد الإلكتروني</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px;">
    <h1 style="color: #18181b; text-align: center; margin-bottom: 30px;">يمنبيديا</h1>
    <p style="color: #3f3f46; font-size: 16px; line-height: 1.6;">مرحباً،</p>
    <p style="color: #3f3f46; font-size: 16px; line-height: 1.6;">شكراً لتسجيلك في يمنبيديا! يرجى تأكيد بريدك الإلكتروني بالضغط على الزر أدناه:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}?token=${verifyToken}" style="background: #18181b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px;">تأكيد البريد الإلكتروني</a>
    </div>
    <p style="color: #71717a; font-size: 14px; line-height: 1.6;">هذا الرابط صالح لمدة 24 ساعة.</p>
    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;">
    <p style="color: #a1a1aa; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} يمنبيديا - الموسوعة الوطنية لليمن</p>
  </div>
</body>
</html>
  `

  return sendEmail({
    to: email,
    subject: 'تأكيد البريد الإلكتروني - يمنبيديا',
    html,
    text: `لتأكيد بريدك الإلكتروني، افتح هذا الرابط: ${verifyUrl}?token=${verifyToken}`
  })
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<EmailResult> {
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مرحباً بك في يمنبيديا</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px;">
    <h1 style="color: #18181b; text-align: center; margin-bottom: 30px;">يمنبيديا</h1>
    <p style="color: #3f3f46; font-size: 16px; line-height: 1.6;">مرحباً ${name}،</p>
    <p style="color: #3f3f46; font-size: 16px; line-height: 1.6;">نرحب بانضمامك إلى مجتمع يمنبيديا! أنت الآن جزء من الموسوعة الوطنية لليمن.</p>
    <p style="color: #3f3f46; font-size: 16px; line-height: 1.6;">يمكنك الآن:</p>
    <ul style="color: #3f3f46; font-size: 16px; line-height: 1.8; padding-right: 20px;">
      <li>قراءة المقالات والاستفادة من المحتوى</li>
      <li>كتابة مقالات جديدة ومشاركة معرفتك</li>
      <li>التعليق والتفاعل مع المحتوى</li>
      <li>الحصول على شارات واكتساب نقاط</li>
    </ul>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://yemenpedia.org'}/dashboard" style="background: #18181b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px;">ابدأ الآن</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;">
    <p style="color: #a1a1aa; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} يمنبيديا - الموسوعة الوطنية لليمن</p>
  </div>
</body>
</html>
  `

  return sendEmail({
    to: email,
    subject: 'مرحباً بك في يمنبيديا!',
    html,
    text: `مرحباً ${name}، نرحب بانضمامك إلى يمنبيديا! ابدأ الآن: ${process.env.NEXT_PUBLIC_APP_URL || 'https://yemenpedia.org'}/dashboard`
  })
}

export const emailService = {
  send: sendEmail,
  render: renderEmail,
  sendPasswordReset: sendPasswordResetEmail,
  sendVerification: sendVerificationEmail,
  sendWelcome: sendWelcomeEmail,
}
