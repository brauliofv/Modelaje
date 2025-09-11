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

    // --- Llamada a la nueva función de filtro de fotografía ---
    initializePhotographyFilters();
    // --- Llamada a la nueva función ---
    initializeMobileNav();
     initializeContactForm(); 
     // ===== INICIO: LÓGICA PARA EL FORMULARIO DE CONTACTO (VERSIÓN ROBUSTA) =====

function initializeContactForm() {
    const contactForm = document.getElementById('contact-form');
    // Si no estamos en la página de contacto (no se encuentra el formulario), no hacemos nada.
    if (!contactForm) return;

    // --- Seleccionamos los elementos del modal y del formulario ---
    const submitButton = document.getElementById('submit-button');
    const modalOverlay = document.getElementById('feedback-modal-overlay');
    const modal = document.getElementById('feedback-modal');
    const modalContent = document.getElementById('feedback-modal-content');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // === CORRECCIÓN CLAVE ===
    // Verificamos que TODOS los elementos necesarios para el modal existan.
    // Si falta alguno, no podemos continuar.
    if (!submitButton || !modalOverlay || !modal || !modalContent || !closeModalBtn) {
        console.error("Error: Faltan uno o más elementos del formulario o del modal en el HTML. Verifica los IDs.");
        return; // Detenemos la ejecución de esta función para evitar errores.
    }

    // --- Función para mostrar el modal con un mensaje específico ---
    function showModal(isSuccess, message) {
        modalContent.innerHTML = '';
        const icon = document.createElement('i');
        icon.className = isSuccess ? 'fas fa-check-circle icon success' : 'fas fa-times-circle icon error';
        const text = document.createElement('p');
        text.textContent = message;
        modalContent.appendChild(icon);
        modalContent.appendChild(text);
        modalOverlay.classList.add('visible');
        modal.classList.add('visible');
    }

    // --- Función para ocultar el modal ---
    function closeModal() {
        modalOverlay.classList.remove('visible');
        modal.classList.remove('visible');
    }
    
    // --- Event listeners para cerrar el modal ---
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    // --- Event listener principal del formulario ---
    contactForm.addEventListener('submit', async (event) => {
        // Esta línea ahora SÍ se ejecutará
        event.preventDefault();
        
        const formData = new FormData(contactForm);
        const formObject = Object.fromEntries(formData.entries());

        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';

        try {
            const response = await fetch('/api/submit-form',  {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formObject),
            });
            
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Ocurrió un error en el servidor.');
            }
            
            showModal(true, result.message);
            contactForm.reset();

        } catch (error) {
            showModal(false, `Error: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Mensaje';
        }
    });
}

// ===== FIN: LÓGICA PARA EL FORMULARIO DE CONTACTO =====
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

// ===== INICIO: LÓGICA PARA EL FILTRO DE LA GALERÍA DE FOTOGRAFÍA =====
// ===== INICIO: LÓGICA PARA EL FILTRO DE LA GALERÍA DE FOTOGRAFÍA (VERSIÓN MEJORADA) =====
function initializePhotographyFilters() {
    // 1. Buscamos el contenedor de los botones de filtro.
    const filterContainer = document.getElementById('photography-filters');
    // Si no estamos en la página de fotografía, no hacemos nada más.
    if (!filterContainer) return;

    // 2. Seleccionamos los elementos con los que vamos a trabajar.
    const filterButtons = filterContainer.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('#photography-gallery-grid .gallery-photo-item');

    // 3. Creamos una función reutilizable para aplicar el filtro.
    //    Esto evita repetir código y hace todo más limpio.
    const applyFilter = (category) => {
        galleryItems.forEach(item => {
            // Si la categoría es 'all' o si la categoría del item coincide, lo mostramos.
            if (category === 'all' || item.dataset.category === category) {
                item.style.display = 'block';
            } else {
                // Si no, lo ocultamos.
                item.style.display = 'none';
            }
        });
    };
    
    // 4. Añadimos el evento 'click' a cada botón.
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // a. Gestionamos la clase 'active' para el estilo visual.
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // b. Obtenemos la categoría del botón en el que se hizo clic.
            const selectedCategory = button.dataset.category;
            
            // c. Llamamos a nuestra función para que aplique el filtro.
            applyFilter(selectedCategory);
        });
    });

    // ===== INICIO DE LA NUEVA LÓGICA: LEER LA URL =====
    // Esto se ejecuta solo una vez, cuando la página carga.
    
    // a. Creamos un objeto para leer los parámetros de la URL actual.
    const params = new URLSearchParams(window.location.search);
    // b. Buscamos un parámetro llamado 'category'. Si no existe, será 'null'.
    const categoryFromURL = params.get('category'); 

    // c. Si encontramos una categoría en la URL (ej: "runway").
    if (categoryFromURL) {
        // d. Buscamos el botón que corresponde a esa categoría.
        const targetButton = filterContainer.querySelector(`.filter-btn[data-category="${categoryFromURL}"]`);
        
        // e. Si encontramos el botón...
        if (targetButton) {
            // f. ...¡simulamos un clic en él!
            // Esto es muy eficiente porque reutiliza toda la lógica de clic que ya programamos.
            targetButton.click(); 
        }
    }
    // ===== FIN DE LA NUEVA LÓGICA =====
}
// ===== FIN: LÓGICA PARA EL FILTRO DE LA GALERÍA DE FOTOGRAFÍA =====
// ===== FIN: LÓGICA PARA EL FILTRO DE LA GALERÍA DE FOTOGRAFÍA =====


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
// ===== INICIO: LÓGICA PARA LA BARRA DE NAVEGACIÓN MÓVIL (DISEÑO NOTCH) =====

function initializeMobileNav() {
    const mobileNav = document.getElementById('mobile-nav');
    if (!mobileNav) return; // Si la barra no existe, no hacemos nada

    // --- 1. Lógica para mostrar/ocultar la barra con el scroll (sin cambios) ---
    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                if (currentScrollY > 200 && currentScrollY < lastScrollY) {
                    mobileNav.classList.add('visible');
                } else if (currentScrollY > lastScrollY || currentScrollY <= 10) {
                    mobileNav.classList.remove('visible');
                }
                lastScrollY = currentScrollY;
                ticking = false;
            });
            ticking = true;
        }
    });

    // --- 2. Lógica MEJORADA para mover el indicador y marcar el icono activo ---
    const navLinks = mobileNav.querySelectorAll('a');
    const indicator = mobileNav.querySelector('.nav-indicator');

    function setActiveLink() {
    const currentPage = window.location.pathname.split('/').pop();
    let activeLink = null;

    // 1. Buscamos si alguna página coincide
    navLinks.forEach(link => {
        link.classList.remove('active'); // Limpiamos todos los activos primero
        const linkPage = link.getAttribute('href').split('/').pop();
        const iconIdentifier = link.dataset.page;

        let isMatch = false;
        if (currentPage === linkPage) isMatch = true;
        if (iconIdentifier === 'blog' && currentPage === 'post.html') isMatch = true;
        if (iconIdentifier === 'galerias' && currentPage === 'photography.html') isMatch = true;
        
        if (isMatch) {
            activeLink = link;
        }
    });

    if (!activeLink && (currentPage === '' || currentPage === 'index.html')) {
        activeLink = mobileNav.querySelector('a[data-page="inicio"]');
    }

    // 2. Actuamos según si encontramos una coincidencia o no
    if (activeLink) {
        // SÍ hay coincidencia: mostramos el indicador y lo posicionamos
        indicator.classList.remove('hidden');
        activeLink.classList.add('active');
        
        const notchLeft = activeLink.offsetLeft + (activeLink.clientWidth / 2) - (indicator.clientWidth / 2);
        indicator.style.setProperty('--notch-left', `${notchLeft}px`);
    } else {
        // NO hay coincidencia: ocultamos el indicador
        indicator.classList.add('hidden');
    }
}

    // Ejecutamos la función al cargar la página
    setActiveLink();
    
    // Y la volvemos a ejecutar si la ventana cambia de tamaño (para responsividad)
    window.addEventListener('resize', setActiveLink);
}

// ===== FIN: LÓGICA PARA LA BARRA DE NAVEGACIÓN MÓVIL =====

// ===== INICIO: LÓGICA PARA EL FORMULARIO DE CONTACTO =====

function initializeContactForm() {
    // Buscamos el formulario en la página
    const contactForm = document.getElementById('contact-form');
    // Si no estamos en la página de contacto, no hacemos nada
    if (!contactForm) return;

    const feedbackContainer = document.getElementById('form-feedback');
    const submitButton = document.getElementById('submit-button');

    // Escuchamos el evento 'submit' del formulario
    contactForm.addEventListener('submit', async (event) => {
        // Prevenimos que el formulario se envíe de la forma tradicional (recargando la página)
        event.preventDefault();

        // 1. Recolectamos los datos del formulario
        const formData = new FormData(contactForm);
        const formObject = Object.fromEntries(formData.entries());

        // 2. Deshabilitamos el botón para evitar envíos múltiples
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
        feedbackContainer.textContent = ''; // Limpiamos mensajes anteriores

        try {
            // 3. Enviamos los datos a nuestro servidor con 'fetch'
            const response = await fetch('http://localhost:3000/submit-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formObject),
            });
            
            // 4. Analizamos la respuesta del servidor
            const result = await response.json();

            if (!response.ok) {
                // Si el servidor respondió con un error (ej: status 500)
                throw new Error(result.message || 'Ocurrió un error en el servidor.');
            }
            
            // Si todo fue bien, mostramos el mensaje de éxito
            feedbackContainer.textContent = result.message;
            feedbackContainer.style.color = 'var(--primary-color-hover)'; // Color de éxito
            contactForm.reset(); // Limpiamos el formulario

        } catch (error) {
            // Si hay un error en la comunicación o del servidor, lo mostramos
            feedbackContainer.textContent = `Error: ${error.message}`;
            feedbackContainer.style.color = 'red'; // Color de error
        } finally {
            // 5. Reactivamos el botón al final, ya sea éxito o error
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar Mensaje';
        }
    });
}

// ===== FIN: LÓGICA PARA EL FORMULARIO DE CONTACTO =====