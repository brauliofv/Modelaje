// ===== INICIO DEL ARCHIVO script.js (FINAL CON REPRODUCTORES) =====

const blogData = [
    // Tu lista de posts (blogData) va aquí. Asegúrate de que los slugs y coverImage estén correctos.
    // Ejemplo:
    { "Título": "⭐️ Tipos de modelos profesionales ✅ en la industria de la moda ⭐️", "slug": "Tipos de modelos profesionales", "Topic": "Profesional", "coverImage": "assets/posts/Tipos de modelos profesionales/portada.jpg" },
    { "Título": "✅ Como trabaja una AGENCIA DE MODELOS y️ TALENTOS ✅", "slug": "Como trabaja una AGENCIA", "Topic": "Profesional", "coverImage": "assets/posts/Como trabaja una AGENCIA/portada.jpg" },
    { "Título": "✨ CERTAMEN DE BELLEZA ✨ Una herramienta para la modelo", "slug": "CERTAMEN DE BELLEZA", "Topic": "Oportunidades y Formación", "coverImage": "assets/posts/CERTAMEN DE BELLEZA/portada.jpg" },
    { "Título": "⭐️ BACKSTAGE ⭐️ Lo que pasa detras de una pasarela", "slug": "BACKSTAGE - Lo que pasa detras de una pasarela", "Topic": "Oportunidades y Formación", "coverImage": "assets/posts/BACKSTAGE - Lo que pasa detras de una pasarela/portada.jpg" },
    // ...etcétera para todos tus posts...
];

document.addEventListener('DOMContentLoaded', function() {
    const postsContainer = document.getElementById('posts-container');
    const blogContainer = document.getElementById('blog-container');
    const postContentContainer = document.getElementById('post-content');

    if (postsContainer) { displayPosts(blogData.slice(0, 6), postsContainer); }
    if (blogContainer) { displayPosts(blogData, blogContainer); setupFilters(); }
    if (postContentContainer) { loadSinglePost(); }

    navSlide();
    setupThemeToggle();
});

function loadSinglePost() {
    const postContentContainer = document.getElementById('post-content');
    const params = new URLSearchParams(window.location.search);
    const postTitle = params.get('title');
    const post = blogData.find(p => p.Título === postTitle);

    if (post) {
        document.title = `${post.Título} - Braulio`;
        const postPath = `assets/posts/${post.slug}/content.html`;
        
        fetch(postPath)
            .then(response => {
                if (!response.ok) { throw new Error('Archivo no encontrado: ' + postPath); }
                return response.text();
            })
            .then(htmlContent => {
                // ===== INICIO DE LA TRANSFORMACIÓN =====
                let processedContent = htmlContent;

                // 1. Convertir enlaces de YouTube a videos incrustados
                const youtubeRegex = /<a href="https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^"]*">.*?<\/a>/g;
                processedContent = processedContent.replace(youtubeRegex, (match, domain, videoId) => {
                    return `<div class="video-container">
                                <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                            </div>`;
                });

                // 2. Convertir enlaces de MP3 a reproductores de audio
                // Busca enlaces como <a href=".../mi-audio.mp3">mi-audio.mp3</a>
                const audioRegex = /<a href="([^"]+\.mp3)">[^<]+<\/a>/g;
                processedContent = processedContent.replace(audioRegex, (match, audioUrl) => {
                    // Obtenemos la ruta correcta relativa a la raíz del sitio
                    const finalAudioUrl = `assets/posts/${post.slug}/${audioUrl.split('/').pop()}`;
                    return `<audio controls class="audio-player" src="${finalAudioUrl}"></audio>`;
                });
                // ===== FIN DE LA TRANSFORMACIÓN =====

                postContentContainer.innerHTML = `
                    <h1>${post.Título}</h1>
                    <p style="color: var(--text-color-light);"><strong>Tópico:</strong> ${post.Topic}</p>
                    <hr style="border-color: var(--primary-color); opacity: 0.3; margin: 2rem 0;">
                    <div>${processedContent}</div>`; // Usamos el contenido ya procesado
            })
            .catch(error => {
                console.error('Error al cargar el post:', error);
                postContentContainer.innerHTML = '<h1>Error al cargar</h1><p>No se pudo encontrar el contenido de este post. Revisa que el "slug" en script.js coincida con el nombre de la carpeta.</p>';
            });
    } else {
        postContentContainer.innerHTML = '<h1>Post no encontrado</h1><p>El post que buscas no existe o fue movido.</p>';
    }
}

// ... (El resto de las funciones: displayPosts, setupFilters, navSlide, setupThemeToggle) ...
// (Pega aquí el resto de tus funciones que ya funcionaban bien)
function displayPosts(posts, container) {
    if (!container) return;
    container.innerHTML = '';
    posts.forEach(post => {
        if (!post || !post.Título) return;
        const postCard = document.createElement('div');
        postCard.classList.add('post-card');
        const imageUrl = post.coverImage || `https://placehold.co/600x400/1f1f1f/3498db?text=Sin+Imagen`;
        postCard.innerHTML = `
            <img src="${imageUrl}" alt="${post.Título}" style="object-fit: cover;">
            <div class="post-card-content">
                <h3>${post.Título}</h3>
                <p><strong>Tópico:</strong> ${post.Topic || 'N/A'}</p>
                <a href="post.html?title=${encodeURIComponent(post.Título)}" class="btn">Leer más</a>
            </div>`;
        container.appendChild(postCard);
    });
}

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const topic = button.dataset.topic;
            const filteredPosts = (topic === 'all') ? blogData : blogData.filter(p => p.Topic === topic);
            displayPosts(filteredPosts, document.getElementById('blog-container'));
        });
    });
}

function navSlide() {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');
    if (burger && nav) {
        burger.addEventListener('click', () => {
            nav.classList.toggle('nav-active');
            navLinks.forEach((link, index) => {
                link.style.animation = link.style.animation ? '' : `navLinkFade 0.5s ease forwards ${index / 7 + 0.5}s`;
            });
            burger.classList.toggle('toggle');
        });
    }
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme) { document.body.classList.add(currentTheme); }
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            let theme = document.body.classList.contains('light-mode') ? 'light-mode' : 'dark-mode';
            localStorage.setItem('theme', theme);
        });
    }
}