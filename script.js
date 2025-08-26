// ===== INICIO DEL ARCHIVO script.js =====

const blogData = [
    { "Título": "⭐️ Tipos de modelos profesionales ✅ en la industria de la moda ⭐️", "slug": "Tipos_de_modelos_profesionales", "Topic": "Profesional", "coverImage": "assets/posts/Tipos_de_modelos_profesionales/portada.jpg" },
    { "Título": "✅ Como trabaja una AGENCIA DE MODELOS y️ TALENTOS ✅", "slug": "Como_trabaja_una_AGENCIA", "Topic": "Profesional", "coverImage": "assets/posts/Como_trabaja_una_AGENCIA/portada.jpg" },
    { "Título": "✨ CERTAMEN DE BELLEZA ✨ Una herramienta para la modelo", "slug": "CERTAMEN_DE_BELLEZA", "Topic": "Oportunidades y Formación", "coverImage": "assets/posts/CERTAMEN_DE_BELLEZA/portada.jpg" },
    { "Título": "⭐️ BACKSTAGE ⭐️ Lo que pasa detras de una pasarela", "slug": "BACKSTAGE_-_Lo_que_pasa_detras_de_una_pasarela", "Topic": "Oportunidades y Formación", "coverImage": "assets/posts/BACKSTAGE_-_Lo_que_pasa_detras_de_una_pasarela/portada.jpg" }
];

// --- INICIALIZACIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', function() {
    loadComponents();
});

// --- FUNCIÓN PARA CARGAR COMPONENTES ---
async function loadComponents() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    try {
        const [headerRes, footerRes] = await Promise.all([
            fetch('header.html'),
            fetch('footer.html')
        ]);

        if (headerRes.ok && headerPlaceholder) {
            headerPlaceholder.innerHTML = await headerRes.text();
            // 1. Inicializamos los scripts del header DESPUÉS de cargarlo
            initializeHeaderScripts(); 
        }

        if (footerRes.ok && footerPlaceholder) {
            footerPlaceholder.innerHTML = await footerRes.text();
        }

        // 2. El resto de la lógica que depende de la página se ejecuta ahora
        initializePageSpecificScripts();

    } catch (error) {
        console.error('Error al cargar los componentes:', error);
    }
}

// --- FUNCIONES DE INICIALIZACIÓN ---
function initializeHeaderScripts() {
    // Esta función ahora solo llama a navSlide.
    navSlide();
}

function initializePageSpecificScripts() {
    const postsContainer = document.getElementById('posts-container');
    const blogContainer = document.getElementById('blog-container');
    const postContentContainer = document.getElementById('post-content');
    const worksGallery = document.querySelector('.works-gallery');
    const photoGallery = document.querySelector('.photo-gallery-grid');

    if (postsContainer) { displayPosts(blogData.slice(0, 6), postsContainer); }
    if (blogContainer) { displayPosts(blogData, blogContainer); setupFilters(); }
    if (postContentContainer) { loadSinglePost(); }
    if (worksGallery) { processWorksGallery(); }
    if (photoGallery) { initializePhotoGallery(); }
}

// --- RESTO DE FUNCIONES ---

function processWorksGallery() {
    const galleryItems = document.querySelectorAll('.works-gallery .gallery-item');
    galleryItems.forEach(item => {
        const img = item.querySelector('img');
        if (img) {
            const imageLoader = new Image();
            imageLoader.src = img.src;
            imageLoader.onload = () => {
                item.classList.add(imageLoader.width > imageLoader.height ? 'horizontal' : 'vertical');
            };
        }
    });
}

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
                const youtubeRegex = /(<p>)?\s*<a href="https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)[^"]*">.*?<\/a>\s*(<\/p>)?/g;
                processedContent = processedContent.replace(youtubeRegex, (match, pStart, videoId, pEnd) => `<div class="video-container"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`);
                const audioRegex = /<a href="([^"]+\.mp3)">[^<]+<\/a>/g;
                processedContent = processedContent.replace(audioRegex, (match, audioUrl) => `<audio controls class="audio-player" src="assets/posts/${post.slug}/${audioUrl.split('/').pop()}"></audio>`);
                postContentContainer.innerHTML = `<h1>${post.Título}</h1><div class="post-meta"><p><strong>Tópico:</strong> ${post.Topic || 'N/A'}</p></div><div class="post-body">${processedContent}</div>`;
            })
            .catch(error => {
                postContentContainer.innerHTML = '<h1>Error al cargar</h1><p>No se pudo encontrar el contenido.</p>';
            });
    } else {
        postContentContainer.innerHTML = '<h1>Post no encontrado</h1>';
    }
}

