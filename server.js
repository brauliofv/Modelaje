// ===== INICIO: server.js =====

// --- 1. IMPORTACIÓN DE MÓDULOS ---
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Client } = require('@notionhq/client'); // Módulo de Notion añadido

// --- 2. CONFIGURACIÓN INICIAL DEL SERVIDOR ---
const app = express();
const PORT = 3000;

// ===== INICIO: CONFIGURACIÓN DE NOTION =====
// Inicializamos el cliente de Notion con las credenciales para el formulario
const notion = new Client({ auth: process.env.NOTION_KEY_CONTACT });
const databaseId = process.env.NOTION_DATABASE_ID_CONTACTO;
// ===== FIN: CONFIGURACIÓN DE NOTION =====

// --- 3. MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- 4. RUTA DE PRUEBA ---
app.get('/', (req, res) => {
    res.send('El servidor de contacto está funcionando correctamente.');
});

// ===== INICIO: RUTA PARA EL FORMULARIO =====
// Esta es la ruta que recibirá los datos del formulario de contacto
app.post('/submit-form', async (req, res) => {
    // Extraemos los datos del cuerpo de la petición (enviados desde el frontend)
    const { name, email, phone, asunto, mensaje } = req.body;

    // Verificación básica de que los datos llegaron
    if (!name || !email || !mensaje) {
        return res.status(400).json({ message: "Por favor, completa los campos requeridos." });
    }

    try {
        console.log("Recibiendo datos del formulario:", req.body); // Para depuración

        // Creamos una nueva página (fila) en la base de datos de Notion
        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                // IMPORTANTE: Los nombres aquí ("Name", "email", etc.) deben coincidir EXACTAMENTE
                // con los nombres de las propiedades en tu base de datos de Notion.
                "Name": {
                    title: [{ text: { content: name } }]
                },
                "email": {
                    email: email
                },
                "phone": {
                    // La API de Notion espera un número para el tipo de propiedad 'Number'
                    phone_number: phone || null
                },
                "asunto": {
                    rich_text: [{ text: { content: asunto || "" } }]
                },
                "mensaje": {
                    rich_text: [{ text: { content: mensaje } }]
                }
            }
        });

        console.log("Éxito: Datos guardados en Notion.");
        // Enviamos una respuesta de éxito al frontend
        res.status(200).json({ message: "Formulario enviado con éxito. Gracias por contactarme." });

    } catch (error) {
        console.error("Error al guardar en Notion:", error.body); // Mostramos el error de la API de Notion
        // Enviamos una respuesta de error al frontend
        res.status(500).json({ message: "Ocurrió un error al procesar tu solicitud. Por favor, intenta más tarde." });
    }
});
// ===== FIN: RUTA PARA EL FORMULARIO =====

// --- 6. INICIAR EL SERVIDOR ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});

// ===== FIN: server.js =====