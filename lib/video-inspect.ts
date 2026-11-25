/**
 * Llegeix la durada d'un vídeo i en treu un fotograma, al navegador, abans
 * de pujar res. Així el límit de durada es comprova sense que el servidor
 * hagi de descodificar el fitxer, i el fotograma serveix de reserva a les
 * pantalles que no puguin reproduir-lo.
 */
export async function inspectVideo(file: File): Promise<{ duration: number; poster: Blob | null }> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("No s'ha pogut llegir el vídeo. Prova amb un MP4."));
    });
    const duration = video.duration;
    const at = Math.min(1, (isFinite(duration) ? duration : 0) / 2);
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      video.currentTime = at;
      // Alguns navegadors no disparen "seeked" amb fitxers curts: no ens hi encallem.
      setTimeout(resolve, 3000);
    });
    let poster: Blob | null = null;
    if (video.videoWidth && video.videoHeight) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      poster = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    }
    return { duration, poster };
  } finally {
    URL.revokeObjectURL(url);
  }
}
