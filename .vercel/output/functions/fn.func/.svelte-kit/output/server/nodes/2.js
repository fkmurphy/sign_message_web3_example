

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.bfab3716.js","_app/immutable/chunks/2.3cca541e.js","_app/immutable/chunks/scheduler.f21026e3.js","_app/immutable/chunks/index.b8706f18.js","_app/immutable/chunks/preload-helper.a4192956.js","_app/immutable/chunks/index.045fc982.js"];
export const stylesheets = [];
export const fonts = [];
