import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail(email: string, token: string, orgName: string) {
  await resend.emails.send({
    from: "onboarding@yourdomain.com",
    to: email,
    subject: `You're invited to join ${orgName}`,
    html: `<p>Click <a href="${process.env.NEXT_PUBLIC_APP_URL}/org/join?token=${token}">here</a> to accept your invite.</p>`,
  });
}