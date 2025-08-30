// ===== INICIO DE fetch-notion.js (VERSIÓN CON RESOLUCIÓN DE ENLACES) =====

// 1. IMPORTACIÓN DE LIBRERÍAS
const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const Showdown = require('showdown');
const fs = require('fs');
const path = require('path');
require("dotenv").config();

// 2. CONFIGURACIÓN INICIAL
const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;
const converter = new Showdown.Converter();
const n2m = new NotionToMarkdown({ notionClient: notion });
const postsDir = path.join(__dirname, '..', 'assets', 'posts');

// 3. FUNCIÓN PRINCIPAL ASÍNCRONA (main)
async function main() {
    console.log("🚀 Iniciando la obtención de posts desde Notion...");

    try {
        // --- PASO A: OBTENER TODOS LOS POSTS PUBLICADOS DE LA BASE DE DATOS ---
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: { property: "Status", status: { equals: "Published" } },
            sorts: [{ timestamp: 'created_time', direction: 'descending' }],
        });
        
        console.log(`✅ Se encontraron ${response.results.length} posts publicados.`);

        // --- PASO B: CREAR UN MAPA DE ID -> SLUG PARA RESOLVER ENLACES INTERNOS ---
        console.log("🗺️  Creando mapa de slugs para enlaces internos...");
        const idToSlugMap = new Map();
        for (const page of response.results) {
            const pageId = page.id.replace(/-/g, ''); // Notion a veces usa IDs con o sin guiones
            const slug = page.properties.Slug.rich_text[0]?.plain_text;
            const title = page.properties.Title.title[0]?.plain_text;
            if (slug && title) {
                // Necesitamos el título para construir la URL final
                idToSlugMap.set(pageId, { slug, title });
            }
        }
        console.log(`🗺️  Mapa creado con ${idToSlugMap.size} entradas.`);

        // Limpiar directorio antiguo y prepararlo
        if (fs.existsSync(postsDir)) {
            fs.rmSync(postsDir, { recursive: true, force: true });
        }
        fs.mkdirSync(postsDir, { recursive: true });

        const postSlugs = [];

        // --- PASO C: PROCESAR CADA POST INDIVIDUALMENTE ---
        for (const page of response.results) {
            const title = page.properties.Title.title[0]?.plain_text || 'Sin Título';
            const slug = page.properties.Slug.rich_text[0]?.plain_text;
            const topic = page.properties.Topic.select?.name || 'General';
            const tags = page.properties.Tags.multi_select.map(tag => tag.name).join(', ');

            if (!slug) {
                console.warn(`⚠️ Post "${title}" omitido por no tener un Slug.`);
                continue;
            }
            
            postSlugs.push(slug);
            console.log(`⏳ Procesando post: ${title}`);

            const postPath = path.join(postsDir, slug);
            fs.mkdirSync(postPath, { recursive: true });

            // ... Lógica de imagen de portada (sin cambios) ...
            let coverImageUrl = page.cover?.external?.url || page.cover?.file?.url || '';
            let coverImageFileName = '';
            if (!coverImageUrl) {
                const pageContentForCover = await notion.blocks.children.list({ block_id: page.id, page_size: 5 }); // Buscamos solo en los primeros 5 bloques
                const firstImageBlock = pageContentForCover.results.find(block => block.type === 'image');
                if (firstImageBlock) {
                    coverImageUrl = firstImageBlock.image?.external?.url || firstImageBlock.image?.file?.url;
                }
            }
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
                    coverImageFileName = '';
                }
            }

            // --- PASO D: OBTENER Y CONVERTIR EL CONTENIDO DEL POST ---
            const pageContent = await notion.blocks.children.list({ block_id: page.id });
            const finalHtmlBlocks = [];
            // ... (el resto del código de procesamiento de bloques, con la corrección que ya funcionaba) ...
             
            for (const block of pageContent.results) {
    // 1. Manejo especial para bloques de audio (LA LÓGICA CORRECTA)
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
            finalHtmlBlocks.push(audioTag); // <--- AÑADIMOS EL AUDIO AL ARRAY
        } catch (audioError) {
            console.error(`      ❌ Error al descargar audio:`, audioError);
            finalHtmlBlocks.push(`<p><em>Error al cargar audio.</em></p>`);
        }
    }
    // 2. Manejo para el resto de los bloques
    else {
        try {
            const mdblocks = await n2m.blocksToMarkdown([block]);
            const mdString = n2m.toMarkdownString(mdblocks);
            if (mdString.parent) {
                finalHtmlBlocks.push(converter.makeHtml(mdString.parent));
            }
        } catch (err) {
            console.warn(`      ⚠️ No se pudo convertir un bloque de tipo '${block.type}'. Omitiendo.`);
        }
    }
}

            let htmlContent = finalHtmlBlocks.join('\n');


            // --- PASO E: REEMPLAZAR ENLACES INTERNOS ---
            const notionInternalLinkRegex = /<a href="\/([a-f0-9]{32})">/g;
            htmlContent = htmlContent.replace(notionInternalLinkRegex, (match, pageId) => {
                const linkedPost = idToSlugMap.get(pageId);
                if (linkedPost) {
                    console.log(`      🔗 Enlace interno resuelto a: "${linkedPost.title}"`);
                    const newUrl = `post.html?title=${encodeURIComponent(linkedPost.title)}`;
                    return `<a href="${newUrl}">`;
                }
                console.warn(`      ⚠️ Enlace interno a página con ID ${pageId} no se pudo resolver. Puede que no esté publicada o no tenga slug.`);
                return '<a href="#">'; // Dejamos un enlace muerto si no lo encontramos
            });
            
            // Crear el contenido del archivo content.html con los metadatos
            const finalHtml = `<!-- METADATOS ... -->
<meta name="title" content="${title}">
<meta name="topic" content="${topic}">
<meta name="tags" content="${tags}">
<meta name="cover" content="${coverImageFileName}">

<!-- CONTENIDO DEL POST -->
${htmlContent}
`;
            fs.writeFileSync(path.join(postPath, 'content.html'), finalHtml);
        }

        // --- PASO F: CREAR EL ARCHIVO DE ÍNDICE ---
        const indexPath = path.join(__dirname, '..', 'posts-index.json');
        fs.writeFileSync(indexPath, JSON.stringify(postSlugs, null, 2));
        
        console.log("\n🎉 ¡Proceso completado con éxito!");

    } catch (error) {
        console.error("❌ Ocurrió un error al obtener los posts de Notion:", error);
    }
}

main();