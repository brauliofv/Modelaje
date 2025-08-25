// ===== INICIO DEL ARCHIVO script.js (FINAL) =====

const blogData = [
    { "Título": "⭐️ Tipos de modelos profesionales ✅ en la industria de la moda ⭐️", "slug": "Tipos_de_modelos_profesionales", "Topic": "Profesional", "coverImage": "assets/posts/Tipos_de_modelos_profesionales/portada.jpg" },
    { "Título": "✅ Como trabaja una AGENCIA DE MODELOS y️ TALENTOS ✅", "slug": "Como_trabaja_una_AGENCIA", "Topic": "Profesional", "coverImage": "assets/posts/Como_trabaja_una_AGENCIA/portada.jpg" },
    { "Título": "✨ CERTAMEN DE BELLEZA ✨ Una herramienta para la modelo", "slug": "CERTAMEN_DE_BELLEZA", "Topic": "Oportunidades y Formación", "coverImage": "assets/posts/CERTAMEN_DE_BELLEZA/portada.jpg" },
    { "Título": "⭐️ BACKSTAGE ⭐️ Lo que pasa detras de una pasarela", "slug": "BACKSTAGE_-_Lo_que_pasa_detras_de_una_pasarela", "Topic": "Oportunidades y Formación", "coverImage": "assets/posts/BACKSTAGE_-_Lo_que_pasa_detras_de_una_pasarela/portada.jpg" }
    
];

document.addEventListener('DOMContentLoaded', function() {
    // Lógica principal
    loadComponents();
    const postsContainer = document.getElementById('posts-container');
    const blogContainer = document.getElementById('blog-container');
    const postContentContainer = document.getElementById('post-content');
    const worksGallery = document.querySelector('.works-gallery'); 

    if (postsContainer) { displayPosts(blogData.slice(0, 6), postsContainer); }
    if (blogContainer) { displayPosts(blogData, blogContainer); setupFilters(); }
    if (postContentContainer) { loadSinglePost(); }
    if (worksGallery) { processWorksGallery(); } 

    navSlide();
});

// --- FUNCIÓN PARA CARGAR COMPONENTES ---
async function loadComponents() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    try {
        // Usamos Promise.all para cargar ambos archivos en paralelo
        const [headerRes, footerRes] = await Promise.all([
            fetch('header.html'),
            fetch('footer.html')
        ]);

        if (headerRes.ok && headerPlaceholder) {
            headerPlaceholder.innerHTML = await headerRes.text();
            // 2. IMPORTANTE: Inicializamos los scripts del header DESPUÉS de cargarlo
            initializeHeaderScripts();
        }

        if (footerRes.ok && footerPlaceholder) {
            footerPlaceholder.innerHTML = await footerRes.text();
        }

        // 3. El resto de la lógica que depende de la página se ejecuta ahora
        initializePageSpecificScripts();

    } catch (error) {
        console.error('Error al cargar los componentes:', error);
    }
}

// --- FUNCIONES DE INICIALIZACIÓN ---
function initializeHeaderScripts() {
    navSlide();
}

function initializePageSpecificScripts() {
    const postsContainer = document.getElementById('posts-container');
    const blogContainer = document.getElementById('blog-container');
    const postContentContainer = document.getElementById('post-content');
    const worksGallery = document.querySelector('.works-gallery');

    if (postsContainer) { displayPosts(blogData.slice(0, 6), postsContainer); }
    if (blogContainer) { displayPosts(blogData, blogContainer); setupFilters(); }
    if (postContentContainer) { loadSinglePost(); }
    if (worksGallery) { processWorksGallery(); }
}



// ===== NUEVA FUNCIÓN PARA LA GALERÍA DE TRABAJOS =====
function processWorksGallery() {
    const galleryItems = document.querySelectorAll('.works-gallery .gallery-item');
    galleryItems.forEach(item => {
        const img = item.querySelector('img');
        if (img) {
            // Creamos una nueva imagen en memoria para leer sus dimensiones reales
            const imageLoader = new Image();
            imageLoader.src = img.src;

            imageLoader.onload = () => {
                if (imageLoader.width > imageLoader.height) {
                    item.classList.add('horizontal');
                } else {
                    item.classList.add('vertical');
                }
            };
            imageLoader.onerror = () => {
                console.error('No se pudo cargar la imagen para la galería:', img.src);
            };
        }
    });
}

// ======= La función loadSinglePost ======

