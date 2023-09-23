

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.5d824abc.js","_app/immutable/chunks/scheduler.f21026e3.js","_app/immutable/chunks/index.b8706f18.js","_app/immutable/chunks/singletons.ee7ff5ec.js","_app/immutable/chunks/index.045fc982.js"];
export const stylesheets = [];
export const fonts = [];