// === función displayPosts
// === BLOG.HTML: Estructura corregida para mostrar texto visible
// Busca y reemplaza la función displayPosts completa
function displayPosts(posts, container) {
    if (!container) return;
    container.innerHTML = '';
    
    const isMinimalStyle = container.classList.contains('posts-container-minimal');
    const isBlogPage = container.id === 'blog-container';

    posts.forEach(post => {
        if (!post || !post.Título) return;
        
        const cardClass = isMinimalStyle ? 'post-card-minimal' : 'post-card';
        const postCard = document.createElement('div');
        postCard.classList.add(cardClass);
        
        const imageUrl = post.coverImage || `https://placehold.co/600x400/1f1f1f/3498db?text=Sin+Imagen`;

        // Generamos el HTML base de la tarjeta
        if (isBlogPage) {
            postCard.innerHTML = `
                <a href="post.html?title=${encodeURIComponent(post.Título)}">
                    <img src="${imageUrl}" alt="${post.Título}">
                    <div class="post-card-overlay">
                        <div class="overlay-content">
                            <h3>${post.Título}</h3>
                            <p class="topic">${post.Topic || ''}</p>
                            <p class="tags-placeholder"></p> <!-- Placeholder para los tags -->
                        </div>
                    </div>
                </a>`;

            // ===== LÓGICA PARA CARGAR LOS TAGS DINÁMICAMENTE =====
            const postPath = `assets/posts/${post.slug}/content.html`;
            fetch(postPath)
                .then(response => response.ok ? response.text() : Promise.reject('No content file'))
                .then(htmlContent => {
                    // Usamos un truco para leer el HTML sin mostrarlo
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlContent;
                    
                    const tagsElement = tempDiv.querySelector('.tags');
                    if (tagsElement) {
                        const tagsText = tagsElement.textContent;
                        const tagsPlaceholder = postCard.querySelector('.tags-placeholder');
                        if (tagsPlaceholder) {
                            tagsPlaceholder.textContent = tagsText;
                        }
                    }
                })
                .catch(error => {
                    // Si no encuentra los tags, el espacio simplemente quedará vacío.
                    // console.warn(`No se pudieron cargar los tags para ${post.Título}:`, error);
                });
            // ===== FIN DE LA LÓGICA DE TAGS =====

        } else if (isMinimalStyle) {
            // Estructura para la página de inicio (sin cambios)
            postCard.innerHTML = `
                <a href="post.html?title=${encodeURIComponent(post.Título)}"><img src="${imageUrl}" alt="${post.Título}"></a>
                <div class="post-card-content">
                    <h3><a href="post.html?title=${encodeURIComponent(post.Título)}">${post.Título}</a></h3>
                    <a href="post.html?title=${encodeURIComponent(post.Título)}" class="btn-minimal">Learn more</a>
                </div>`;
        }
        
        container.appendChild(postCard);
    });
}
// === FIN función displayPosts

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
    
    const openMenu = () => {
        if (nav) nav.classList.add('nav-active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    const closeMenu = () => {
        if (nav) nav.classList.remove('nav-active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (burger) burger.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    const submenuToggles = document.querySelectorAll('.nav-parent-link');
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            toggle.closest('.has-submenu').classList.toggle('open');
        });
    });

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

// ===== FUNCIÓN PARA LA GALERÍA DE FOTOS CON LIGHTBOX =====
// Busca y reemplaza la función initializePhotoGallery completa
function initializePhotoGallery() {
    const galleryItems = document.querySelectorAll('.gallery-photo-item');
    
    if (galleryItems.length === 0) return;

    // Crear el lightbox una sola vez
    const lightbox = document.createElement('div');
    lightbox.classList.add('lightbox');
    document.body.appendChild(lightbox);

    const lightboxContent = document.createElement('div');
    lightboxContent.classList.add('lightbox-content');
    
    const lightboxImage = document.createElement('img');
    const lightboxDescription = document.createElement('p');
    lightboxDescription.classList.add('lightbox-description');

    const closeButton = document.createElement('button');
    closeButton.classList.add('close-lightbox');
    closeButton.innerHTML = '&times;';

    lightboxContent.appendChild(lightboxImage);
    lightboxContent.appendChild(lightboxDescription);
    lightbox.appendChild(lightboxContent);
    lightbox.appendChild(closeButton);

    // Función para abrir el lightbox
    const openLightbox = (src, description) => {
        lightboxImage.src = src;
        // === CAMBIO CLAVE: De .textContent a .innerHTML ===
        lightboxDescription.innerHTML = description;
        // ===============================================
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // Función para cerrar el lightbox
    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    };

    galleryItems.forEach(item => {
        const img = item.querySelector('img');
        const description = item.dataset.description || '';

        if (img) {
            item.addEventListener('click', () => {
                openLightbox(img.src, description);
            });
        }
    });

    closeButton.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
}
// ===== FIN DEL ARCHIVO script.js =====