// Busca la función loadSinglePost y reemplázala por esta versión
function loadSinglePost() {
    const postContentContainer = document.getElementById('post-content');
    const params = new URLSearchParams(window.location.search);
    const postTitle = params.get('title');
    const post = blogData.find(p => p.Título === postTitle);

    if (post) {
        document.title = `${post.Título} - Braulio`;
        const postPath = `assets/posts/${post.slug}/content.html`;
        
        fetch(postPath)
            .then(response => response.ok ? response.text() : Promise.reject('Archivo no encontrado'))
            .then(htmlContent => {
                let processedContent = htmlContent;

                // ===== INICIO DE LA CORRECCIÓN =====
                // Regex mejorado para que funcione incluso si el enlace está dentro de una etiqueta <p>
                const youtubeRegex = /(<p>)?\s*<a href="https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^"]*">.*?<\/a>\s*(<\/p>)?/g;
                processedContent = processedContent.replace(youtubeRegex, (match, pStart, videoId, pEnd) => {
                    return `<div class="video-container"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
                });
                // ===== FIN DE LA CORRECCIÓN =====
                
                const audioRegex = /<a href="([^"]+\.mp3)">[^<]+<\/a>/g;
                processedContent = processedContent.replace(audioRegex, (match, audioUrl) => `<audio controls class="audio-player" src="assets/posts/${post.slug}/${audioUrl.split('/').pop()}"></audio>`);
                
                postContentContainer.innerHTML = `
                    <h1>${post.Título}</h1>
                    <div class="post-meta">
                        <p><strong>Tópico:</strong> ${post.Topic || 'N/A'}</p>
                    </div>
                    <div class="post-body">
                        ${processedContent}
                    </div>
                `;
            })
            .catch(error => {
                console.error('Error al cargar el post:', error, postPath);
                postContentContainer.innerHTML = '<h1>Error al cargar</h1><p>No se pudo encontrar el contenido del post.</p>';
            });
    } else {
        postContentContainer.innerHTML = '<h1>Post no encontrado</h1>';
    }
}

// Busca la función displayPosts y reemplázala por esta
function displayPosts(posts, container) {
    if (!container) return;
    container.innerHTML = '';
    
    const isMinimalStyle = container.classList.contains('posts-container-minimal');
    const isBlogPage = container.id === 'blog-container'; // Nueva detección para la página del blog

    posts.forEach(post => {
        if (!post || !post.Título) return;
        
        const cardClass = isMinimalStyle ? 'post-card-minimal' : 'post-card';
        const postCard = document.createElement('div');
        postCard.classList.add(cardClass);
        
        const imageUrl = post.coverImage || `https://placehold.co/600x400/1f1f1f/3498db?text=Sin+Imagen`;

        if (isBlogPage) {
            // === ESTRUCTURA ESPECIAL PARA BLOG.HTML ===
            postCard.innerHTML = `
                <a href="post.html?title=${encodeURIComponent(post.Título)}">
                    <img src="${imageUrl}" alt="${post.Título}">
                    <div class="post-card-overlay">
                        <div class="overlay-content">
                            <h3>${post.Título}</h3>
                            <p class="topic">${post.Topic || ''}</p>
                            <p class="tags">${post.Tags || ''}</p>
                        </div>
                    </div>
                </a>`;
        } else if (isMinimalStyle) {
            // === ESTRUCTURA PARA INDEX.HTML (MINIMALISTA) ===
            postCard.innerHTML = `
                <a href="post.html?title=${encodeURIComponent(post.Título)}">
                    <img src="${imageUrl}" alt="${post.Título}">
                </a>
                <div class="post-card-content">
                    <h3><a href="post.html?title=${encodeURIComponent(post.Título)}">${post.Título}</a></h3>
                    <a href="post.html?title=${encodeURIComponent(post.Título)}" class="btn-minimal">Learn more</a>
                </div>`;
        }
        
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
    const closeBtn = document.querySelector('.close-menu');
    const overlay = document.querySelector('.nav-overlay');
    const navLinks = document.querySelectorAll('.nav-links a');

    const openMenu = () => {
        nav.classList.add('nav-active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
        nav.classList.remove('nav-active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (burger) burger.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);
    
    navLinks.forEach(link => link.addEventListener('click', closeMenu));

    const themeToggleHeader = document.getElementById('theme-toggle-header');
    const themeToggleMenu = document.getElementById('theme-toggle-menu');

    const toggleTheme = () => {
        document.body.classList.toggle('light-mode');
        let theme = document.body.classList.contains('light-mode') ? 'light-mode' : 'dark-mode';
        localStorage.setItem('theme', theme);
    };
    
    if (themeToggleHeader) themeToggleHeader.addEventListener('click', toggleTheme);
    if (themeToggleMenu) themeToggleMenu.addEventListener('click', toggleTheme);
    
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.body.classList.add(currentTheme);
    }
}
