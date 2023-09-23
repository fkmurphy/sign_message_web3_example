import { c as create_ssr_component } from "../../chunks/ssr.js";
const app = "";
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<div class="bg-white dark:bg-gray-800 dark:text-gray-200 w-full h-screen">${slots.default ? slots.default({}) : ``}</div>`;
});
export {
  Layout as default
};
