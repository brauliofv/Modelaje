// ===== INICIO: api/submit-form.js (con Notion y Telegram) =====

// Importamos los clientes de Notion y Telegraf
const { Client } = require('@notionhq/client');
const { Telegraf } = require('telegraf');

// Exportamos la función que Vercel ejecutará
module.exports = async (req, res) => {
    // Habilitamos CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // --- 1. Lógica del formulario ---
    const { name, email, phone, asunto, mensaje } = req.body;

    if (!name || !email || !mensaje) {
        return res.status(400).json({ message: "Por favor, completa los campos requeridos." });
    }

    // --- 2. Guardar en Notion ---
    const notion = new Client({ auth: process.env.NOTION_KEY_CONTACT });
    const databaseId = process.env.NOTION_DATABASE_ID_CONTACTO;

    try {
        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                "Name": { title: [{ text: { content: name } }] },
                "email": { email: email },
                "phone": { phone_number: phone || null },
                "asunto": { rich_text: [{ text: { content: asunto || "" } }] },
                "mensaje": { rich_text: [{ text: { content: mensaje } }] }
            }
        });
        console.log("Éxito: Datos guardados en Notion.");

    } catch (error) {
        console.error("Error al guardar en Notion:", error);
        // Si Notion falla, detenemos todo y devolvemos un error.
        return res.status(500).json({ message: "Ocurrió un error al guardar en la base de datos." });
    }

    // ===== INICIO: ENVIAR NOTIFICACIÓN A TELEGRAM =====
    try {
        const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
        const chatId = process.env.TELEGRAM_CHAT_ID;

        // Construimos el mensaje con formato Markdown para que se vea bien
        const telegramMessage = `
*Formulario de CONTACTO* 📝

*Nombre:* ${name}
*Email:* ${email}
*Teléfono:* ${phone || 'No proporcionado'}
*Asunto:* ${asunto || 'No proporcionado'}

*Mensaje:*
${mensaje}
        `;

        // Enviamos el mensaje
        await bot.telegram.sendMessage(chatId, telegramMessage, { parse_mode: 'Markdown' });
        console.log("Éxito: Notificación enviada a Telegram.");

    } catch (error) {
        // IMPORTANTE: Si Telegram falla, no queremos que el usuario vea un error,
        // porque sus datos SÍ se guardaron. Solo lo registramos en el servidor.
        console.error("Error al enviar notificación a Telegram:", error);
    }
    // ===== FIN: ENVIAR NOTIFICACIÓN A TELEGRAM =====

    // --- 3. Devolver respuesta de éxito al usuario ---
    // Esta respuesta solo se envía si Notion tuvo éxito.
    res.status(200).json({ message: "Formulario enviado con éxito. Gracias por contactarme." });
};

// ===== FIN: api/submit-form.js =====