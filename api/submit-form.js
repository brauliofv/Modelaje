// ===== INICIO: api/submit-form.js =====

// Importamos el cliente de Notion
const { Client } = require('@notionhq/client');

// Exportamos la función que Vercel ejecutará
module.exports = async (req, res) => {
    // Habilitamos CORS para permitir peticiones desde nuestro sitio web
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Vercel necesita manejar una petición pre-vuelo 'OPTIONS'
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // --- Lógica del formulario (la misma que teníamos) ---
    const { name, email, phone, asunto, mensaje } = req.body;

    if (!name || !email || !mensaje) {
        return res.status(400).json({ message: "Por favor, completa los campos requeridos." });
    }

    // Inicializamos Notion DENTRO de la función, usando las variables de entorno de Vercel
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

        res.status(200).json({ message: "Formulario enviado con éxito. Gracias por contactarme." });

    } catch (error) {
        console.error("Error en la función de Vercel:", error);
        res.status(500).json({ message: "Ocurrió un error al procesar tu solicitud." });
    }
};

// ===== FIN: api/submit-form.js =====