// ===== INICIO DEL ARCHIVO script.js =====

// ===== INICIO DEL ARCHIVO script.js (TOTALMENTE DINÁMICO) =====

// 1. Ya no tenemos un blogData estático. Se construirá dinámicamente.
let blogData = [];

// --- INICIALIZACIÓN PRINCIPAL ---
document.addEventListener('DOMContentLoaded', function() {
    // 2. La inicialización ahora comienza con la construcción de los datos del blog.
    buildBlogData().then(() => {
        // 3. Una vez construido, ejecutamos el resto de la lógica.
        loadComponents();
    });
});

// --- FUNCIÓN PARA CONSTRUIR blogData DINÁMICAMENTE ---
async function buildBlogData() {
    try {
        const indexResponse = await fetch('posts-index.json');
        const postSlugs = await indexResponse.json();

        const postPromises = postSlugs.map(async (slug) => {
            const postPath = `assets/posts/${slug}/content.html`;
            const contentResponse = await fetch(postPath);
            if (!contentResponse.ok) return null;
            const htmlContent = await contentResponse.text();

            // Usamos un truco para leer el HTML y extraer los metadatos
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;

            const title = tempDiv.querySelector('meta[name="title"]')?.getAttribute('content') || slug.replace(/_/g, ' ');
            const topic = tempDiv.querySelector('meta[name="topic"]')?.getAttribute('content') || 'General';
            const tags = tempDiv.querySelector('meta[name="tags"]')?.getAttribute('content') || '';
            const coverImageFile = tempDiv.querySelector('meta[name="cover"]')?.getAttribute('content') || '';
            
            return {
                "Título": title,
                "slug": slug,
                "Topic": topic,
                "Tags": tags,
                "coverImage": coverImageFile ? `assets/posts/${slug}/${coverImageFile}` : ''
            };
        });

        const posts = await Promise.all(postPromises);
        // Filtramos cualquier post que no se haya podido cargar y lo asignamos a la variable global.
        blogData = posts.filter(post => post !== null);
        
        // Opcional: Ordenar posts por algún criterio, por ahora se ordenan como en el JSON.
        // Si tuvieras una fecha en los metadatos, podríamos ordenar por fecha aquí.

    } catch (error) {
        console.error("Error al construir los datos del blog:", error);
    }
}



// --- FUNCIÓN PARA CARGAR COMPONENTES ---
// Busca la función loadComponents en tu script.js
async function loadComponents() {
    const splashScreen = document.getElementById('splash-screen'); // <-- Obtenemos la pantalla de carga

    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    try {
        const [headerRes, footerRes] = await Promise.all([
            fetch('header.html'),
            fetch('footer.html')
        ]);

        if (headerRes.ok && headerPlaceholder) {
            headerPlaceholder.innerHTML = await headerRes.text();
            initializeHeaderScripts();
        }

        if (footerRes.ok && footerPlaceholder) {
            footerPlaceholder.innerHTML = await footerRes.text();
        }

        initializePageSpecificScripts();

    } catch (error) {
        console.error('Error al cargar los componentes:', error);
    } finally {
        // ===== LÓGICA PARA OCULTAR LA ANIMACIÓN =====
        // Se ejecuta siempre, incluso si hay un error,
        // para que el usuario no se quede atascado.
        if (splashScreen) {
            // Esperamos un poco más para que la animación se aprecie
            setTimeout(() => {
                splashScreen.classList.add('hidden');
            }, 1000); // 500ms = 0.5 segundos de espera extra
        }
        // ===========================================
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

    if (postsContainer) { displayPosts(blogData.slice(0, 3), postsContainer); }
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
                
                postContentContainer.innerHTML = `
                <h1>${post.Título}</h1>
                <div class="post-meta">
                    <p><strong>Tópico:</strong> ${post.Topic || 'N/A'}</p>
                    ${post.Tags ? `<p class="tags"><strong>Etiquetas:</strong> ${post.Tags}</p>` : ''}
                </div>
                <div class="post-body">${processedContent}</div>
            `;
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

    posts.forEach(post => {
        if (!post || !post.Título) return;
        
        const postCard = document.createElement('div');
        postCard.classList.add('post-card'); // Siempre usamos 'post-card'
        
        const imageUrl = post.coverImage || `https://placehold.co/600x400/1f1f1f/3498db?text=Sin+Imagen`;

        // Usamos la misma estructura para todas las tarjetas de post
        postCard.innerHTML = `
            <a href="post.html?title=${encodeURIComponent(post.Título)}">
                <img src="${imageUrl}" alt="${post.Título}">
            </a>
            <div class="post-card-content">
                <h3><a href="post.html?title=${encodeURIComponent(post.Título)}">${post.Título}</a></h3>
                <p><strong>Tópico:</strong> ${post.Topic || 'N/A'}</p>
                <p class="tags">${post.Tags || ''}</p>
            </div>`;
        
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