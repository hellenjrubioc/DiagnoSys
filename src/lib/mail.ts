import { Resend } from "resend";
import ResetPasswordEmail from "@/emails/ResetPasswordEmail";

function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error("RESEND_API_KEY must be defined");
    }
    return new Resend(apiKey);
}

export async function sendResetEmail(to: string, name: string, link: string) {
    const resend = getResendClient();
    // Nos aseguramos que el "to" esté en formato válido
    // const formattedTo = `${name} <${to}>`;
    try {
        const data = await resend.emails.send({
            from: "Resend <onboarding@resend.dev>", // Cambiar por tu email verificado en Resend
            to: to,
            subject: "Reset your password",
            react: ResetPasswordEmail({
                userFirstname: name,
                resetPasswordLink: link,
            }),
        });

        // Log para confirmar si se envió correctamente
        console.log("Email sent successfully:", data);
        return data;
    } catch (error) {
        // Log del error si algo falla
        console.error("Error sending email:", error);
        throw error;
    }
}
