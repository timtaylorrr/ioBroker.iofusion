import { dev } from '$app/environment';

/**
 * Folder with the static files (themes, translations, docs).
 * The ioFusion adapter sets CLIENT_DIR because its working directory is not the app folder.
 */
export const clientDir = dev ? './static' : process.env.CLIENT_DIR || './build/client';
