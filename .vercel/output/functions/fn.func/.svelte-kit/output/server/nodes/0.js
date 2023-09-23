

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.fab7aa85.js","_app/immutable/chunks/scheduler.f21026e3.js","_app/immutable/chunks/index.b8706f18.js"];
export const stylesheets = ["_app/immutable/assets/0.3e828114.css"];
export const fonts = [];
