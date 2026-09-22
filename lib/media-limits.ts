/**
 * Límits del vídeo d'un bloc, compartits entre l'editor (que els comprova
 * abans de pujar res) i el servidor (que no es refia de l'editor).
 *
 * Un vídeo de bloc és un clip curt, sense so, que gira en bucle dins d'una
 * targeta. Es guarda a la base de dades com les imatges, perquè el centre ho
 * té tot a Railway i no vol un servei de fitxers a part; per això els límits
 * són baixos. Si algun dia hi ha molts vídeos, el lloc on es guarden es canvia
 * a les dues rutes d'upload i de servei, i aquests números poden pujar.
 */
export const VIDEO_MAX_BYTES = 15 * 1024 * 1024;
export const VIDEO_MAX_SECONDS = 30;
export const VIDEO_TYPES = ["video/mp4", "video/webm"];
