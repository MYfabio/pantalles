/**
 * Bots que poden llegir Kiosko i bots que no (mateix criteri que aulaia.cat, lib/bots.js).
 *
 * La portada es vol trobable (Google, Bing i els assistents que citen la pàgina amb enllaç quan
 * algú pregunta), però no copiable en bloc per entrenar models d'IA. Les previsualitzacions
 * d'enllaços (LinkedIn, WhatsApp, Telegram...) no es toquen.
 */

// Assistents que llegeixen una pàgina per respondre i la citen amb enllaç.
export const BOTS_CERCA_IA = [
  "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User", "DuckAssistBot", "MistralAI-User",
];

// Rastrejadors que recullen webs per entrenar models d'IA o per vendre'n les dades.
const RASTREJADORS_ENTRENAMENT = [
  "GPTBot", "ClaudeBot", "anthropic-ai", "CCBot", "Bytespider", "TikTokSpider",
  "meta-externalagent", "FacebookBot", "Amazonbot", "cohere-ai",
  "cohere-training-data-crawler", "Diffbot", "omgili", "omgilibot", "AI2Bot",
  "Ai2Bot-Dolma", "ImagesiftBot", "Timpibot", "VelenPublicWebCrawler", "PanguBot",
  "img2dataset", "ICC-Crawler", "Kangaroo Bot",
];

// Noms que només existeixen dins robots.txt: Google i Apple rastregen amb el bot de sempre
// i aquest nom diu si el contingut pot servir per entrenar la seva IA.
const NOMS_NOMES_ROBOTS = ["Google-Extended", "Applebot-Extended", "Webzio-Extended"];

// Programes que descarreguen un web sencer per tenir-ne una còpia.
const COPIADORS = [
  "HTTrack", "Wget", "Scrapy", "WebCopier", "WebZIP", "Teleport Pro", "Offline Explorer",
  "SiteSnagger", "WebStripper", "WebReaper", "SiteSucker", "WebWhacker",
];

export const BOTS_ENTRENAMENT = [...RASTREJADORS_ENTRENAMENT, ...NOMS_NOMES_ROBOTS, ...COPIADORS];
