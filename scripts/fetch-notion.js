// ===== INICIO DE fetch-notion.js =====

// 1. IMPORTACIÓN DE LIBRERÍAS
// -----------------------------------------------------------------------------
const { Client } = require("@notionhq/client"); // Cliente oficial de Notion
const { NotionToMarkdown } = require("notion-to-md"); // Librería para convertir bloques de Notion a Markdown
const Showdown = require('showdown'); // Librería para convertir Markdown a HTML
const fs = require('fs'); // Módulo de Node.js para interactuar con el sistema de archivos (crear carpetas, archivos, etc.)
const path = require('path'); // Módulo para manejar rutas de archivos
require("dotenv").config(); // Carga las variables del archivo .env (NOTION_KEY, NOTION_DATABASE_ID)

// 2. CONFIGURACIÓN INICIAL
// -----------------------------------------------------------------------------
// Inicializamos el cliente de Notion con la API Key
const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// Inicializamos el convertidor de Markdown a HTML
const converter = new Showdown.Converter();

// Inicializamos el convertidor de Notion a Markdown
const n2m = new NotionToMarkdown({ notionClient: notion });

// Ruta base donde se guardarán los posts
const postsDir = path.join(__dirname, '..', 'assets', 'posts');

// 3. FUNCIÓN PRINCIPAL ASÍNCRONA (main)
// -----------------------------------------------------------------------------
async function main() {
    console.log("🚀 Iniciando la obtención de posts desde Notion...");

    try {
        // --- PASO A: OBTENER POSTS PUBLICADOS DE LA BASE DE DATOS ---
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: "Status", // Filtramos por la propiedad 'Status'
                status: {
                    equals: "Published", // Solo los que tengan el status 'Published'
                },
            },
            sorts: [ // Opcional: Ordenar los posts por fecha de creación descendente
                {
                    timestamp: 'created_time',
                    direction: 'descending',
                },
            ],
        });
        
        console.log(`✅ Se encontraron ${response.results.length} posts publicados.`);

        // Limpiar el directorio de posts antiguos para empezar de cero
        if (fs.existsSync(postsDir)) {
            fs.rmSync(postsDir, { recursive: true, force: true });
        }
        fs.mkdirSync(postsDir, { recursive: true });

        const postSlugs = [];

        // --- PASO B: PROCESAR CADA POST INDIVIDUALMENTE ---
        for (const page of response.results) {
            // Extraer propiedades de la página
            const title = page.properties.Title.title[0]?.plain_text || 'Sin Título';
            const slug = page.properties.Slug.rich_text[0]?.plain_text;
            const topic = page.properties.Topic.select?.name || 'General';
            const tags = page.properties.Tags.multi_select.map(tag => tag.name).join(', ');

            // Comprobar si el slug existe, si no, saltamos este post
            if (!slug) {
                console.warn(`⚠️ Post "${title}" omitido por no tener un Slug.`);
                continue;
            }
            
            postSlugs.push(slug);
            console.log(`⏳ Procesando post: ${title}`);

            // Obtener la URL de la imagen de portada (Prioridad 1: Page Cover)
let coverImageUrl = page.cover?.external?.url || page.cover?.file?.url || '';
let coverImageFileName = '';

// Si NO hay Page Cover, buscar la primera imagen en el contenido (Prioridad 2)
if (!coverImageUrl) {
    const pageContent = await notion.blocks.children.list({ block_id: page.id });
    const firstImageBlock = pageContent.results.find(block => block.type === 'image');
    if (firstImageBlock) {
        coverImageUrl = firstImageBlock.image?.external?.url || firstImageBlock.image?.file?.url;
    }
}

            // Crear el directorio para este post
            const postPath = path.join(postsDir, slug);
            fs.mkdirSync(postPath, { recursive: true });

            // Descargar la imagen de portada si existe
            if (coverImageUrl) {
                try {
                    const imageResponse = await fetch(coverImageUrl);
                    const arrayBuffer = await imageResponse.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const extension = path.extname(new URL(coverImageUrl).pathname) || '.jpg';
                    coverImageFileName = `cover${extension}`;
                    fs.writeFileSync(path.join(postPath, coverImageFileName), buffer);
                } catch (imgError) {
                    console.error(`❌ Error al descargar imagen de portada para "${title}":`, imgError);
                    coverImageFileName = ''; // Reseteamos si hay error
                }
            }
            
           // --- PASO C: OBTENER Y CONVERTIR EL CONTENIDO DEL POST (MÉTODO BLOQUE-POR-BLOQUE) ---
const pageContent = await notion.blocks.children.list({ block_id: page.id });
const finalHtmlBlocks = [];

for (const block of pageContent.results) {
    // 1. Manejo especial para bloques de audio
    if (block.type === 'audio' && block.audio.type === 'file') {
        try {
            const notionUrl = block.audio.file.url;
            const caption = path.basename(new URL(notionUrl).pathname);
            
            console.log(`      Downloading audio: ${caption}`);
            const audioResponse = await fetch(notionUrl);
            const arrayBuffer = await audioResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            const audioFileName = caption.replace(/[^a-z0-9_.-]/gi, '_');
            const localAudioPath = path.join(postPath, audioFileName);
            fs.writeFileSync(localAudioPath, buffer);
            
            const localSrc = `assets/posts/${slug}/${audioFileName}`;
            const audioTag = `<audio controls class="audio-player" src="${localSrc}"></audio>`;
            finalHtmlBlocks.push(audioTag);
        } catch (audioError) {
            console.error(`      ❌ Error al descargar audio:`, audioError);
            finalHtmlBlocks.push(`<p><em>Error al cargar audio.</em></p>`);
        }
    }
    // 2. Manejo para el resto de los bloques
    else {
        try {
            // Convertimos este bloque individual a HTML, pasándolo como un array de un solo elemento
            const mdblocks = await n2m.blocksToMarkdown([block]);
            const mdString = n2m.toMarkdownString(mdblocks);
            if (mdString.parent) {
                finalHtmlBlocks.push(converter.makeHtml(mdString.parent));
            }
        } catch (err) {
            // Si la librería no puede convertir un bloque, lo ignoramos para no detener todo el proceso
            console.warn(`      ⚠️ No se pudo convertir un bloque de tipo '${block.type}'. Omitiendo.`);
        }
    }
}

// 3. Unimos todas las piezas de HTML en el contenido final
const htmlContent = finalHtmlBlocks.join('\n');
// ...

            // Crear el contenido del archivo content.html con los metadatos
            const finalHtml = `<!-- METADATOS PARA EL BLOG -->
<meta name="title" content="${title}">
<meta name="topic" content="${topic}">
<meta name="tags" content="${tags}">
<meta name="cover" content="${coverImageFileName}">

<!-- CONTENIDO DEL POST -->
${htmlContent}
`;
            // Guardar el archivo content.html
            fs.writeFileSync(path.join(postPath, 'content.html'), finalHtml);
        }

        // --- PASO D: CREAR EL ARCHIVO DE ÍNDICE (posts-index.json) ---
        const indexPath = path.join(__dirname, '..', 'posts-index.json');
        fs.writeFileSync(indexPath, JSON.stringify(postSlugs, null, 2));
        
        console.log("\n🎉 ¡Proceso completado con éxito!");
        console.log(`✅ Se ha generado el índice 'posts-index.json' y ${postSlugs.length} posts en 'assets/posts/'.`);

    } catch (error) {
        console.error("❌ Ocurrió un error al obtener los posts de Notion:", error);
    }
}

// 4. EJECUCIÓN DE LA FUNCIÓN PRINCIPAL
// -----------------------------------------------------------------------------
main();

// ===== FIN DE fetch-notion.js =====