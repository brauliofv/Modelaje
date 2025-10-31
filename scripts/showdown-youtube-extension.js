// ===== INICIO: showdown-youtube-extension.js =====


module.exports = function youtubeExtension() {
    return [{
        type: 'output', // Opera sobre el HTML de salida
        regex: /<p><a href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)"\s*>video<\/a><\/p>/g,
        replace: function(match, videoId) {
            // $1 es la variable de reemplazo que contiene el VIDEO_ID
            return `
<div class="video-container">
    <iframe 
        width="560" 
        height="315" 
        src="https://www.youtube.com/embed/${videoId}" 
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
    </iframe>
</div>
            `.trim(); // El .trim() elimina saltos de línea extra
        }
    }];
};

// ===== FIN: showdown-youtube-extension.js =====