export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {"start":"_app/immutable/entry/start.9c426150.js","app":"_app/immutable/entry/app.03442b15.js","imports":["_app/immutable/entry/start.9c426150.js","_app/immutable/chunks/scheduler.f21026e3.js","_app/immutable/chunks/singletons.ee7ff5ec.js","_app/immutable/chunks/index.045fc982.js","_app/immutable/entry/app.03442b15.js","_app/immutable/chunks/preload-helper.a4192956.js","_app/immutable/chunks/scheduler.f21026e3.js","_app/immutable/chunks/index.b8706f18.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
}
})();
