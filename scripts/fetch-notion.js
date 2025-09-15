// ===== INICIO: fetch-notion.js (VERSIÓN FINAL Y COMPLETA) =====

const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const Showdown = require('showdown');
const fs = require('fs');
const path = require('path');
require("dotenv").config();

const notion = new Client({ auth: process.env.NOTION_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;
const converter = new Showdown.Converter();
const n2m = new NotionToMarkdown({ notionClient: notion });
const postsDir = path.join(__dirname, '..', 'assets', 'posts');
const DOMAIN = "https://braulio.us.kg"; // Reemplaza con tu dominio

async function main() {
    console.log("🚀 Iniciando la generación de posts HTML y el índice de datos...");

    try {
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: { property: "Status", status: { equals: "Published" } },
            sorts: [{ timestamp: 'created_time', direction: 'descending' }],
        });
        
        console.log(`✅ Se encontraron ${response.results.length} posts publicados.`);
        const template = fs.readFileSync(path.join(__dirname, '..', 'post-template.html'), 'utf8');

        const idToSlugMap = new Map();
        for (const page of response.results) {
            const pageId = page.id.replace(/-/g, '');
            const slug = page.properties.Slug.rich_text[0]?.plain_text;
            if (slug) idToSlugMap.set(pageId, slug);
        }

        if (fs.existsSync(postsDir)) {
            fs.rmSync(postsDir, { recursive: true, force: true });
        }
        fs.mkdirSync(postsDir, { recursive: true });

        const blogDataForIndex = []; // Aquí guardaremos los datos para posts-index.json

        for (const page of response.results) {
            const title = page.properties.Title.title[0]?.plain_text || 'Sin Título';
            const slug = page.properties.Slug.rich_text[0]?.plain_text;
            const description = page.properties.Description?.rich_text[0]?.plain_text || `Lee más sobre "${title}" en el blog de Braulio Fuentes.`;
            const topic = page.properties.Topic.select?.name || 'General';
            const tags = page.properties.Tags.multi_select.map(tag => tag.name).join(', ');

            if (!slug) continue;
            
            console.log(`⏳ Procesando post: ${slug}`);
            const postPath = path.join(postsDir, slug);
            fs.mkdirSync(postPath, { recursive: true });

            let coverImageUrl = page.cover?.external?.url || page.cover?.file?.url || '';
            let coverImageFileName = ''; // El nombre del archivo de portada
            if (!coverImageUrl) {
                const pageContentForCover = await notion.blocks.children.list({ block_id: page.id, page_size: 5 });
                const firstImageBlock = pageContentForCover.results.find(block => block.type === 'image');
                if (firstImageBlock) coverImageUrl = firstImageBlock.image?.external?.url || firstImageBlock.image?.file?.url;
            }
            if (coverImageUrl) {
                try {
                    const imageResponse = await fetch(coverImageUrl);
                    const buffer = Buffer.from(await imageResponse.arrayBuffer());
                    const extension = path.extname(new URL(coverImageUrl).pathname) || '.jpg';
                    coverImageFileName = `cover${extension}`;
                    fs.writeFileSync(path.join(postPath, coverImageFileName), buffer);
                } catch (imgError) {}
            }

            const pageContent = await notion.blocks.children.list({ block_id: page.id });
            const finalHtmlBlocks = [];
            
            for (const block of pageContent.results) {
                if (block.type === 'audio' && block.audio.type === 'file') {
                    try {
                        const notionUrl = block.audio.file.url;
                        const caption = path.basename(new URL(notionUrl).pathname);
                        const audioFileName = caption.replace(/[^a-z0-9_.-]/gi, '_');
                        const audioResponse = await fetch(notionUrl);
                        const buffer = Buffer.from(await audioResponse.arrayBuffer());
                        fs.writeFileSync(path.join(postPath, audioFileName), buffer);
                        // RUTA RELATIVA CORRECTA PARA EL AUDIO DENTRO DEL index.html DEL POST
                        const audioTag = `<audio controls class="audio-player" src="${audioFileName}"></audio>`;
                        finalHtmlBlocks.push(audioTag);
                    } catch (audioError) {
                        finalHtmlBlocks.push(`<p><em>Error al cargar audio.</em></p>`);
                    }
                } 

                // ===== INICIO: NUEVA LÓGICA PARA IMÁGENES DEL CONTENIDO =====
                else if (block.type === 'image') {
                    try {
                        const notionUrl = block.image.file.url;
                        console.log(`      Downloading image: ${path.basename(notionUrl)}`);
                        // Creamos un nombre de archivo único usando el ID del bloque
                        const extension = path.extname(new URL(notionUrl).pathname) || '.jpg';
                        const imageFileName = `img-${block.id}${extension}`;
                        
                        const imageResponse = await fetch(notionUrl);
                        const buffer = Buffer.from(await imageResponse.arrayBuffer());
                        fs.writeFileSync(path.join(postPath, imageFileName), buffer);

                        // Creamos la etiqueta <img> con la ruta relativa a la copia local
                        const imageTag = `<img src="${imageFileName}" alt="Imagen del post">`;
                        finalHtmlBlocks.push(imageTag);
                    } catch (imageError) {
                        finalHtmlBlocks.push(`<p><em>Error al cargar imagen.</em></p>`);
                    }
                }
                // ===== FIN: NUEVA LÓGICA PARA IMÁGENES DEL CONTENIDO =====
                
                else {
                    try {
                        const mdblocks = await n2m.blocksToMarkdown([block]);
                        const mdString = n2m.toMarkdownString(mdblocks);
                        if (mdString.parent) finalHtmlBlocks.push(converter.makeHtml(mdString.parent));
                    } catch (err) {}
                }
            }

            const postBodyContent = `<h1>${title}</h1>` + `<div class="post-meta"><p><strong>Tópico:</strong> ${topic}</p><p class="tags"><strong>Etiquetas:</strong> ${tags}</p></div>` + finalHtmlBlocks.join('\n');
            let finalContent = postBodyContent.replace(/<a href="\/([a-f0-9]{32})">/g, (match, pageId) => {
                const linkedPostSlug = idToSlugMap.get(pageId);
                if (linkedPostSlug) return `<a href="../${linkedPostSlug}/">`;
                return '<a href="#">';
            });

            // RUTA DE IMAGEN RELATIVA PARA EL <meta> tag
            const coverImageFullPath = coverImageFileName ? `${DOMAIN}/assets/posts/${slug}/${coverImageFileName}` : `${DOMAIN}/assets/og-image.jpg`;

            const finalHtml = template
                .replace(/%%POST_TITLE%%/g, title)
                .replace(/%%POST_DESCRIPTION%%/g, description)
                .replace(/%%POST_CANONICAL_URL%%/g, `${DOMAIN}/assets/posts/${slug}/`)
                .replace(/%%POST_IMAGE_URL%%/g, coverImageFullPath)
                .replace('%%POST_CONTENT%%', finalContent);

            fs.writeFileSync(path.join(postPath, 'index.html'), finalHtml);

            // Añadimos TODA la información necesaria al array para el JSON
            blogDataForIndex.push({
                "Título": title,
                "slug": slug,
                "Topic": topic,
                "Tags": tags,
                "coverImage": coverImageFileName ? `assets/posts/${slug}/${coverImageFileName}` : ''
            });
        }
        
        // Creamos el JSON con toda la información que script.js necesita
        const indexPath = path.join(__dirname, '..', 'posts-index.json');
        fs.writeFileSync(indexPath, JSON.stringify(blogDataForIndex, null, 2));
        
        console.log("\n🎉 ¡Proceso completado con éxito!");

    } catch (error) {
        console.error("❌ Ocurrió un error:", error);
    }
}

main();