import { NextResponse } from 'next/server';
import transporter from '@/lib/nodemailer';

export async function POST(request: Request) {
  try {
    const { to, subject, html, text } = await request.json();

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Recipient(to), subject, and content(html/text) are required' },
        { status: 400 }
      );
    }

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'EduLink Cameroon'}" <${process.env.SMTP_FROM_EMAIL || 'edulinkcameroon@gmail.com'}>`,
      to,
      subject,
      text: text || '',
      html: html || '',
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error: any) {
    console.error('Frontend Email API Error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}
