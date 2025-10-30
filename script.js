// ===== INICIO DEL ARCHIVO script.js =====

// ===== INICIO DEL ARCHIVO script.js (TOTALMENTE DINÁMICO) =====


// ===== INICIO: INICIALIZACIÓN DE SWUP =====
// 1. Crea una nueva instancia de Swup.
//    Esto activa la librería para que intercepte los clics en los enlaces.
// ===== INICIO: INICIALIZACIÓN PRINCIPAL SIMPLIFICADA =====

// 1. La instancia de Swup se mantiene
const swup = new Swup();

// 2. blogData se llenará desde el nuevo JSON
let blogData = [];

// 3. Función de carga inicial
function handleInitialPageLoad() {
    fetch('/posts-index.json')
        .then(res => res.json())
        .then(data => {
            blogData = data; // Guardamos los datos de los posts
            loadComponents(); // Cargamos header/footer y ejecutamos scripts de la página
        })
        .catch(error => console.error("Error al cargar /posts-index.json:", error));
}

// 4. Eventos de Swup y carga inicial
document.addEventListener('DOMContentLoaded', handleInitialPageLoad);

swup.hooks.on('page:view', () => {
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        splashScreen.classList.add('hidden');
    }
    // Ejecutamos los scripts para la nueva página cargada por Swup
    runPageScripts();
});

// ===== FIN: INICIALIZACIÓN PRINCIPAL SIMPLIFICADA =====
// ===== FIN: INICIALIZACIÓN DE SWUP =====


// --- FUNCIÓN PARA CARGAR COMPONENTES ---
// Busca la función loadComponents en tu script.js
// --- FUNCIÓN PARA CARGAR COMPONENTES (ADAPTADA PARA SWUP) ---
async function loadComponents() {
    // Esta función ahora solo carga header y footer la primera vez.
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');

    // No necesitamos la pantalla de carga aquí, Swup la manejará.

    try {
        // Cargar header y footer si no están ya cargados (en la carga inicial)
         if (headerPlaceholder && !headerPlaceholder.innerHTML) {
     const headerRes = await fetch('/header.html');
     if (headerRes.ok) {
         headerPlaceholder.innerHTML = await headerRes.text();
         // ===== CAMBIO CLAVE 1: Inicializamos el header AQUÍ y solo aquí =====
         initializeHeaderScripts(); 
     }
 }
        if (footerPlaceholder && !footerPlaceholder.innerHTML) {
            const footerRes = await fetch('/footer.html');
            if (footerRes.ok) {
                footerPlaceholder.innerHTML = await footerRes.text();
            }
        }
    } catch (error) {
        console.error('Error al cargar componentes estáticos:', error);
    }

    // Inicializamos los scripts de la página actual.
    // Esta función se llamará cada vez que Swup cambie de página.
    runPageScripts();
}

// --- FUNCIÓN PARA EJECUTAR SCRIPTS ESPECÍFICOS DE LA PÁGINA ---
// Separamos la inicialización de scripts para poder llamarla con Swup.
function runPageScripts() {
    console.log("Running scripts for this page..."); // Para depuración
    
    initializePageSpecificScripts();
}


// --- INICIALIZACIÓN PRINCIPAL (ADAPTADA PARA SWUP) ---
document.addEventListener('DOMContentLoaded', function() {
    // Esta lógica se ejecuta solo en la primera carga de la página.
    handleInitialPageLoad();
});

// ===== INICIO: INTEGRACIÓN CON EVENTOS DE SWUP =====
// Swup disparará este evento CADA VEZ que cargue una página nueva.
// ===== INICIO: INTEGRACIÓN CON EVENTOS DE SWUP =====
// Swup disparará este evento CADA VEZ que cargue una página nueva.
swup.hooks.on('page:view', () => {

    // ===== INICIO: LÓGICA DE LIMPIEZA DEL SPLASH SCREEN =====
    // 1. Buscamos si la página que acabamos de cargar tiene un splash screen.
    const splashScreen = document.getElementById('splash-screen');
    
    // 2. Si existe (lo que ocurrirá al volver a index.html)...
    if (splashScreen) {
        // 3. ...le añadimos la clase 'hidden' INMEDIATAMENTE.
        // Esto evita que se vea, ya que estará oculto antes de que la animación de entrada de Swup termine.
        splashScreen.classList.add('hidden');
    }
    // ===== FIN: LÓGICA DE LIMPIEZA =====

    // Volvemos a ejecutar los scripts necesarios para la nueva página.
    runPageScripts();
});
// ===== FIN: INTEGRACIÓN CON EVENTOS DE SWUP =====

// --- NUEVA FUNCIÓN PARA LA CARGA INICIAL ---
function handleInitialPageLoad() {
    const splashScreen = document.getElementById('splash-screen');
    
    // Comprobamos si estamos en la página de inicio Y si el splash screen existe
    if (document.body.id === 'page-home' && splashScreen) {
        // Esperamos un poco para que se vea la animación y luego lo ocultamos
        setTimeout(() => {
            splashScreen.classList.add('hidden');
        }, 1000); // Puedes ajustar este tiempo
    }
    
    // Después de manejar el splash, cargamos el resto.
    fetch('/posts-index.json')
        .then(res => res.json())
        .then(data => {
            blogData = data;
            loadComponents();
        });
}
// ===== FIN: INTEGRACIÓN CON EVENTOS DE SWUP =====

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
            <a href="assets/posts/${post.slug}/">
                <img src="${imageUrl}" alt="${post.Título}">
            </a>
            <div class="post-card-content">
                <h3><a href="assets/posts/${post.slug}/">${post.Título}</a></h3>
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
// ===== INICIO: LÓGICA DE FILTRO DE GALERÍA (VERSIÓN QUIRÚRGICA Y FINAL) =====
// ===== INICIO: LÓGICA DE FILTRO DE GALERÍA (VERSIÓN HÍBRIDA FINAL CON FLIP Y FADE) =====
function initializePhotographyFilters() {
    const filterContainer = document.getElementById('photography-filters');
    if (!filterContainer) return;

    const filterButtons = filterContainer.querySelectorAll('.filter-btn');
    const galleryGrid = document.getElementById('photography-gallery-grid');
    const animationDuration = 500; // Debe coincidir con tu CSS (0.5s)

    const applyFilter = (category) => {
        const allItems = Array.from(galleryGrid.children);
        
        // --- 1. PRIMERO (FIRST): CAPTURAR ESTADO INICIAL ---
        const initialPositions = new Map();
        const visibleItems = allItems.filter(item => item.style.display !== 'none' && !item.classList.contains('hidden'));
        
        visibleItems.forEach(item => {
            initialPositions.set(item, item.getBoundingClientRect());
        });

        // --- 2. ANIMACIÓN DE SALIDA ---
        // Hacemos que TODAS las fotos visibles actualmente comiencen a desvanecerse y encogerse.
        // Esto es CLAVE para la consistencia en la transición "All" -> "Filtro".
        visibleItems.forEach(item => {
            item.classList.add('hidden');
        });
        
        // --- 3. ESPERAR Y ACTUALIZAR EL LAYOUT ---
        setTimeout(() => {
            // --- 4. ÚLTIMO (LAST): ACTUALIZAR EL DOM Y MEDIR POSICIONES FINALES ---
            allItems.forEach(item => {
                const shouldBeVisible = item.dataset.category === category || category === 'all';
                item.style.display = shouldBeVisible ? 'block' : 'none';
            });

            const finalVisibleItems = allItems.filter(item => item.style.display !== 'none');

            // --- 5. INVERTIR (INVERT): PREPARAMOS LA ANIMACIÓN DE ENTRADA Y DESPLAZAMIENTO ---
            finalVisibleItems.forEach(item => {
                const newPos = item.getBoundingClientRect();
                const oldPos = initialPositions.get(item);

                // Si la foto ya estaba en el DOM (no es completamente nueva), calculamos su desplazamiento.
                if (oldPos) {
                    const deltaX = oldPos.left - newPos.left;
                    const deltaY = oldPos.top - newPos.top;
                    
                    // La movemos instantáneamente a su posición antigua para que pueda animarse a la nueva.
                    item.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                }
                // Si es una foto nueva, no hacemos nada, simplemente aparecerá en su lugar.
            });

            // --- 6. REPRODUCIR (PLAY): EJECUTAMOS LAS ANIMACIONES ---
            // Forzamos al navegador a procesar los cambios antes de la animación final.
            requestAnimationFrame(() => {
                finalVisibleItems.forEach(item => {
                    // Quitamos la clase 'hidden' para que la foto se anime a opacidad 1 y escala 1.
                    item.classList.remove('hidden');
                    // Reseteamos la transformación para que se desplace suavemente a su posición final (0,0).
                    item.style.transform = '';
                });
            });

        }, animationDuration);
    };

    // --- Lógica de los botones (sin cambios importantes) ---
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.classList.contains('active')) return;
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            applyFilter(button.dataset.category);
        });
    });

    // --- Lógica de la carga inicial (sin cambios) ---
    const params = new URLSearchParams(window.location.search);
    const categoryFromURL = params.get('category');
    if (categoryFromURL) {
        const targetButton = filterContainer.querySelector(`.filter-btn[data-category="${categoryFromURL}"]`);
        if (targetButton) targetButton.click();
    } else {
        const allButton = filterContainer.querySelector('.filter-btn[data-category="all"]');
        if (allButton) allButton.classList.add('active');
    }
}
// ===== FIN: LÓGICA DE FILTRO DE GALERÍA (VERSIÓN HÍBRIDA FINAL CON FLIP Y FADE) =====
// ===== FIN: LÓGICA DE FILTRO DE GALERÍA (VERSIÓN QUIRÚRGICA Y FINAL) =====
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
            const response = await fetch('/api/submit-form', {
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