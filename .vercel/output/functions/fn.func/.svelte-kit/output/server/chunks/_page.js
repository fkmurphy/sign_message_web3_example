import { b as get_store_value, c as create_ssr_component, a as subscribe$1, e as escape, v as validate_component, n as noop$1 } from "./ssr.js";
import { BehaviorSubject, Subject, defer, fromEvent, takeUntil as takeUntil$1, firstValueFrom, startWith as startWith$2, shareReplay as shareReplay$2, distinctUntilChanged, filter as filter$1, mapTo, take as take$1, fromEventPattern } from "rxjs";
import { shareReplay as shareReplay$1, withLatestFrom, pluck, take, takeUntil, distinctUntilKeyChanged, filter, map, startWith as startWith$1, share, switchMap } from "rxjs/operators";
import bowser from "bowser";
import { d as derived, w as writable } from "./index.js";
import deepmerge from "deepmerge";
import { IntlMessageFormat } from "intl-messageformat";
import { nanoid } from "nanoid";
import Joi from "joi";
import { chainNamespaceValidation, chainIdValidation, chainValidation, validate, weiToEth, ProviderRpcErrorCode } from "@web3-onboard/common";
import BigNumber from "bignumber.js";
import partition from "lodash.partition";
import { ethers, BigNumber as BigNumber$1, utils, providers } from "ethers";
import merge from "lodash.merge";
import EventEmitter from "eventemitter3";
import injectedModule from "@web3-onboard/injected-wallets";
function delve(obj, fullKey) {
  if (fullKey == null)
    return void 0;
  if (fullKey in obj) {
    return obj[fullKey];
  }
  const keys = fullKey.split(".");
  let result = obj;
  for (let p = 0; p < keys.length; p++) {
    if (typeof result === "object") {
      if (p > 0) {
        const partialKey = keys.slice(p, keys.length).join(".");
        if (partialKey in result) {
          result = result[partialKey];
          break;
        }
      }
      result = result[keys[p]];
    } else {
      result = void 0;
    }
  }
  return result;
}
const lookupCache = {};
const addToCache = (path, locale2, message) => {
  if (!message)
    return message;
  if (!(locale2 in lookupCache))
    lookupCache[locale2] = {};
  if (!(path in lookupCache[locale2]))
    lookupCache[locale2][path] = message;
  return message;
};
const lookup = (path, refLocale) => {
  if (refLocale == null)
    return void 0;
  if (refLocale in lookupCache && path in lookupCache[refLocale]) {
    return lookupCache[refLocale][path];
  }
  const locales = getPossibleLocales(refLocale);
  for (let i = 0; i < locales.length; i++) {
    const locale2 = locales[i];
    const message = getMessageFromDictionary(locale2, path);
    if (message) {
      return addToCache(path, refLocale, message);
    }
  }
  return void 0;
};
let dictionary;
const $dictionary = writable({});
function getLocaleDictionary(locale2) {
  return dictionary[locale2] || null;
}
function hasLocaleDictionary(locale2) {
  return locale2 in dictionary;
}
function getMessageFromDictionary(locale2, id) {
  if (!hasLocaleDictionary(locale2)) {
    return null;
  }
  const localeDictionary = getLocaleDictionary(locale2);
  const match = delve(localeDictionary, id);
  return match;
}
function getClosestAvailableLocale(refLocale) {
  if (refLocale == null)
    return void 0;
  const relatedLocales = getPossibleLocales(refLocale);
  for (let i = 0; i < relatedLocales.length; i++) {
    const locale2 = relatedLocales[i];
    if (hasLocaleDictionary(locale2)) {
      return locale2;
    }
  }
  return void 0;
}
function addMessages(locale2, ...partials) {
  delete lookupCache[locale2];
  $dictionary.update((d) => {
    d[locale2] = deepmerge.all([d[locale2] || {}, ...partials]);
    return d;
  });
}
derived(
  [$dictionary],
  ([dictionary2]) => Object.keys(dictionary2)
);
$dictionary.subscribe((newDictionary) => dictionary = newDictionary);
const queue = {};
function removeLoaderFromQueue(locale2, loader) {
  queue[locale2].delete(loader);
  if (queue[locale2].size === 0) {
    delete queue[locale2];
  }
}
function getLocaleQueue(locale2) {
  return queue[locale2];
}
function getLocalesQueues(locale2) {
  return getPossibleLocales(locale2).map((localeItem) => {
    const localeQueue = getLocaleQueue(localeItem);
    return [localeItem, localeQueue ? [...localeQueue] : []];
  }).filter(([, localeQueue]) => localeQueue.length > 0);
}
function hasLocaleQueue(locale2) {
  if (locale2 == null)
    return false;
  return getPossibleLocales(locale2).some(
    (localeQueue) => {
      var _a;
      return (_a = getLocaleQueue(localeQueue)) == null ? void 0 : _a.size;
    }
  );
}
function loadLocaleQueue(locale2, localeQueue) {
  const allLoadersPromise = Promise.all(
    localeQueue.map((loader) => {
      removeLoaderFromQueue(locale2, loader);
      return loader().then((partial) => partial.default || partial);
    })
  );
  return allLoadersPromise.then((partials) => addMessages(locale2, ...partials));
}
const activeFlushes = {};
function flush$1(locale2) {
  if (!hasLocaleQueue(locale2)) {
    if (locale2 in activeFlushes) {
      return activeFlushes[locale2];
    }
    return Promise.resolve();
  }
  const queues = getLocalesQueues(locale2);
  activeFlushes[locale2] = Promise.all(
    queues.map(
      ([localeName, localeQueue]) => loadLocaleQueue(localeName, localeQueue)
    )
  ).then(() => {
    if (hasLocaleQueue(locale2)) {
      return flush$1(locale2);
    }
    delete activeFlushes[locale2];
  });
  return activeFlushes[locale2];
}
var __getOwnPropSymbols$2 = Object.getOwnPropertySymbols;
var __hasOwnProp$2 = Object.prototype.hasOwnProperty;
var __propIsEnum$2 = Object.prototype.propertyIsEnumerable;
var __objRest$1 = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp$2.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols$2)
    for (var prop of __getOwnPropSymbols$2(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum$2.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
const defaultFormats = {
  number: {
    scientific: { notation: "scientific" },
    engineering: { notation: "engineering" },
    compactLong: { notation: "compact", compactDisplay: "long" },
    compactShort: { notation: "compact", compactDisplay: "short" }
  },
  date: {
    short: { month: "numeric", day: "numeric", year: "2-digit" },
    medium: { month: "short", day: "numeric", year: "numeric" },
    long: { month: "long", day: "numeric", year: "numeric" },
    full: { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  },
  time: {
    short: { hour: "numeric", minute: "numeric" },
    medium: { hour: "numeric", minute: "numeric", second: "numeric" },
    long: {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZoneName: "short"
    },
    full: {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZoneName: "short"
    }
  }
};
function defaultMissingKeyHandler({ locale: locale2, id }) {
  console.warn(
    `[svelte-i18n] The message "${id}" was not found in "${getPossibleLocales(
      locale2
    ).join('", "')}".${hasLocaleQueue(getCurrentLocale()) ? `

Note: there are at least one loader still registered to this locale that wasn't executed.` : ""}`
  );
}
const defaultOptions = {
  fallbackLocale: null,
  loadingDelay: 200,
  formats: defaultFormats,
  warnOnMissingMessages: true,
  handleMissingMessage: void 0,
  ignoreTag: true
};
const options = defaultOptions;
function getOptions() {
  return options;
}
function init$2(opts) {
  const _a = opts, { formats } = _a, rest = __objRest$1(_a, ["formats"]);
  let initialLocale = opts.fallbackLocale;
  if (opts.initialLocale) {
    try {
      if (IntlMessageFormat.resolveLocale(opts.initialLocale)) {
        initialLocale = opts.initialLocale;
      }
    } catch (e) {
      console.warn(
        `[svelte-i18n] The initial locale "${opts.initialLocale}" is not a valid locale.`
      );
    }
  }
  if (rest.warnOnMissingMessages) {
    delete rest.warnOnMissingMessages;
    if (rest.handleMissingMessage == null) {
      rest.handleMissingMessage = defaultMissingKeyHandler;
    } else {
      console.warn(
        '[svelte-i18n] The "warnOnMissingMessages" option is deprecated. Please use the "handleMissingMessage" option instead.'
      );
    }
  }
  Object.assign(options, rest, { initialLocale });
  if (formats) {
    if ("number" in formats) {
      Object.assign(options.formats.number, formats.number);
    }
    if ("date" in formats) {
      Object.assign(options.formats.date, formats.date);
    }
    if ("time" in formats) {
      Object.assign(options.formats.time, formats.time);
    }
  }
  return $locale.set(initialLocale);
}
const $isLoading = writable(false);
var __defProp$1 = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols$1 = Object.getOwnPropertySymbols;
var __hasOwnProp$1 = Object.prototype.hasOwnProperty;
var __propIsEnum$1 = Object.prototype.propertyIsEnumerable;
var __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues$1 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp$1.call(b, prop))
      __defNormalProp$1(a, prop, b[prop]);
  if (__getOwnPropSymbols$1)
    for (var prop of __getOwnPropSymbols$1(b)) {
      if (__propIsEnum$1.call(b, prop))
        __defNormalProp$1(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
let current;
const internalLocale = writable(null);
function getSubLocales(refLocale) {
  return refLocale.split("-").map((_, i, arr) => arr.slice(0, i + 1).join("-")).reverse();
}
function getPossibleLocales(refLocale, fallbackLocale = getOptions().fallbackLocale) {
  const locales = getSubLocales(refLocale);
  if (fallbackLocale) {
    return [.../* @__PURE__ */ new Set([...locales, ...getSubLocales(fallbackLocale)])];
  }
  return locales;
}
function getCurrentLocale() {
  return current != null ? current : void 0;
}
internalLocale.subscribe((newLocale) => {
  current = newLocale != null ? newLocale : void 0;
  if (typeof window !== "undefined" && newLocale != null) {
    document.documentElement.setAttribute("lang", newLocale);
  }
});
const set = (newLocale) => {
  if (newLocale && getClosestAvailableLocale(newLocale) && hasLocaleQueue(newLocale)) {
    const { loadingDelay } = getOptions();
    let loadingTimer;
    if (typeof window !== "undefined" && getCurrentLocale() != null && loadingDelay) {
      loadingTimer = window.setTimeout(
        () => $isLoading.set(true),
        loadingDelay
      );
    } else {
      $isLoading.set(true);
    }
    return flush$1(newLocale).then(() => {
      internalLocale.set(newLocale);
    }).finally(() => {
      clearTimeout(loadingTimer);
      $isLoading.set(false);
    });
  }
  return internalLocale.set(newLocale);
};
const $locale = __spreadProps(__spreadValues$1({}, internalLocale), {
  set
});
const getLocaleFromNavigator = () => {
  if (typeof window === "undefined")
    return null;
  return window.navigator.language || window.navigator.languages[0];
};
const monadicMemoize = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null);
  const memoizedFn = (arg) => {
    const cacheKey = JSON.stringify(arg);
    if (cacheKey in cache) {
      return cache[cacheKey];
    }
    return cache[cacheKey] = fn(arg);
  };
  return memoizedFn;
};
var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
const getIntlFormatterOptions = (type, name) => {
  const { formats } = getOptions();
  if (type in formats && name in formats[type]) {
    return formats[type][name];
  }
  throw new Error(`[svelte-i18n] Unknown "${name}" ${type} format.`);
};
const createNumberFormatter = monadicMemoize(
  (_a) => {
    var _b = _a, { locale: locale2, format } = _b, options2 = __objRest(_b, ["locale", "format"]);
    if (locale2 == null) {
      throw new Error('[svelte-i18n] A "locale" must be set to format numbers');
    }
    if (format) {
      options2 = getIntlFormatterOptions("number", format);
    }
    return new Intl.NumberFormat(locale2, options2);
  }
);
const createDateFormatter = monadicMemoize(
  (_c) => {
    var _d = _c, { locale: locale2, format } = _d, options2 = __objRest(_d, ["locale", "format"]);
    if (locale2 == null) {
      throw new Error('[svelte-i18n] A "locale" must be set to format dates');
    }
    if (format) {
      options2 = getIntlFormatterOptions("date", format);
    } else if (Object.keys(options2).length === 0) {
      options2 = getIntlFormatterOptions("date", "short");
    }
    return new Intl.DateTimeFormat(locale2, options2);
  }
);
const createTimeFormatter = monadicMemoize(
  (_e) => {
    var _f = _e, { locale: locale2, format } = _f, options2 = __objRest(_f, ["locale", "format"]);
    if (locale2 == null) {
      throw new Error(
        '[svelte-i18n] A "locale" must be set to format time values'
      );
    }
    if (format) {
      options2 = getIntlFormatterOptions("time", format);
    } else if (Object.keys(options2).length === 0) {
      options2 = getIntlFormatterOptions("time", "short");
    }
    return new Intl.DateTimeFormat(locale2, options2);
  }
);
const getNumberFormatter = (_g = {}) => {
  var _h = _g, {
    locale: locale2 = getCurrentLocale()
  } = _h, args = __objRest(_h, [
    "locale"
  ]);
  return createNumberFormatter(__spreadValues({ locale: locale2 }, args));
};
const getDateFormatter = (_i = {}) => {
  var _j = _i, {
    locale: locale2 = getCurrentLocale()
  } = _j, args = __objRest(_j, [
    "locale"
  ]);
  return createDateFormatter(__spreadValues({ locale: locale2 }, args));
};
const getTimeFormatter = (_k = {}) => {
  var _l = _k, {
    locale: locale2 = getCurrentLocale()
  } = _l, args = __objRest(_l, [
    "locale"
  ]);
  return createTimeFormatter(__spreadValues({ locale: locale2 }, args));
};
const getMessageFormatter = monadicMemoize(
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  (message, locale2 = getCurrentLocale()) => new IntlMessageFormat(message, locale2, getOptions().formats, {
    ignoreTag: getOptions().ignoreTag
  })
);
const formatMessage = (id, options2 = {}) => {
  var _a, _b, _c, _d;
  let messageObj = options2;
  if (typeof id === "object") {
    messageObj = id;
    id = messageObj.id;
  }
  const {
    values,
    locale: locale2 = getCurrentLocale(),
    default: defaultValue
  } = messageObj;
  if (locale2 == null) {
    throw new Error(
      "[svelte-i18n] Cannot format a message without first setting the initial locale."
    );
  }
  let message = lookup(id, locale2);
  if (!message) {
    message = (_d = (_c = (_b = (_a = getOptions()).handleMissingMessage) == null ? void 0 : _b.call(_a, { locale: locale2, id, defaultValue })) != null ? _c : defaultValue) != null ? _d : id;
  } else if (typeof message !== "string") {
    console.warn(
      `[svelte-i18n] Message with id "${id}" must be of type "string", found: "${typeof message}". Gettin its value through the "$format" method is deprecated; use the "json" method instead.`
    );
    return message;
  }
  if (!values) {
    return message;
  }
  let result = message;
  try {
    result = getMessageFormatter(message, locale2).format(values);
  } catch (e) {
    if (e instanceof Error) {
      console.warn(
        `[svelte-i18n] Message "${id}" has syntax error:`,
        e.message
      );
    }
  }
  return result;
};
const formatTime = (t, options2) => {
  return getTimeFormatter(options2).format(t);
};
const formatDate = (d, options2) => {
  return getDateFormatter(options2).format(d);
};
const formatNumber = (n, options2) => {
  return getNumberFormatter(options2).format(n);
};
const getJSON = (id, locale2 = getCurrentLocale()) => {
  return lookup(id, locale2);
};
const $format = derived([$locale, $dictionary], () => formatMessage);
derived([$locale], () => formatTime);
derived([$locale], () => formatDate);
derived([$locale], () => formatNumber);
derived([$locale, $dictionary], () => getJSON);
var defaultBnIcon = `<svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="56" height="56" rx="8" fill="#262A3D"/>
<g clip-path="url(#clip0_15747_103507)">
<path d="M20.6176 35.9801L16.0142 27.9949H25.2218L29.826 35.9801H20.6176Z" fill="#262A3D"/>
<path d="M20.6176 35.9801L16.0142 27.9949H25.2218L29.826 35.9801H20.6176Z" fill="white"/>
<path d="M25.2218 27.9947H16.0142L20.6176 20.0095H29.826L25.2218 27.9947Z" fill="url(#paint0_linear_15747_103507)"/>
<path d="M34.4302 27.9948L29.826 20.0096H20.6176L16.0142 12.0244H34.4302L43.6379 27.9948H34.4302Z" fill="#262A3D"/>
<path d="M34.4302 27.9948L29.826 20.0096H20.6176L16.0142 12.0244H34.4302L43.6379 27.9948H34.4302Z" fill="white"/>
<path d="M34.4302 43.9652H16.0142L20.6176 35.9801H29.826L34.4302 27.9949H43.6379L34.4302 43.9652Z" fill="url(#paint1_linear_15747_103507)"/>
</g>
<defs>
<linearGradient id="paint0_linear_15747_103507" x1="16.0142" y1="24.0021" x2="29.826" y2="24.0021" gradientUnits="userSpaceOnUse">
<stop stop-color="#55CCFE"/>
<stop offset="1" stop-color="#5E93EF"/>
</linearGradient>
<linearGradient id="paint1_linear_15747_103507" x1="76.5102" y1="5214.05" x2="10391.8" y2="5214.05" gradientUnits="userSpaceOnUse">
<stop stop-color="#55CCFE"/>
<stop offset="1" stop-color="#5E93EF"/>
</linearGradient>
<clipPath id="clip0_15747_103507">
<rect width="27.6667" height="32" fill="white" transform="translate(16 12)"/>
</clipPath>
</defs>
</svg>
`;
var poweredByBlocknative = `
<svg width="152" height="16" viewBox="0 0 152 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.03641 6.252C3.23241 6.252 2.41641 6.636 2.04441 7.272V6.396H1.00041V14.724H2.04441V11.124C2.41641 11.784 3.20841 12.144 4.04841 12.144C5.58441 12.144 6.84441 10.98 6.84441 9.204C6.84441 7.44 5.57241 6.252 4.03641 6.252ZM3.94041 11.16C3.02841 11.16 2.04441 10.428 2.04441 9.216C2.04441 8.016 2.94441 7.236 3.94041 7.236C4.97241 7.236 5.78841 8.1 5.78841 9.216C5.78841 10.344 4.97241 11.16 3.94041 11.16ZM10.8452 12.144C12.4412 12.144 13.7852 10.968 13.7852 9.192C13.7852 7.416 12.4412 6.252 10.8452 6.252C9.24919 6.252 7.91719 7.416 7.91719 9.192C7.91719 10.968 9.24919 12.144 10.8452 12.144ZM10.8452 11.16C9.82519 11.16 8.97319 10.356 8.97319 9.192C8.97319 8.04 9.82519 7.236 10.8452 7.236C11.8772 7.236 12.7412 8.04 12.7412 9.192C12.7412 10.356 11.8772 11.16 10.8452 11.16ZM22.2729 6.396L20.8449 10.38L19.4049 6.396H18.3849L16.9569 10.38L15.5289 6.396H14.4009L16.5369 12H17.4009L18.8889 7.836L20.4369 12H21.3129L23.4009 6.396H22.2729ZM29.6948 9.18C29.6948 7.404 28.5068 6.252 26.9108 6.252C25.3148 6.252 24.0308 7.404 24.0308 9.18C24.0308 10.956 25.3148 12.144 26.9108 12.144C27.9908 12.144 28.9988 11.616 29.4788 10.644L28.5788 10.284C28.2548 10.848 27.6308 11.16 26.9468 11.16C25.9868 11.16 25.2668 10.644 25.1108 9.648H29.6708C29.6828 9.492 29.6948 9.336 29.6948 9.18ZM25.1228 8.748C25.2908 7.74 25.9628 7.236 26.9108 7.236C27.8348 7.236 28.5188 7.788 28.6508 8.748H25.1228ZM33.7456 6.252C33.0016 6.252 32.4616 6.684 32.1736 7.668V6.396H31.1176V12H32.1736V9.948C32.1736 8.472 32.6176 7.26 33.7336 7.26C33.9496 7.26 34.2496 7.308 34.5496 7.452L34.7176 6.468C34.5496 6.36 34.1416 6.252 33.7456 6.252ZM40.8627 9.18C40.8627 7.404 39.6747 6.252 38.0787 6.252C36.4827 6.252 35.1987 7.404 35.1987 9.18C35.1987 10.956 36.4827 12.144 38.0787 12.144C39.1587 12.144 40.1667 11.616 40.6467 10.644L39.7467 10.284C39.4227 10.848 38.7987 11.16 38.1147 11.16C37.1547 11.16 36.4347 10.644 36.2787 9.648H40.8387C40.8507 9.492 40.8627 9.336 40.8627 9.18ZM36.2907 8.748C36.4587 7.74 37.1307 7.236 38.0787 7.236C39.0027 7.236 39.6867 7.788 39.8187 8.748H36.2907ZM46.7136 3.348V7.272C46.3416 6.612 45.5496 6.252 44.7096 6.252C43.1736 6.252 41.9136 7.416 41.9136 9.192C41.9136 10.956 43.1856 12.144 44.7216 12.144C45.5256 12.144 46.3416 11.76 46.7136 11.124V12H47.7576V3.348H46.7136ZM44.8056 11.16C43.7856 11.16 42.9696 10.296 42.9696 9.18C42.9696 8.052 43.7856 7.236 44.8056 7.236C45.7296 7.236 46.7136 7.968 46.7136 9.18C46.7136 10.38 45.8136 11.16 44.8056 11.16ZM55.6695 6.252C54.8295 6.252 54.0375 6.612 53.6655 7.272V3.348H52.6215V12H53.6655V11.124C54.0375 11.76 54.8535 12.144 55.6575 12.144C57.1935 12.144 58.4655 10.956 58.4655 9.192C58.4655 7.416 57.2055 6.252 55.6695 6.252ZM55.5615 11.16C54.5655 11.16 53.6655 10.38 53.6655 9.18C53.6655 7.968 54.6495 7.236 55.5615 7.236C56.5935 7.236 57.4095 8.052 57.4095 9.18C57.4095 10.296 56.5935 11.16 55.5615 11.16ZM63.6097 6.396L61.8937 10.524L60.2017 6.396H59.0737L61.3297 11.832L60.1537 14.724H61.2577L64.7377 6.396H63.6097Z" fill="var(--w3o-text-color, #707481)"/>
<g clip-path="url(#clip0_13558_103869)">
<path d="M143.502 11.0888L141.863 8.24889H145.142L146.782 11.0888H143.502Z" fill="currentColor"/>
<path d="M145.142 8.24887H141.863L143.502 5.40895H146.782L145.142 8.24887Z" fill="url(#paint0_linear_13558_103869)"/>
<path d="M148.421 8.24888L146.782 5.40896H143.502L141.863 2.56903H148.421L151.701 8.24888H148.421Z" fill="currentColor"/>
<path d="M148.421 13.9287H141.863L143.502 11.0888H146.782L148.421 8.24889H151.701L148.421 13.9287Z" fill="url(#paint1_linear_13558_103869)"/>
<path d="M76.4774 8.89232C76.4774 10.9327 74.9716 12.5077 73.1366 12.5077C72.1369 12.5077 71.4106 12.1378 70.9181 11.508V12.316H69.1513V2.71994L70.9181 2.17606V6.27771C71.4106 5.64894 72.1369 5.27797 73.1366 5.27797C74.9716 5.27797 76.4774 6.85198 76.4774 8.89232ZM74.7106 8.89232C74.7106 7.73959 73.9037 6.96201 72.8076 6.96201C71.7114 6.96201 70.9213 7.74273 70.9213 8.89232C70.9213 10.0419 71.7292 10.8237 72.8076 10.8237C73.8859 10.8237 74.7106 10.043 74.7106 8.89232Z" fill="currentColor"/>
<path d="M77.2718 2.71994L79.0376 2.17606V12.316H77.2718V2.71994Z" fill="currentColor"/>
<path d="M79.8183 8.89232C79.8171 8.17544 80.0286 7.47431 80.4261 6.87774C80.8236 6.28117 81.3893 5.816 82.0514 5.54113C82.7135 5.26627 83.4422 5.19408 84.1454 5.33371C84.8485 5.47333 85.4944 5.8185 86.0013 6.32549C86.5081 6.83247 86.8531 7.47847 86.9925 8.18166C87.1319 8.88486 87.0595 9.61361 86.7845 10.2756C86.5094 10.9376 86.0441 11.5031 85.4474 11.9005C84.8507 12.2978 84.1495 12.5092 83.4326 12.5077C82.9565 12.5128 82.4842 12.4227 82.0433 12.2428C81.6024 12.0629 81.2019 11.7967 80.8653 11.46C80.5286 11.1232 80.2626 10.7227 80.0828 10.2817C79.903 9.84083 79.8131 9.36845 79.8183 8.89232ZM85.2948 8.89232C85.2948 7.78359 84.4869 7.00602 83.4326 7.00602C82.3784 7.00602 81.5841 7.78674 81.5841 8.89232C81.5841 9.9979 82.392 10.7786 83.4326 10.7786C84.4733 10.7786 85.2948 10.0021 85.2948 8.89232Z" fill="currentColor"/>
<path d="M87.7313 8.89233C87.7313 6.85198 89.2645 5.27797 91.3457 5.27797C92.6881 5.27797 93.8513 5.98952 94.413 7.04375L92.8935 7.93451C92.6189 7.37281 92.03 7.01651 91.3321 7.01651C90.2778 7.01651 89.4971 7.79723 89.4971 8.89233C89.4971 9.98743 90.2778 10.7545 91.3321 10.7545C92.0447 10.7545 92.6326 10.4129 92.904 9.8512L94.4371 10.7273C94.1281 11.2741 93.6779 11.7279 93.1335 12.0413C92.5891 12.3547 91.9706 12.5161 91.3425 12.5088C89.2645 12.5077 87.7313 10.9327 87.7313 8.89233Z" fill="currentColor"/>
<path d="M99.5123 12.316L97.0203 9.20776V12.316H95.2534V2.71994L97.0203 2.17606V8.48153L99.374 5.46974H101.482L98.7316 8.85145L101.566 12.316H99.5123Z" fill="currentColor"/>
<path d="M108.623 8.11161V12.316H106.856V8.33377C106.856 7.40215 106.296 6.92324 105.501 6.92324C104.639 6.92324 103.994 7.4294 103.994 8.62091V12.316H102.229V5.46974H103.994V6.23579C104.405 5.6196 105.118 5.27797 106.035 5.27797C107.486 5.27797 108.623 6.29657 108.623 8.11161Z" fill="currentColor"/>
<path d="M116.74 5.46974V12.316H114.975V11.508C114.481 12.1242 113.742 12.5077 112.743 12.5077C110.921 12.5077 109.415 10.9358 109.415 8.89233C109.415 6.84884 110.921 5.27797 112.743 5.27797C113.742 5.27797 114.481 5.66152 114.975 6.27771V5.46974H116.74ZM114.975 8.89233C114.975 7.73959 114.167 6.96201 113.071 6.96201C111.974 6.96201 111.184 7.74273 111.184 8.89233C111.184 10.0419 111.992 10.8237 113.071 10.8237C114.149 10.8237 114.975 10.043 114.975 8.89233Z" fill="currentColor"/>
<path d="M121.344 7.16742V5.46975H119.796V3.45665L118.027 4.00053V10.0157C118.027 11.8643 118.866 12.5895 121.342 12.3212V10.7137C120.329 10.7692 119.794 10.7545 119.794 10.0157V7.16742H121.344Z" fill="currentColor"/>
<path d="M122.582 5.46974H124.347V12.316H122.582V5.46974Z" fill="currentColor"/>
<path d="M132.293 5.46974L129.691 12.316H127.678L125.077 5.46974H127.021L128.678 10.262L130.348 5.46974H132.293Z" fill="currentColor"/>
<path d="M136.073 10.9075C136.757 10.9075 137.305 10.6204 137.607 10.2232L139.03 11.0448C138.387 11.9754 137.36 12.5119 136.046 12.5119C133.74 12.5119 132.294 10.94 132.294 8.89652C132.294 6.85303 133.761 5.28217 135.908 5.28217C137.935 5.28217 139.373 6.88447 139.373 8.89652C139.37 9.13886 139.346 9.38049 139.301 9.61856H134.143C134.389 10.5219 135.142 10.9075 136.073 10.9075ZM137.607 8.25099C137.387 7.26487 136.648 6.8677 135.908 6.8677C134.965 6.8677 134.321 7.37491 134.114 8.25099H137.607Z" fill="currentColor"/>
</g>
<defs>
<linearGradient id="paint0_linear_13558_103869" x1="141.863" y1="6.82891" x2="146.782" y2="6.82891" gradientUnits="userSpaceOnUse">
<stop stop-color="#55CCFE"/>
<stop offset="1" stop-color="#5E93EF"/>
</linearGradient>
<linearGradient id="paint1_linear_13558_103869" x1="6973.93" y1="500.862" x2="7897.53" y2="500.862" gradientUnits="userSpaceOnUse">
<stop stop-color="#55CCFE"/>
<stop offset="1" stop-color="#5E93EF"/>
</linearGradient>
<clipPath id="clip0_13558_103869">
<rect width="82.8232" height="12" fill="white" transform="translate(69.0884 2)"/>
</clipPath>
</defs>
</svg>
`;
var ethereumIcon = `
  <svg height="100%" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.99902 0.12619V5.20805L9.58065 7.12736L4.99902 0.12619Z" fill="white" fill-opacity="0.602"/>
    <path d="M4.99923 0.12619L0.416992 7.12736L4.99923 5.20805V0.12619Z" fill="white"/>
    <path d="M4.99902 10.4207V13.8737L9.58371 7.92728L4.99902 10.4207Z" fill="white" fill-opacity="0.602"/>
    <path d="M4.99923 13.8737V10.4201L0.416992 7.92728L4.99923 13.8737Z" fill="white"/>
    <path d="M4.99902 9.62134L9.58065 7.12739L4.99902 5.20923V9.62134Z" fill="white" fill-opacity="0.2"/>
    <path d="M0.416992 7.12739L4.99923 9.62134V5.20923L0.416992 7.12739Z" fill="white" fill-opacity="0.602"/>
  </svg>
`;
var polygonIcon = `
  <svg width="100%" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.5091 4.05856C10.2585 3.91901 9.9362 3.91901 9.64974 4.05856L7.64453 5.20986L6.28385 5.94251L4.31445 7.09382C4.0638 7.23337 3.74154 7.23337 3.45508 7.09382L1.91536 6.18673C1.66471 6.04718 1.48568 5.76807 1.48568 5.45408V3.70968C1.48568 3.43057 1.62891 3.15147 1.91536 2.97703L3.45508 2.10483C3.70573 1.96527 4.02799 1.96527 4.31445 2.10483L5.85417 3.01192C6.10482 3.15147 6.28385 3.43057 6.28385 3.74457V4.89587L7.64453 4.12833V2.94214C7.64453 2.66304 7.5013 2.38393 7.21484 2.20949L4.35026 0.569752C4.09961 0.4302 3.77734 0.4302 3.49089 0.569752L0.554687 2.24438C0.268229 2.38393 0.125 2.66304 0.125 2.94214V6.22162C0.125 6.50072 0.268229 6.77983 0.554687 6.95427L3.45508 8.59401C3.70573 8.73356 4.02799 8.73356 4.31445 8.59401L6.28385 7.47759L7.64453 6.71005L9.61393 5.59363C9.86458 5.45408 10.1868 5.45408 10.4733 5.59363L12.013 6.46583C12.2637 6.60539 12.4427 6.88449 12.4427 7.19848V8.94289C12.4427 9.22199 12.2995 9.50109 12.013 9.67553L10.5091 10.5477C10.2585 10.6873 9.9362 10.6873 9.64974 10.5477L8.11002 9.67553C7.85937 9.53598 7.68034 9.25688 7.68034 8.94289V7.82647L6.31966 8.59401V9.74531C6.31966 10.0244 6.46289 10.3035 6.74935 10.478L9.64974 12.1177C9.90039 12.2572 10.2227 12.2572 10.5091 12.1177L13.4095 10.478C13.6602 10.3384 13.8392 10.0593 13.8392 9.74531V6.43095C13.8392 6.15184 13.696 5.87274 13.4095 5.6983L10.5091 4.05856Z" fill="white"/>
  </svg>
`;
var binanceIcon = `
  <svg width="100%" height="100%" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.32975 5.90275L7 3.2325L9.67163 5.90413L11.2254 4.35038L7 0.125L2.776 4.349L4.32975 5.90275ZM0.125 7L1.67875 5.44625L3.2325 7L1.67875 8.55375L0.125 7ZM4.32975 8.09725L7 10.7675L9.67163 8.09587L11.2254 9.64894L7 13.875L2.776 9.651L2.77394 9.64894L4.32975 8.09725ZM10.7675 7L12.3212 5.44625L13.875 7L12.3212 8.55375L10.7675 7ZM8.57575 6.99863H8.57713V7L7 8.57713L5.42494 7.00275L5.42219 7L5.42494 6.99794L5.70062 6.72156L5.83469 6.5875L7 5.42288L8.57644 6.99931L8.57575 6.99863Z" fill="white"/>
  </svg>
`;
var fantomIcon = `
  <svg height="100%" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.26613 0.133876C5.46683 0.0457135 5.68592 0 5.90775 0C6.12958 0 6.34867 0.0457135 6.54938 0.133876L10.2679 1.9598C10.3617 1.99893 10.4437 2.05898 10.5068 2.13465C10.5699 2.21033 10.6121 2.29932 10.6298 2.3938H10.6335V11.5637C10.6245 11.6667 10.5857 11.7654 10.5213 11.8495C10.457 11.9336 10.3694 11.9998 10.2679 12.0411L6.54938 13.8656C6.34867 13.9538 6.12958 13.9995 5.90775 13.9995C5.68592 13.9995 5.46683 13.9538 5.26613 13.8656L1.54762 12.0397C1.44724 11.9979 1.36095 11.9313 1.29799 11.8472C1.23504 11.7631 1.19779 11.6646 1.19025 11.5623C1.19025 11.5465 1.19025 11.5332 1.19025 11.522V2.39205C1.20579 2.29767 1.24673 2.20852 1.30923 2.13292C1.37173 2.05733 1.45375 1.99776 1.54762 1.9598L5.26613 0.133876ZM10.0478 7.50898L6.54938 9.22396C6.34872 9.31229 6.12961 9.35809 5.90775 9.35809C5.68589 9.35809 5.46678 9.31229 5.26613 9.22396L1.77525 7.51283V11.5455L5.26613 13.2493C5.43937 13.3471 5.62982 13.4154 5.82863 13.4512L5.9085 13.4558C6.12668 13.4357 6.3373 13.3704 6.525 13.2647L10.05 11.5301V7.50898H10.0478ZM0.585375 11.3642C0.568078 11.6186 0.612957 11.8734 0.716625 12.1093C0.805331 12.2602 0.936232 12.3857 1.09538 12.4726L1.10662 12.4796C1.1505 12.5069 1.1985 12.5356 1.25663 12.5692L1.32563 12.6081L1.53675 12.7267L1.23375 13.1922L0.9975 13.0592L0.95775 13.0365C0.889125 12.9973 0.8325 12.9637 0.779625 12.9315C0.214875 12.5769 0.004125 12.1912 0 11.3887V11.3642H0.585H0.585375ZM5.61412 5.05096C5.58845 5.05933 5.5634 5.06926 5.53912 5.08071L1.82137 6.90524L1.81013 6.91119H1.80675L1.81275 6.91469L1.82137 6.91889L5.53988 8.74341C5.56405 8.75505 5.58912 8.76499 5.61487 8.77316L5.61412 5.05096ZM6.201 5.05096V8.77456C6.22675 8.76639 6.25182 8.75645 6.276 8.74481L9.9945 6.92029L10.0057 6.91434H10.0091L10.0031 6.91154L9.9945 6.90699L6.276 5.08246C6.25182 5.07083 6.22675 5.06088 6.201 5.05271V5.05096ZM10.0478 3.04479L6.71025 4.68137L10.0478 6.31795V3.04304V3.04479ZM1.77525 3.04864V6.3141L5.103 4.68137L1.77525 3.04864ZM6.27525 0.61617C6.15894 0.569406 6.03364 0.545286 5.907 0.545286C5.78036 0.545286 5.65506 0.569406 5.53875 0.61617L1.821 2.4393L1.80975 2.4449L1.80638 2.44665L1.81238 2.4498L1.821 2.45365L5.5395 4.27817C5.65571 4.32526 5.78106 4.34956 5.90775 4.34956C6.03444 4.34956 6.15979 4.32526 6.276 4.27817L9.9945 2.45365L10.0057 2.4498L10.0091 2.44805L10.0031 2.4449L9.9945 2.4407L6.27525 0.61617ZM10.5968 0.816717L10.833 0.949365L10.875 0.970015C10.9432 1.00921 10.9999 1.04316 11.0528 1.07501C11.6179 1.42851 11.8282 1.81455 11.8328 2.61709V2.64159H11.2459C11.2632 2.38703 11.2183 2.13212 11.1146 1.8961C11.0258 1.74528 10.8948 1.61983 10.7355 1.53316L10.7242 1.52616C10.6807 1.49851 10.6327 1.47016 10.5743 1.43656L10.5056 1.39981L10.2945 1.28151L10.5975 0.816017L10.5968 0.816717Z" fill="white"/>
  </svg>
`;
var optimismIcon = `
  <svg width="100%" viewBox="0 0 17 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.33611 9.25254C2.38341 9.25254 1.60287 9.02834 0.99442 8.58002C0.393974 8.1237 0.09375 7.47526 0.09375 6.63462C0.09375 6.45849 0.113782 6.2423 0.153782 5.9861C0.257909 5.40972 0.406006 4.71718 0.598133 3.9086C1.14252 1.707 2.54757 0.606201 4.81323 0.606201C5.42967 0.606201 5.98206 0.710266 6.47044 0.918394C6.95882 1.11852 7.34308 1.42278 7.62327 1.8311C7.90346 2.23135 8.04362 2.71174 8.04362 3.27212C8.04362 3.44025 8.02359 3.65241 7.98352 3.9086C7.86346 4.62111 7.71933 5.31366 7.55121 5.9861C7.27101 7.08294 6.78666 7.90354 6.09815 8.44793C5.40964 8.98431 4.489 9.25254 3.33611 9.25254ZM3.50424 7.52326C3.95262 7.52326 4.33284 7.39116 4.6451 7.12697C4.96535 6.86278 5.19351 6.45849 5.32958 5.9141C5.51371 5.16153 5.65387 4.50502 5.74993 3.94463C5.78193 3.7765 5.79793 3.60441 5.79793 3.42822C5.79793 2.6997 5.41764 2.33542 4.65713 2.33542C4.20875 2.33542 3.82449 2.46751 3.50424 2.7317C3.19205 2.99596 2.96786 3.40025 2.83179 3.94463C2.68766 4.48102 2.54354 5.13753 2.39947 5.9141C2.36741 6.07417 2.35141 6.2423 2.35141 6.41842C2.35141 7.155 2.73573 7.52326 3.50424 7.52326Z" fill="white"/>
    <path d="M8.59569 9.13247C8.50762 9.13247 8.43953 9.10443 8.39153 9.04837C8.35146 8.98431 8.33949 8.9123 8.35549 8.83224L10.0127 1.02648C10.0287 0.938417 10.0727 0.866353 10.1448 0.810289C10.2169 0.754289 10.2929 0.726257 10.373 0.726257H13.5673C14.456 0.726257 15.1685 0.910385 15.7049 1.27864C16.2493 1.64696 16.5215 2.17931 16.5215 2.87582C16.5215 3.07595 16.4975 3.28415 16.4495 3.50027C16.2493 4.42098 15.845 5.10149 15.2366 5.54181C14.6361 5.98213 13.8115 6.20229 12.7627 6.20229H11.1415L10.5892 8.83224C10.5731 8.92031 10.5291 8.99231 10.4571 9.04837C10.385 9.10443 10.3089 9.13247 10.2289 9.13247H8.59569ZM12.8468 4.54507C13.183 4.54507 13.4752 4.45298 13.7234 4.26885C13.9796 4.08472 14.1478 3.82053 14.2278 3.47627C14.2518 3.34015 14.2639 3.22008 14.2639 3.11602C14.2639 2.88383 14.1958 2.7077 14.0597 2.58763C13.9236 2.45951 13.6914 2.3955 13.3632 2.3955H11.9221L11.4658 4.54507H12.8468Z" fill="white"/>
  </svg>
`;
var avalancheIcon = `
  <svg width="100%" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.8682 0.489349H0.110352V18.4468H19.8682V0.489349Z" fill="white"/>
  </svg>
`;
var celoIcon = `
  <svg width="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.1511 8.08001C19.1511 4.11201 15.9191 0.880005 11.9511 0.880005C8.94313 0.880005 6.38313 2.70401 5.29513 5.32801C2.73513 6.41601 0.911133 8.976 0.911133 11.952C0.911133 15.92 4.14313 19.152 8.11113 19.152C11.1191 19.152 13.6791 17.328 14.7671 14.704C17.2951 13.616 19.1511 11.056 19.1511 8.08001ZM8.11113 17.36C5.13513 17.36 2.70313 14.928 2.70313 11.952C2.70313 10.256 3.50313 8.72001 4.75113 7.72801C4.75113 7.85601 4.75113 7.98401 4.75113 8.08001C4.75113 12.048 7.98313 15.28 11.9511 15.28C12.1111 15.28 12.2391 15.28 12.3991 15.28C11.3751 16.56 9.83913 17.36 8.11113 17.36ZM13.3591 13.296C12.9111 13.424 12.4311 13.488 11.9511 13.488C8.97513 13.488 6.54313 11.056 6.54313 8.08001C6.54313 7.60001 6.60713 7.15201 6.73513 6.736C7.18313 6.60801 7.66313 6.54401 8.14313 6.54401C11.1191 6.54401 13.5511 8.976 13.5511 11.952C13.5191 12.432 13.4551 12.88 13.3591 13.296ZM15.3111 12.304C15.3111 12.176 15.3111 12.048 15.3111 11.952C15.3111 7.984 12.0791 4.752 8.11113 4.752C7.95113 4.752 7.82313 4.752 7.66313 4.752C8.65513 3.472 10.1911 2.67201 11.9191 2.67201C14.8951 2.67201 17.3271 5.10401 17.3271 8.08001C17.3271 9.80801 16.5271 11.312 15.3111 12.304Z" fill="white"/>
  </svg>
`;
var gnosisIcon = `
  <svg width="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32C24.8366 32 32 24.8366 32 16Z" fill="#04795B"/>
    <path d="M11.6529 17.4492C12.2831 17.4492 12.8648 17.2392 13.3334 16.8758L9.4877 13.0316C9.12413 13.4919 8.9141 14.0734 8.9141 14.7114C8.906 16.2216 10.134 17.4492 11.6529 17.4492Z" fill="#EFEFEF"/>
    <path d="M23.0931 14.7033C23.0931 14.0734 22.8831 13.4919 22.5195 13.0234L18.6738 16.8677C19.1343 17.2311 19.716 17.4411 20.3543 17.4411C21.8651 17.4492 23.0931 16.2216 23.0931 14.7033Z" fill="#EFEFEF"/>
    <path d="M25.0322 10.528L23.3275 12.2321C23.8931 12.9105 24.2324 13.7666 24.2324 14.7195C24.2324 16.8597 22.4954 18.5961 20.3544 18.5961C19.4092 18.5961 18.5447 18.2569 17.866 17.6915L15.9998 19.5571L14.1335 17.6915C13.4549 18.2569 12.5985 18.5961 11.6451 18.5961C9.50416 18.5961 7.7672 16.8597 7.7672 14.7195C7.7672 13.7746 8.10651 12.9105 8.67206 12.2321L7.79947 11.3599L6.96736 10.528C5.99787 12.1271 5.44043 13.9927 5.44043 15.9956C5.44043 21.8265 10.1667 26.543 15.9917 26.543C21.8167 26.543 26.543 21.8185 26.543 15.9956C26.5591 13.9846 26.0017 12.119 25.0322 10.528Z" fill="#EFEFEF"/>
    <path d="M23.6338 8.71084C21.7191 6.6999 19.0045 5.44 15.9991 5.44C12.9937 5.44 10.2872 6.6999 8.36435 8.71084C8.10584 8.98545 7.85539 9.27617 7.62109 9.575L15.991 17.9419L24.361 9.56695C24.1509 9.27617 23.9005 8.97734 23.6338 8.71084ZM15.9991 6.81297C18.4713 6.81297 20.7658 7.76593 22.4866 9.50231L15.9991 15.9874L9.5116 9.50231C11.2405 7.76593 13.5269 6.81297 15.9991 6.81297Z" fill="#EFEFEF"/>
  </svg>
`;
var harmonyOneIcon = `
  <svg width="100%" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5484 1.04102e-06C11.6346 -0.000708404 10.7578 0.361217 10.1105 1.00633C9.46322 1.65145 9.09835 2.52703 9.096 3.44089V7.256C8.74045 7.28 8.37689 7.29511 8 7.29511C7.62311 7.29511 7.26133 7.31022 6.904 7.33156V3.44089C6.88946 2.53496 6.51938 1.67105 5.87358 1.03553C5.22779 0.400017 4.35805 0.0438409 3.452 0.0438409C2.54595 0.0438409 1.67621 0.400017 1.03042 1.03553C0.384623 1.67105 0.0145378 2.53496 0 3.44089V12.5591C0.0145378 13.465 0.384623 14.329 1.03042 14.9645C1.67621 15.6 2.54595 15.9562 3.452 15.9562C4.35805 15.9562 5.22779 15.6 5.87358 14.9645C6.51938 14.329 6.88946 13.465 6.904 12.5591V8.744C7.25956 8.72 7.62311 8.70489 8 8.70489C8.37689 8.70489 8.73867 8.68978 9.096 8.66845V12.5591C9.11054 13.465 9.48062 14.329 10.1264 14.9645C10.7722 15.6 11.6419 15.9562 12.548 15.9562C13.4541 15.9562 14.3238 15.6 14.9696 14.9645C15.6154 14.329 15.9855 13.465 16 12.5591V3.44089C15.9976 2.52719 15.6329 1.65173 14.9858 1.00665C14.3387 0.361557 13.4622 -0.000472854 12.5484 1.04102e-06ZM3.45156 1.40978C3.99089 1.40954 4.50828 1.62326 4.89023 2.00404C5.27218 2.38482 5.48748 2.90156 5.48889 3.44089V7.48089C4.47892 7.62724 3.49264 7.90609 2.55556 8.31023C2.14954 8.48842 1.76733 8.71655 1.41778 8.98934V3.44089C1.41919 2.90218 1.634 2.38597 2.01518 2.00529C2.39636 1.62462 2.91284 1.41048 3.45156 1.40978ZM5.48889 12.5591C5.48889 13.0994 5.27424 13.6177 4.89217 13.9997C4.51009 14.3818 3.99189 14.5964 3.45156 14.5964C2.91122 14.5964 2.39302 14.3818 2.01094 13.9997C1.62887 13.6177 1.41422 13.0994 1.41422 12.5591V11.6444C1.41422 10.8364 2.05422 10.0711 3.12711 9.59467C3.88309 9.26852 4.6763 9.03656 5.48889 8.904V12.5591ZM12.5484 14.5902C12.0091 14.5905 11.4917 14.3767 11.1098 13.996C10.7278 13.6152 10.5125 13.0984 10.5111 12.5591V8.51911C11.5211 8.37276 12.5074 8.09392 13.4444 7.68978C13.8505 7.51159 14.2327 7.28345 14.5822 7.01067V12.5591C14.5808 13.0978 14.366 13.614 13.9848 13.9947C13.6036 14.3754 13.0872 14.5895 12.5484 14.5902ZM12.8729 6.4C12.1169 6.72615 11.3237 6.95811 10.5111 7.09067V3.44089C10.5111 2.90056 10.7258 2.38235 11.1078 2.00028C11.4899 1.6182 12.0081 1.40356 12.5484 1.40356C13.0888 1.40356 13.607 1.6182 13.9891 2.00028C14.3711 2.38235 14.5858 2.90056 14.5858 3.44089V4.35556C14.5858 5.16 13.9458 5.92534 12.8729 6.4Z" fill="url(#paint0_linear_10254_2422)"/>
    <defs>
      <linearGradient id="paint0_linear_10254_2422" x1="1.01333" y1="14.7674" x2="14.8954" y2="0.847434" gradientUnits="userSpaceOnUse">
        <stop stop-color="#00AEE9"/>
        <stop offset="1" stop-color="#69FABD"/>
      </linearGradient>
    </defs>
  </svg>
`;
var arbitrumIcon = `
  <svg height="100%" viewBox="0 0 22 25" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.7827 11.3172L15.5966 8.23933L20.4858 15.8545L20.4881 17.3159L20.4722 7.25942C20.4606 7.0136 20.3301 6.7887 20.1218 6.6561L11.3194 1.5928C11.1135 1.49162 10.8523 1.49269 10.6468 1.59594C10.6191 1.60989 10.593 1.62499 10.568 1.64147L10.5374 1.66079L1.99318 6.6121L1.95999 6.62712C1.91737 6.64674 1.8743 6.67165 1.83382 6.70063C1.67186 6.81683 1.56424 6.98861 1.52944 7.18131C1.52423 7.21052 1.52039 7.24026 1.51855 7.27023L1.53197 15.4653L6.08607 8.40666C6.65942 7.47067 7.90869 7.1692 9.06835 7.1856L10.4295 7.22155L2.40986 20.0827L3.3552 20.627L11.4709 7.23458L15.0581 7.22155L6.96327 20.9519L10.3366 22.8921L10.7396 23.1239C10.9101 23.1932 11.111 23.1967 11.283 23.1347L20.2091 17.9618L18.5026 18.9507L13.7827 11.3172ZM14.4747 21.2849L11.0677 15.9375L13.1474 12.4083L17.622 19.461L14.4747 21.2849Z" fill="#2D374B"/>
    <path d="M11.0684 15.9375L14.4754 21.2849L17.6228 19.4609L13.1482 12.4083L11.0684 15.9375Z" fill="#28A0F0"/>
    <path d="M20.4887 17.3159L20.4864 15.8545L15.5972 8.23932L13.7832 11.3172L18.5031 18.9507L20.2097 17.9618C20.3771 17.8259 20.4783 17.6264 20.489 17.4111L20.4887 17.3159Z" fill="#28A0F0"/>
    <path d="M7.71943e-05 18.694L2.41 20.0826L10.4296 7.22152L9.0685 7.18557C7.90883 7.16916 6.65964 7.47063 6.08621 8.40662L1.53211 15.4652L0 17.8193V18.694H7.71943e-05Z" fill="white"/>
    <path d="M15.0582 7.22156L11.4712 7.23459L3.35547 20.627L6.19211 22.2603L6.96354 20.9519L15.0582 7.22156Z" fill="white"/>
    <path d="M21.9999 7.20306C21.97 6.45287 21.5638 5.76608 20.9275 5.36626L12.0097 0.237888C11.3803 -0.079066 10.594 -0.0794494 9.96363 0.237658C9.88913 0.275218 1.2912 5.26171 1.2912 5.26171C1.17223 5.31874 1.05764 5.38673 0.949789 5.46384C0.381801 5.87094 0.0355663 6.50346 0 7.19846V17.8194L1.53211 15.4653L1.5187 7.27029C1.52054 7.24032 1.52429 7.21088 1.52958 7.18175C1.56415 6.9889 1.67185 6.81689 1.83397 6.70069C1.87444 6.67171 10.6192 1.60995 10.647 1.596C10.8526 1.49275 11.1137 1.49168 11.3195 1.59286L20.122 6.65616C20.3302 6.78876 20.4608 7.01366 20.4723 7.25948V17.4111C20.4617 17.6265 20.3766 17.8259 20.2092 17.9619L18.5026 18.9508L17.6221 19.461L14.4748 21.285L11.283 23.1347C11.1111 23.1968 10.9101 23.1933 10.7397 23.124L6.96334 20.952L6.19191 22.2603L9.58559 24.2142C9.6978 24.278 9.79784 24.3345 9.87985 24.3807C10.0069 24.452 10.0935 24.4996 10.1241 24.5144C10.3653 24.6315 10.7123 24.6997 11.025 24.6997C11.3118 24.6997 11.5913 24.647 11.8559 24.5434L21.1266 19.1745C21.6587 18.7623 21.9717 18.1406 21.9999 17.467V7.20306Z" fill="#96BEDC"/>
  </svg>
`;
var baseIcon = `
<svg height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_1607_202)">
<mask id="mask0_1607_202" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
<path d="M32 0H0V32H32V0Z" fill="white"/>
</mask>
<g mask="url(#mask0_1607_202)">
<path d="M16 32C19.1645 32 22.258 31.0616 24.8892 29.3036C27.5204 27.5454 29.571 25.0466 30.782 22.123C31.993 19.1993 32.31 15.9823 31.6926 12.8786C31.0752 9.77486 29.5514 6.92394 27.3138 4.6863C25.076 2.44866 22.2252 0.924806 19.1214 0.307442C16.0177 -0.30992 12.8007 0.0069325 9.87706 1.21793C6.95344 2.42894 4.45458 4.4797 2.69648 7.11088C0.938384 9.74206 0 12.8355 0 16C0 20.2434 1.68571 24.3132 4.6863 27.3138C7.68688 30.3142 11.7565 32 16 32Z" fill="#0052FF"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M15.9624 27.2676C22.1852 27.2676 27.23 22.223 27.23 16C27.23 9.7771 22.1852 4.73242 15.9624 4.73242C10.0588 4.73242 5.21566 9.2726 4.7341 15.0518H21.4546V16.928H4.73242C5.20432 22.7168 10.0519 27.2676 15.9624 27.2676Z" fill="white"/>
</g>
</g>
<defs>
<clipPath id="clip0_1607_202">
<rect width="32" height="32" fill="white"/>
</clipPath>
</defs>
</svg>
`;
var hourglass = `
<svg width="100%" height="100%" viewBox="0 0 12 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 0L0.0100002 6L4 10L0.0100002 14.01L0 20H12V14L8 10L12 6.01V0H0ZM10 14.5V18H2V14.5L6 10.5L10 14.5Z" fill="#929BED"/>
</svg>
`;
var questionIcon = `
  <svg width="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.07 12.85C11.84 11.46 13.32 10.64 14.18 9.41C15.09 8.12 14.58 5.71 12 5.71C10.31 5.71 9.48 6.99 9.13 8.05L6.54 6.96C7.25 4.83 9.18 3 11.99 3C14.34 3 15.95 4.07 16.77 5.41C17.47 6.56 17.88 8.71 16.8 10.31C15.6 12.08 14.45 12.62 13.83 13.76C13.58 14.22 13.48 14.52 13.48 16H10.59C10.58 15.22 10.46 13.95 11.07 12.85ZM14 20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20C10 18.9 10.9 18 12 18C13.1 18 14 18.9 14 20Z" fill="currentColor"/>
  </svg>
`;
var checkmark = `
<svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4.48076 8.10881L1.33076 4.95881L0.280762 6.00881L4.48076 10.2088L13.4808 1.20881L12.4308 0.158813L4.48076 8.10881Z" fill="#A4F4C6"/>
</svg>
`;
var errorIcon = `<svg width="16" height="13" viewBox="0 0 16 13" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.666992 13.0002H15.3337L8.00033 0.333496L0.666992 13.0002ZM8.66699 11.0002H7.33366V9.66683H8.66699V11.0002ZM8.66699 8.3335H7.33366V5.66683H8.66699V8.3335Z" fill="#FFB3B3"/>
</svg>
`;
var infoIcon = `
  <svg width="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="currentColor"/>
  </svg>
`;
var successIcon = `
  <svg width="100%" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.74999 12.15L3.59999 9L2.54999 10.05L6.74999 14.25L15.75 5.25L14.7 4.2L6.74999 12.15Z" fill="currentColor"/>
  </svg>
`;
var pendingIcon = `
  <svg width="100%" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2L6.01 8L10 12L6.01 16.01L6 22H18V16L14 12L18 8.01V2H6ZM16 16.5V20H8V16.5L12 12.5L16 16.5Z" fill="currenColor"/>
  </svg>
`;
function getDevice() {
  if (typeof window !== "undefined") {
    const parsed = bowser.getParser(window.navigator.userAgent);
    const os = parsed.getOS();
    const browser = parsed.getBrowser();
    const { type } = parsed.getPlatform();
    return {
      type,
      os,
      browser
    };
  } else {
    return {
      type: null,
      os: null,
      browser: null
    };
  }
}
const notNullish = (value) => value != null;
function validEnsChain(chainId) {
  switch (chainId) {
    case "0x1":
    case "0x89":
    case "0xa":
    case "0xa4b1":
    case "0xa4ba":
    case "0x144":
      return "0x1";
    case "0x5":
      return chainId;
    case "0xaa36a7":
      return chainId;
    default:
      return null;
  }
}
function isSVG(str) {
  return str.includes("<svg");
}
function shortenAddress(add) {
  return `${add.slice(0, 6)}…${add.slice(-4)}`;
}
function shortenDomain(domain) {
  return domain.length > 11 ? `${domain.slice(0, 4)}…${domain.slice(-6)}` : domain;
}
async function copyWalletAddress(text2) {
  try {
    const copy = await navigator.clipboard.writeText(text2);
    return copy;
  } catch (err) {
    console.error("Failed to copy: ", err);
  }
}
const toHexString = (val) => typeof val === "number" ? `0x${val.toString(16)}` : val;
function chainIdToHex(chains2) {
  return chains2.map(({ id, ...rest }) => {
    const hexId = toHexString(id);
    return { id: hexId, ...rest };
  });
}
function gweiToWeiHex(gwei) {
  return `0x${(gwei * 1e9).toString(16)}`;
}
const chainIdToLabel = {
  "0x1": "Ethereum",
  "0x3": "Ropsten",
  "0x4": "Rinkeby",
  "0x5": "Goerli",
  "0xaa36a7": "Sepolia",
  "0x2a": "Kovan",
  "0x38": "Binance",
  "0x89": "Polygon",
  "0xfa": "Fantom",
  "0xa": "Optimism",
  "0x45": "Optimism Kovan",
  "0xa86a": "Avalanche",
  "0xa4ec": "Celo",
  "0x2105": "Base",
  "0x14a33": "Base Goerli",
  "0x64": "Gnosis",
  "0x63564C40": "Harmony One",
  "0xa4b1": "Arbitrum One",
  "0xa4ba": "Arbitrum Nova"
};
const networkToChainId = {
  main: "0x1",
  ropsten: "0x3",
  rinkeby: "0x4",
  goerli: "0x5",
  kovan: "0x2a",
  xdai: "0x64",
  "bsc-main": "0x38",
  "matic-main": "0x89",
  "fantom-main": "0xfa",
  "matic-mumbai": "0x80001"
};
const chainStyles = {
  "0x1": {
    icon: ethereumIcon,
    color: "#627EEA"
  },
  "0x3": {
    icon: ethereumIcon,
    color: "#627EEA"
  },
  "0x4": {
    icon: ethereumIcon,
    color: "#627EEA"
  },
  "0x5": {
    icon: ethereumIcon,
    color: "#627EEA"
  },
  "0x2a": {
    icon: ethereumIcon,
    color: "#627EEA"
  },
  "0xaa36a7": {
    icon: ethereumIcon,
    color: "#627EEA"
  },
  "0x38": {
    icon: binanceIcon,
    color: "#F3BA2F"
  },
  "0x89": {
    icon: polygonIcon,
    color: "#8247E5"
  },
  "0xfa": {
    icon: fantomIcon,
    color: "#1969FF"
  },
  "0xa": {
    icon: optimismIcon,
    color: "#FF0420"
  },
  "0x45": {
    icon: optimismIcon,
    color: "#FF0420"
  },
  "0xa86a": {
    icon: avalancheIcon,
    color: "#E84142"
  },
  "0xa4ec": {
    icon: celoIcon,
    color: "#FBCC5C"
  },
  "0x64": {
    icon: gnosisIcon,
    color: "#04795B"
  },
  "0x63564C40": {
    icon: harmonyOneIcon,
    color: "#ffffff"
  },
  "0xa4b1": {
    icon: arbitrumIcon,
    color: "#33394B"
  },
  "0xa4ba": {
    icon: arbitrumIcon,
    color: "#33394B"
  },
  "0x2105": {
    icon: baseIcon,
    color: "#0259F9"
  },
  "0x14a33": {
    icon: baseIcon,
    color: "#0259F9"
  },
  "0x80001": {
    icon: polygonIcon,
    color: "#8247E5"
  }
};
const unrecognizedChainStyle = { icon: questionIcon, color: "#33394B" };
function getDefaultChainStyles(chainId) {
  return chainId ? chainStyles[chainId.toLowerCase()] : void 0;
}
function connectedToValidAppChain(walletConnectedChain, chains2) {
  return !!chains2.find(({ id, namespace }) => id === walletConnectedChain.id && namespace === walletConnectedChain.namespace);
}
const defaultNotifyEventStyles = {
  pending: {
    backgroundColor: "var(--onboard-primary-700, var(--primary-700))",
    borderColor: "#6370E5",
    eventIcon: hourglass
  },
  success: {
    backgroundColor: "#052E17",
    borderColor: "var(--onboard-success-300, var(--success-300))",
    eventIcon: checkmark
  },
  error: {
    backgroundColor: "#FDB1B11A",
    borderColor: "var(--onboard-danger-300, var(--danger-300))",
    eventIcon: errorIcon
  },
  hint: {
    backgroundColor: "var(--onboard-gray-500, var(--gray-500))",
    borderColor: "var(--onboard-gray-500, var(--gray-500))",
    iconColor: "var(--onboard-gray-100, var(--gray-100))",
    eventIcon: infoIcon
  }
};
const wait$1 = (time) => new Promise((resolve) => setTimeout(resolve, time));
function getLocalStore(key) {
  try {
    const result = localStorage.getItem(key);
    return result;
  } catch (error) {
    return null;
  }
}
function setLocalStore(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    return;
  }
}
function delLocalStore(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    return;
  }
}
let configuration = {
  svelteInstance: null,
  apiKey: null,
  device: getDevice(),
  initialWalletInit: [],
  gas: null,
  containerElements: { accountCenter: null, connectModal: null },
  transactionPreview: null,
  unstoppableResolution: null
};
function updateConfiguration(update2) {
  configuration = { ...configuration, ...update2 };
}
const APP_INITIAL_STATE = {
  wallets: [],
  walletModules: [],
  chains: [],
  accountCenter: {
    enabled: true,
    position: "bottomRight",
    expanded: false,
    minimal: true
  },
  notify: {
    enabled: true,
    transactionHandler: () => {
    },
    position: "topRight",
    replacement: {
      gasPriceProbability: {
        speedup: 80,
        cancel: 95
      }
    }
  },
  notifications: [],
  locale: "",
  connect: {
    showSidebar: true,
    disableClose: false
  },
  appMetadata: null
};
const STORAGE_KEYS = {
  TERMS_AGREEMENT: "onboard.js:agreement",
  LAST_CONNECTED_WALLET: "onboard.js:last_connected_wallet"
};
const MOBILE_WINDOW_WIDTH = 768;
const BN_BOOST_RPC_URL = "https://rpc.blocknative.com/boost";
const BN_BOOST_INFO_URL = "https://docs.blocknative.com/blocknative-mev-protection/transaction-boost";
const ADD_CHAINS = "add_chains";
const UPDATE_CHAINS = "update_chains";
const RESET_STORE = "reset_store";
const ADD_WALLET = "add_wallet";
const UPDATE_WALLET = "update_wallet";
const REMOVE_WALLET = "remove_wallet";
const UPDATE_ACCOUNT = "update_account";
const UPDATE_ACCOUNT_CENTER = "update_account_center";
const UPDATE_CONNECT_MODAL = "update_connect_modal";
const SET_WALLET_MODULES = "set_wallet_modules";
const SET_LOCALE = "set_locale";
const UPDATE_NOTIFY = "update_notify";
const ADD_NOTIFICATION = "add_notification";
const REMOVE_NOTIFICATION = "remove_notification";
const UPDATE_ALL_WALLETS = "update_balance";
const UPDATE_APP_METADATA = "update_app_metadata";
function reducer(state2, action) {
  const { type, payload } = action;
  switch (type) {
    case ADD_CHAINS:
      return {
        ...state2,
        chains: [...state2.chains, ...payload]
      };
    case UPDATE_CHAINS: {
      const updatedChain = payload;
      const chains2 = state2.chains;
      const index = chains2.findIndex((chain) => chain.id === updatedChain.id);
      chains2[index] = updatedChain;
      return {
        ...state2,
        chains: chains2
      };
    }
    case ADD_WALLET: {
      const wallet2 = payload;
      const existingWallet = state2.wallets.find(({ label }) => label === wallet2.label);
      return {
        ...state2,
        wallets: [
          // add to front of wallets as it is now the primary wallet
          existingWallet || payload,
          // filter out wallet if it already existed
          ...state2.wallets.filter(({ label }) => label !== wallet2.label)
        ]
      };
    }
    case UPDATE_WALLET: {
      const update2 = payload;
      const { id, ...walletUpdate } = update2;
      const updatedWallets = state2.wallets.map((wallet2) => wallet2.label === id ? { ...wallet2, ...walletUpdate } : wallet2);
      return {
        ...state2,
        wallets: updatedWallets
      };
    }
    case REMOVE_WALLET: {
      const update2 = payload;
      return {
        ...state2,
        wallets: state2.wallets.filter(({ label }) => label !== update2.id)
      };
    }
    case UPDATE_ACCOUNT: {
      const update2 = payload;
      const { id, address, ...accountUpdate } = update2;
      const updatedWallets = state2.wallets.map((wallet2) => {
        if (wallet2.label === id) {
          wallet2.accounts = wallet2.accounts.map((account2) => {
            if (account2.address === address) {
              return { ...account2, ...accountUpdate };
            }
            return account2;
          });
        }
        return wallet2;
      });
      return {
        ...state2,
        wallets: updatedWallets
      };
    }
    case UPDATE_ALL_WALLETS: {
      const updatedWallets = payload;
      return {
        ...state2,
        wallets: updatedWallets
      };
    }
    case UPDATE_CONNECT_MODAL: {
      const update2 = payload;
      return {
        ...state2,
        connect: {
          ...state2.connect,
          ...update2
        }
      };
    }
    case UPDATE_ACCOUNT_CENTER: {
      const update2 = payload;
      return {
        ...state2,
        accountCenter: {
          ...state2.accountCenter,
          ...update2
        }
      };
    }
    case UPDATE_NOTIFY: {
      const update2 = payload;
      return {
        ...state2,
        notify: {
          ...state2.notify,
          ...update2
        }
      };
    }
    case ADD_NOTIFICATION: {
      const update2 = payload;
      const notificationsUpdate = [...state2.notifications];
      const notificationExistsIndex = notificationsUpdate.findIndex(({ id }) => id === update2.id);
      if (notificationExistsIndex !== -1) {
        notificationsUpdate[notificationExistsIndex] = update2;
      } else {
        notificationsUpdate.unshift(update2);
      }
      return {
        ...state2,
        notifications: notificationsUpdate
      };
    }
    case REMOVE_NOTIFICATION: {
      const id = payload;
      return {
        ...state2,
        notifications: state2.notifications.filter((notification2) => notification2.id !== id)
      };
    }
    case SET_WALLET_MODULES: {
      return {
        ...state2,
        walletModules: payload
      };
    }
    case SET_LOCALE: {
      $locale.set(payload);
      return {
        ...state2,
        locale: payload
      };
    }
    case UPDATE_APP_METADATA: {
      const update2 = payload;
      return {
        ...state2,
        appMetadata: {
          ...state2.appMetadata,
          ...update2
        }
      };
    }
    case RESET_STORE:
      return APP_INITIAL_STATE;
    default:
      throw new Error(`Unknown type: ${type} in appStore reducer`);
  }
}
const _store = new BehaviorSubject(APP_INITIAL_STATE);
const _stateUpdates = new Subject();
_stateUpdates.subscribe(_store);
function dispatch$1(action) {
  const state2 = _store.getValue();
  _stateUpdates.next(reducer(state2, action));
}
function select(stateKey) {
  if (!stateKey)
    return _stateUpdates.asObservable();
  const validStateKeys = Object.keys(_store.getValue());
  if (!validStateKeys.includes(String(stateKey))) {
    throw new Error(`key: ${stateKey} does not exist on this store`);
  }
  return _stateUpdates.asObservable().pipe(distinctUntilKeyChanged(stateKey), pluck(stateKey), filter(notNullish));
}
function get() {
  return _store.getValue();
}
const state$1 = {
  select,
  get
};
function noop() {
}
const identity = (x) => x;
function assign(tar, src) {
  for (const k in src)
    tar[k] = src[k];
  return tar;
}
function is_promise(value) {
  return !!value && (typeof value === "object" || typeof value === "function") && typeof value.then === "function";
}
function run(fn) {
  return fn();
}
function blank_object() {
  return /* @__PURE__ */ Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
let src_url_equal_anchor;
function src_url_equal(element_src, url) {
  if (!src_url_equal_anchor) {
    src_url_equal_anchor = document.createElement("a");
  }
  src_url_equal_anchor.href = url;
  return element_src === src_url_equal_anchor.href;
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function component_subscribe(component, store, callback) {
  component.$$.on_destroy.push(subscribe(store, callback));
}
function create_slot(definition, ctx, $$scope, fn) {
  if (definition) {
    const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
    return definition[0](slot_ctx);
  }
}
function get_slot_context(definition, ctx, $$scope, fn) {
  return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
  if (definition[2] && fn) {
    const lets = definition[2](fn(dirty));
    if ($$scope.dirty === void 0) {
      return lets;
    }
    if (typeof lets === "object") {
      const merged = [];
      const len = Math.max($$scope.dirty.length, lets.length);
      for (let i = 0; i < len; i += 1) {
        merged[i] = $$scope.dirty[i] | lets[i];
      }
      return merged;
    }
    return $$scope.dirty | lets;
  }
  return $$scope.dirty;
}
function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
  if (slot_changes) {
    const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
    slot.p(slot_context, slot_changes);
  }
}
function get_all_dirty_from_scope($$scope) {
  if ($$scope.ctx.length > 32) {
    const dirty = [];
    const length = $$scope.ctx.length / 32;
    for (let i = 0; i < length; i++) {
      dirty[i] = -1;
    }
    return dirty;
  }
  return -1;
}
function null_to_empty(value) {
  return value == null ? "" : value;
}
function split_css_unit(value) {
  const split = typeof value === "string" && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
  return split ? [parseFloat(split[1]), split[2] || "px"] : [value, "px"];
}
const is_client = typeof window !== "undefined";
let now = is_client ? () => window.performance.now() : () => Date.now();
let raf = is_client ? (cb) => requestAnimationFrame(cb) : noop;
const tasks = /* @__PURE__ */ new Set();
function run_tasks(now2) {
  tasks.forEach((task) => {
    if (!task.c(now2)) {
      tasks.delete(task);
      task.f();
    }
  });
  if (tasks.size !== 0)
    raf(run_tasks);
}
function loop(callback) {
  let task;
  if (tasks.size === 0)
    raf(run_tasks);
  return {
    promise: new Promise((fulfill) => {
      tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      tasks.delete(task);
    }
  };
}
function append(target, node) {
  target.appendChild(node);
}
function append_styles(target, style_sheet_id, styles) {
  const append_styles_to = get_root_for_style(target);
  if (!append_styles_to.getElementById(style_sheet_id)) {
    const style = element("style");
    style.id = style_sheet_id;
    style.textContent = styles;
    append_stylesheet(append_styles_to, style);
  }
}
function get_root_for_style(node) {
  if (!node)
    return document;
  const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
  if (root && root.host) {
    return root;
  }
  return node.ownerDocument;
}
function append_empty_stylesheet(node) {
  const style_element = element("style");
  append_stylesheet(get_root_for_style(node), style_element);
  return style_element.sheet;
}
function append_stylesheet(node, style) {
  append(node.head || node, style);
  return style.sheet;
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}
function destroy_each(iterations, detaching) {
  for (let i = 0; i < iterations.length; i += 1) {
    if (iterations[i])
      iterations[i].d(detaching);
  }
}
function element(name) {
  return document.createElement(name);
}
function svg_element(name) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(" ");
}
function empty() {
  return text("");
}
function listen(node, event, handler, options2) {
  node.addEventListener(event, handler, options2);
  return () => node.removeEventListener(event, handler, options2);
}
function stop_propagation(fn) {
  return function(event) {
    event.stopPropagation();
    return fn.call(this, event);
  };
}
function attr(node, attribute, value) {
  if (value == null)
    node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value)
    node.setAttribute(attribute, value);
}
function children(element2) {
  return Array.from(element2.childNodes);
}
function set_data(text2, data) {
  data = "" + data;
  if (text2.data === data)
    return;
  text2.data = data;
}
function set_style(node, key, value, important) {
  if (value == null) {
    node.style.removeProperty(key);
  } else {
    node.style.setProperty(key, value, important ? "important" : "");
  }
}
function select_option(select2, value, mounting) {
  for (let i = 0; i < select2.options.length; i += 1) {
    const option = select2.options[i];
    if (option.__value === value) {
      option.selected = true;
      return;
    }
  }
  if (!mounting || value !== void 0) {
    select2.selectedIndex = -1;
  }
}
function toggle_class(element2, name, toggle) {
  element2.classList[toggle ? "add" : "remove"](name);
}
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, cancelable, detail);
  return e;
}
class HtmlTag {
  constructor(is_svg = false) {
    this.is_svg = false;
    this.is_svg = is_svg;
    this.e = this.n = null;
  }
  c(html) {
    this.h(html);
  }
  m(html, target, anchor = null) {
    if (!this.e) {
      if (this.is_svg)
        this.e = svg_element(target.nodeName);
      else
        this.e = element(target.nodeType === 11 ? "TEMPLATE" : target.nodeName);
      this.t = target.tagName !== "TEMPLATE" ? target : target.content;
      this.c(html);
    }
    this.i(anchor);
  }
  h(html) {
    this.e.innerHTML = html;
    this.n = Array.from(this.e.nodeName === "TEMPLATE" ? this.e.content.childNodes : this.e.childNodes);
  }
  i(anchor) {
    for (let i = 0; i < this.n.length; i += 1) {
      insert(this.t, this.n[i], anchor);
    }
  }
  p(html) {
    this.d();
    this.h(html);
    this.i(this.a);
  }
  d() {
    this.n.forEach(detach);
  }
}
function construct_svelte_component(component, props) {
  return new component(props);
}
const managed_styles = /* @__PURE__ */ new Map();
let active = 0;
function hash(str) {
  let hash2 = 5381;
  let i = str.length;
  while (i--)
    hash2 = (hash2 << 5) - hash2 ^ str.charCodeAt(i);
  return hash2 >>> 0;
}
function create_style_information(doc, node) {
  const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
  managed_styles.set(doc, info);
  return info;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
  const step = 16.666 / duration;
  let keyframes = "{\n";
  for (let p = 0; p <= 1; p += step) {
    const t = a + (b - a) * ease(p);
    keyframes += p * 100 + `%{${fn(t, 1 - t)}}
`;
  }
  const rule = keyframes + `100% {${fn(b, 1 - b)}}
}`;
  const name = `__svelte_${hash(rule)}_${uid}`;
  const doc = get_root_for_style(node);
  const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
  if (!rules[name]) {
    rules[name] = true;
    stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
  }
  const animation = node.style.animation || "";
  node.style.animation = `${animation ? `${animation}, ` : ""}${name} ${duration}ms linear ${delay}ms 1 both`;
  active += 1;
  return name;
}
function delete_rule(node, name) {
  const previous = (node.style.animation || "").split(", ");
  const next = previous.filter(
    name ? (anim) => anim.indexOf(name) < 0 : (anim) => anim.indexOf("__svelte") === -1
    // remove all Svelte animations
  );
  const deleted = previous.length - next.length;
  if (deleted) {
    node.style.animation = next.join(", ");
    active -= deleted;
    if (!active)
      clear_rules();
  }
}
function clear_rules() {
  raf(() => {
    if (active)
      return;
    managed_styles.forEach((info) => {
      const { ownerNode } = info.stylesheet;
      if (ownerNode)
        detach(ownerNode);
    });
    managed_styles.clear();
  });
}
function create_animation(node, from, fn, params) {
  if (!from)
    return noop;
  const to = node.getBoundingClientRect();
  if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
    return noop;
  const {
    delay = 0,
    duration = 300,
    easing = identity,
    // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
    start: start_time = now() + delay,
    // @ts-ignore todo:
    end = start_time + duration,
    tick = noop,
    css
  } = fn(node, { from, to }, params);
  let running = true;
  let started = false;
  let name;
  function start() {
    if (css) {
      name = create_rule(node, 0, 1, duration, delay, easing, css);
    }
    if (!delay) {
      started = true;
    }
  }
  function stop() {
    if (css)
      delete_rule(node, name);
    running = false;
  }
  loop((now2) => {
    if (!started && now2 >= start_time) {
      started = true;
    }
    if (started && now2 >= end) {
      tick(1, 0);
      stop();
    }
    if (!running) {
      return false;
    }
    if (started) {
      const p = now2 - start_time;
      const t = 0 + 1 * easing(p / duration);
      tick(t, 1 - t);
    }
    return true;
  });
  start();
  tick(0, 1);
  return stop;
}
function fix_position(node) {
  const style = getComputedStyle(node);
  if (style.position !== "absolute" && style.position !== "fixed") {
    const { width, height } = style;
    const a = node.getBoundingClientRect();
    node.style.position = "absolute";
    node.style.width = width;
    node.style.height = height;
    add_transform(node, a);
  }
}
function add_transform(node, a) {
  const b = node.getBoundingClientRect();
  if (a.left !== b.left || a.top !== b.top) {
    const style = getComputedStyle(node);
    const transform = style.transform === "none" ? "" : style.transform;
    node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
  }
}
let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function beforeUpdate(fn) {
  get_current_component().$$.before_update.push(fn);
}
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
function onDestroy(fn) {
  get_current_component().$$.on_destroy.push(fn);
}
function bubble(component, event) {
  const callbacks = component.$$.callbacks[event.type];
  if (callbacks) {
    callbacks.slice().forEach((fn) => fn.call(this, event));
  }
}
const dirty_components = [];
const binding_callbacks = [];
let render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = /* @__PURE__ */ Promise.resolve();
let update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
function add_flush_callback(fn) {
  flush_callbacks.push(fn);
}
const seen_callbacks = /* @__PURE__ */ new Set();
let flushidx = 0;
function flush() {
  if (flushidx !== 0) {
    return;
  }
  const saved_component = current_component;
  do {
    try {
      while (flushidx < dirty_components.length) {
        const component = dirty_components[flushidx];
        flushidx++;
        set_current_component(component);
        update(component.$$);
      }
    } catch (e) {
      dirty_components.length = 0;
      flushidx = 0;
      throw e;
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
function flush_render_callbacks(fns) {
  const filtered = [];
  const targets = [];
  render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
  targets.forEach((c) => c());
  render_callbacks = filtered;
}
let promise;
function wait() {
  if (!promise) {
    promise = Promise.resolve();
    promise.then(() => {
      promise = null;
    });
  }
  return promise;
}
function dispatch(node, direction, kind) {
  node.dispatchEvent(custom_event(`${direction ? "intro" : "outro"}${kind}`));
}
const outroing = /* @__PURE__ */ new Set();
let outros;
function group_outros() {
  outros = {
    r: 0,
    c: [],
    p: outros
    // parent group
  };
}
function check_outros() {
  if (!outros.r) {
    run_all(outros.c);
  }
  outros = outros.p;
}
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function transition_out(block, local, detach2, callback) {
  if (block && block.o) {
    if (outroing.has(block))
      return;
    outroing.add(block);
    outros.c.push(() => {
      outroing.delete(block);
      if (callback) {
        if (detach2)
          block.d(1);
        callback();
      }
    });
    block.o(local);
  } else if (callback) {
    callback();
  }
}
const null_transition = { duration: 0 };
function create_in_transition(node, fn, params) {
  const options2 = { direction: "in" };
  let config = fn(node, params, options2);
  let running = false;
  let animation_name;
  let task;
  let uid = 0;
  function cleanup() {
    if (animation_name)
      delete_rule(node, animation_name);
  }
  function go() {
    const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
    if (css)
      animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
    tick(0, 1);
    const start_time = now() + delay;
    const end_time = start_time + duration;
    if (task)
      task.abort();
    running = true;
    add_render_callback(() => dispatch(node, true, "start"));
    task = loop((now2) => {
      if (running) {
        if (now2 >= end_time) {
          tick(1, 0);
          dispatch(node, true, "end");
          cleanup();
          return running = false;
        }
        if (now2 >= start_time) {
          const t = easing((now2 - start_time) / duration);
          tick(t, 1 - t);
        }
      }
      return running;
    });
  }
  let started = false;
  return {
    start() {
      if (started)
        return;
      started = true;
      delete_rule(node);
      if (is_function(config)) {
        config = config(options2);
        wait().then(go);
      } else {
        go();
      }
    },
    invalidate() {
      started = false;
    },
    end() {
      if (running) {
        cleanup();
        running = false;
      }
    }
  };
}
function create_out_transition(node, fn, params) {
  const options2 = { direction: "out" };
  let config = fn(node, params, options2);
  let running = true;
  let animation_name;
  const group = outros;
  group.r += 1;
  function go() {
    const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
    if (css)
      animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
    const start_time = now() + delay;
    const end_time = start_time + duration;
    add_render_callback(() => dispatch(node, false, "start"));
    loop((now2) => {
      if (running) {
        if (now2 >= end_time) {
          tick(0, 1);
          dispatch(node, false, "end");
          if (!--group.r) {
            run_all(group.c);
          }
          return false;
        }
        if (now2 >= start_time) {
          const t = easing((now2 - start_time) / duration);
          tick(1 - t, t);
        }
      }
      return running;
    });
  }
  if (is_function(config)) {
    wait().then(() => {
      config = config(options2);
      go();
    });
  } else {
    go();
  }
  return {
    end(reset) {
      if (reset && config.tick) {
        config.tick(1, 0);
      }
      if (running) {
        if (animation_name)
          delete_rule(node, animation_name);
        running = false;
      }
    }
  };
}
function create_bidirectional_transition(node, fn, params, intro) {
  const options2 = { direction: "both" };
  let config = fn(node, params, options2);
  let t = intro ? 0 : 1;
  let running_program = null;
  let pending_program = null;
  let animation_name = null;
  function clear_animation() {
    if (animation_name)
      delete_rule(node, animation_name);
  }
  function init2(program, duration) {
    const d = program.b - t;
    duration *= Math.abs(d);
    return {
      a: t,
      b: program.b,
      d,
      duration,
      start: program.start,
      end: program.start + duration,
      group: program.group
    };
  }
  function go(b) {
    const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
    const program = {
      start: now() + delay,
      b
    };
    if (!b) {
      program.group = outros;
      outros.r += 1;
    }
    if (running_program || pending_program) {
      pending_program = program;
    } else {
      if (css) {
        clear_animation();
        animation_name = create_rule(node, t, b, duration, delay, easing, css);
      }
      if (b)
        tick(0, 1);
      running_program = init2(program, duration);
      add_render_callback(() => dispatch(node, b, "start"));
      loop((now2) => {
        if (pending_program && now2 > pending_program.start) {
          running_program = init2(pending_program, duration);
          pending_program = null;
          dispatch(node, running_program.b, "start");
          if (css) {
            clear_animation();
            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
          }
        }
        if (running_program) {
          if (now2 >= running_program.end) {
            tick(t = running_program.b, 1 - t);
            dispatch(node, running_program.b, "end");
            if (!pending_program) {
              if (running_program.b) {
                clear_animation();
              } else {
                if (!--running_program.group.r)
                  run_all(running_program.group.c);
              }
            }
            running_program = null;
          } else if (now2 >= running_program.start) {
            const p = now2 - running_program.start;
            t = running_program.a + running_program.d * easing(p / running_program.duration);
            tick(t, 1 - t);
          }
        }
        return !!(running_program || pending_program);
      });
    }
  }
  return {
    run(b) {
      if (is_function(config)) {
        wait().then(() => {
          config = config(options2);
          go(b);
        });
      } else {
        go(b);
      }
    },
    end() {
      clear_animation();
      running_program = pending_program = null;
    }
  };
}
function handle_promise(promise2, info) {
  const token = info.token = {};
  function update2(type, index, key, value) {
    if (info.token !== token)
      return;
    info.resolved = value;
    let child_ctx = info.ctx;
    if (key !== void 0) {
      child_ctx = child_ctx.slice();
      child_ctx[key] = value;
    }
    const block = type && (info.current = type)(child_ctx);
    let needs_flush = false;
    if (info.block) {
      if (info.blocks) {
        info.blocks.forEach((block2, i) => {
          if (i !== index && block2) {
            group_outros();
            transition_out(block2, 1, 1, () => {
              if (info.blocks[i] === block2) {
                info.blocks[i] = null;
              }
            });
            check_outros();
          }
        });
      } else {
        info.block.d(1);
      }
      block.c();
      transition_in(block, 1);
      block.m(info.mount(), info.anchor);
      needs_flush = true;
    }
    info.block = block;
    if (info.blocks)
      info.blocks[index] = block;
    if (needs_flush) {
      flush();
    }
  }
  if (is_promise(promise2)) {
    const current_component2 = get_current_component();
    promise2.then((value) => {
      set_current_component(current_component2);
      update2(info.then, 1, info.value, value);
      set_current_component(null);
    }, (error) => {
      set_current_component(current_component2);
      update2(info.catch, 2, info.error, error);
      set_current_component(null);
      if (!info.hasCatch) {
        throw error;
      }
    });
    if (info.current !== info.pending) {
      update2(info.pending, 0);
      return true;
    }
  } else {
    if (info.current !== info.then) {
      update2(info.then, 1, info.value, promise2);
      return true;
    }
    info.resolved = promise2;
  }
}
function update_await_block_branch(info, ctx, dirty) {
  const child_ctx = ctx.slice();
  const { resolved } = info;
  if (info.current === info.then) {
    child_ctx[info.value] = resolved;
  }
  if (info.current === info.catch) {
    child_ctx[info.error] = resolved;
  }
  info.block.p(child_ctx, dirty);
}
function destroy_block(block, lookup2) {
  block.d(1);
  lookup2.delete(block.key);
}
function outro_and_destroy_block(block, lookup2) {
  transition_out(block, 1, 1, () => {
    lookup2.delete(block.key);
  });
}
function fix_and_outro_and_destroy_block(block, lookup2) {
  block.f();
  outro_and_destroy_block(block, lookup2);
}
function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup2, node, destroy, create_each_block2, next, get_context) {
  let o = old_blocks.length;
  let n = list.length;
  let i = o;
  const old_indexes = {};
  while (i--)
    old_indexes[old_blocks[i].key] = i;
  const new_blocks = [];
  const new_lookup = /* @__PURE__ */ new Map();
  const deltas = /* @__PURE__ */ new Map();
  const updates = [];
  i = n;
  while (i--) {
    const child_ctx = get_context(ctx, list, i);
    const key = get_key(child_ctx);
    let block = lookup2.get(key);
    if (!block) {
      block = create_each_block2(key, child_ctx);
      block.c();
    } else if (dynamic) {
      updates.push(() => block.p(child_ctx, dirty));
    }
    new_lookup.set(key, new_blocks[i] = block);
    if (key in old_indexes)
      deltas.set(key, Math.abs(i - old_indexes[key]));
  }
  const will_move = /* @__PURE__ */ new Set();
  const did_move = /* @__PURE__ */ new Set();
  function insert2(block) {
    transition_in(block, 1);
    block.m(node, next);
    lookup2.set(block.key, block);
    next = block.first;
    n--;
  }
  while (o && n) {
    const new_block = new_blocks[n - 1];
    const old_block = old_blocks[o - 1];
    const new_key = new_block.key;
    const old_key = old_block.key;
    if (new_block === old_block) {
      next = new_block.first;
      o--;
      n--;
    } else if (!new_lookup.has(old_key)) {
      destroy(old_block, lookup2);
      o--;
    } else if (!lookup2.has(new_key) || will_move.has(new_key)) {
      insert2(new_block);
    } else if (did_move.has(old_key)) {
      o--;
    } else if (deltas.get(new_key) > deltas.get(old_key)) {
      did_move.add(new_key);
      insert2(new_block);
    } else {
      will_move.add(old_key);
      o--;
    }
  }
  while (o--) {
    const old_block = old_blocks[o];
    if (!new_lookup.has(old_block.key))
      destroy(old_block, lookup2);
  }
  while (n)
    insert2(new_blocks[n - 1]);
  run_all(updates);
  return new_blocks;
}
function bind(component, name, callback) {
  const index = component.$$.props[name];
  if (index !== void 0) {
    component.$$.bound[index] = callback;
    callback(component.$$.ctx[index]);
  }
}
function create_component(block) {
  block && block.c();
}
function mount_component(component, target, anchor, customElement) {
  const { fragment, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    add_render_callback(() => {
      const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
      if (component.$$.on_destroy) {
        component.$$.on_destroy.push(...new_on_destroy);
      } else {
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    flush_render_callbacks($$.after_update);
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
}
function init$1(component, options2, instance2, create_fragment2, not_equal, props, append_styles2, dirty = [-1]) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = component.$$ = {
    fragment: null,
    ctx: [],
    // state
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    // lifecycle
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options2.context || (parent_component ? parent_component.$$.context : [])),
    // everything else
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options2.target || parent_component.$$.root
  };
  append_styles2 && append_styles2($$.root);
  let ready = false;
  $$.ctx = instance2 ? instance2(component, options2.props || {}, (i, ret, ...rest) => {
    const value = rest.length ? rest[0] : ret;
    if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
      if (!$$.skip_bound && $$.bound[i])
        $$.bound[i](value);
      if (ready)
        make_dirty(component, i);
    }
    return ret;
  }) : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  $$.fragment = create_fragment2 ? create_fragment2($$.ctx) : false;
  if (options2.target) {
    if (options2.hydrate) {
      const nodes = children(options2.target);
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      $$.fragment && $$.fragment.c();
    }
    if (options2.intro)
      transition_in(component.$$.fragment);
    mount_component(component, options2.target, options2.anchor, options2.customElement);
    flush();
  }
  set_current_component(parent_component);
}
class SvelteComponent {
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  $on(type, callback) {
    if (!is_function(callback)) {
      return noop;
    }
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1)
        callbacks.splice(index, 1);
    };
  }
  $set($$props) {
    if (this.$$set && !is_empty($$props)) {
      this.$$.skip_bound = true;
      this.$$set($$props);
      this.$$.skip_bound = false;
    }
  }
}
const reset$ = new Subject();
const disconnectWallet$ = new Subject();
const connectWallet$ = new BehaviorSubject({ inProgress: false, actionRequired: "" });
const switchChainModal$ = new BehaviorSubject(null);
const wallets$ = state$1.select("wallets").pipe(shareReplay$1(1));
reset$.pipe(withLatestFrom(wallets$), pluck("1")).subscribe((wallets2) => {
  wallets2.forEach(({ label }) => {
    disconnectWallet$.next(label);
  });
  resetStore();
});
const transactions$ = new BehaviorSubject([]);
function updateTransaction(tx) {
  const currentTransactions = transactions$.getValue();
  const txIndex = currentTransactions.findIndex(({ hash: hash2 }) => hash2 === tx.hash);
  if (txIndex !== -1) {
    const updatedTransactions = currentTransactions.map((val, i) => i === txIndex ? tx : val);
    transactions$.next(updatedTransactions);
  } else {
    transactions$.next([...currentTransactions, tx]);
  }
}
function removeTransaction(hash2) {
  const currentTransactions = transactions$.getValue();
  transactions$.next(currentTransactions.filter((tx) => tx.hash !== hash2));
}
defer(() => {
  const subject = new Subject();
  onMount(() => {
    subject.next();
  });
  return subject.asObservable().pipe(take(1));
});
const onDestroy$ = defer(() => {
  const subject = new Subject();
  onDestroy(() => {
    subject.next();
  });
  return subject.asObservable().pipe(take(1));
});
defer(() => {
  const subject = new Subject();
  afterUpdate(() => {
    subject.next();
  });
  return subject.asObservable().pipe(takeUntil(onDestroy$));
});
defer(() => {
  const subject = new Subject();
  beforeUpdate(() => {
    subject.next();
  });
  return subject.asObservable().pipe(takeUntil(onDestroy$));
});
const themes = {
  default: {
    "--w3o-background-color": "unset",
    "--w3o-foreground-color": "unset",
    "--w3o-text-color": "unset",
    "--w3o-border-color": "unset",
    "--w3o-action-color": "unset",
    "--w3o-border-radius": "unset",
    "--w3o-font-family": "inherit"
  },
  light: {
    "--w3o-background-color": "#ffffff",
    "--w3o-foreground-color": "#EFF1FC",
    "--w3o-text-color": "#1a1d26",
    "--w3o-border-color": "#d0d4f7",
    "--w3o-action-color": "#6370E5",
    "--w3o-border-radius": "16px",
    "--w3o-font-family": "inherit"
  },
  dark: {
    "--w3o-background-color": "#1A1D26",
    "--w3o-foreground-color": "#242835",
    "--w3o-text-color": "#EFF1FC",
    "--w3o-border-color": "#33394B",
    "--w3o-action-color": "#929bed",
    "--w3o-border-radius": "16px",
    "--w3o-font-family": "inherit"
  }
};
const returnTheme = (theme2) => {
  if (typeof theme2 === "string" && theme2 === "system") {
    return watchForSystemThemeChange();
  }
  return returnThemeMap(theme2);
};
const returnThemeMap = (theme2) => {
  if (typeof theme2 === "string" && theme2 in themes) {
    return themes[theme2];
  }
  if (typeof theme2 === "object") {
    return theme2;
  }
};
const handleThemeChange = (update2) => {
  Object.keys(update2).forEach((targetStyle) => {
    document.documentElement.style.setProperty(targetStyle, update2[targetStyle]);
  });
};
const watchForSystemThemeChange = () => {
  const systemThemeDark = window.matchMedia("(prefers-color-scheme: dark)");
  systemThemeDark.matches ? handleThemeChange(themes["dark"]) : handleThemeChange(themes["light"]);
  fromEvent(systemThemeDark, "change").pipe(takeUntil$1(reset$)).subscribe((changes) => {
    const themeChange = changes;
    themeChange.matches ? handleThemeChange(themes["dark"]) : handleThemeChange(themes["light"]);
  });
};
const unknownObject = Joi.object().unknown();
const connectedChain = Joi.object({
  namespace: chainNamespaceValidation.required(),
  id: chainIdValidation.required()
});
const ens = Joi.any().allow(Joi.object({
  name: Joi.string().required(),
  avatar: Joi.string(),
  contentHash: Joi.any().allow(Joi.string(), null),
  getText: Joi.function().arity(1).required()
}), null);
const uns = Joi.any().allow(Joi.object({
  name: Joi.string().required()
}), null);
const balance = Joi.any().allow(Joi.object({
  eth: Joi.number()
}).unknown(), null);
const secondaryTokens = Joi.any().allow(Joi.object({
  balance: Joi.string().required(),
  icon: Joi.string()
}), null);
const account = Joi.object({
  address: Joi.string().required(),
  ens,
  uns,
  balance,
  secondaryTokens
});
const chains$1 = Joi.array().items(chainValidation).unique((a, b) => a.id === b.id).error((e) => {
  if (e[0].code === "array.unique") {
    return new Error(`There is a duplicate Chain ID in your Onboard Chains array: ${e}`);
  }
  return new Error(`${e}`);
});
const accounts = Joi.array().items(account);
const wallet = Joi.object({
  label: Joi.string(),
  icon: Joi.string(),
  provider: unknownObject,
  instance: unknownObject,
  accounts,
  chains: Joi.array().items(connectedChain)
}).required().error(new Error("wallet must be defined"));
const wallets$1 = Joi.array().items(wallet);
const recommendedWallet = Joi.object({
  name: Joi.string().required(),
  url: Joi.string().uri().required()
});
const agreement = Joi.object({
  version: Joi.string().required(),
  termsUrl: Joi.string().uri(),
  privacyUrl: Joi.string().uri()
});
const appMetadata$1 = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  icon: Joi.string(),
  logo: Joi.string(),
  gettingStartedGuide: Joi.string(),
  email: Joi.string(),
  appUrl: Joi.string(),
  explore: Joi.string(),
  recommendedInjectedWallets: Joi.array().items(recommendedWallet),
  agreement
});
const appMetadataUpdate = Joi.object({
  name: Joi.string(),
  description: Joi.string(),
  icon: Joi.string(),
  logo: Joi.string(),
  gettingStartedGuide: Joi.string(),
  email: Joi.string(),
  appUrl: Joi.string(),
  explore: Joi.string(),
  recommendedInjectedWallets: Joi.array().items(recommendedWallet),
  agreement
});
Joi.object({
  label: Joi.string().required(),
  getInfo: Joi.function().arity(1).required(),
  getInterface: Joi.function().arity(1).required()
});
const walletInit = Joi.array().items(Joi.function()).required();
const locale = Joi.string();
const commonPositions = Joi.string().valid("topRight", "bottomRight", "bottomLeft", "topLeft");
const gasPriceProbabilities = [70, 80, 90, 95, 99];
const notify$1 = Joi.object({
  transactionHandler: Joi.function(),
  enabled: Joi.boolean(),
  position: commonPositions,
  replacement: Joi.object({
    gasPriceProbability: Joi.object({
      speedup: Joi.number().valid(...gasPriceProbabilities),
      cancel: Joi.number().valid(...gasPriceProbabilities)
    })
  })
});
const notifyOptions = Joi.object({
  desktop: notify$1,
  mobile: notify$1
});
const accountCenterInitOptions = Joi.object({
  enabled: Joi.boolean(),
  position: commonPositions,
  minimal: Joi.boolean(),
  containerElement: Joi.string(),
  hideTransactionProtectionBtn: Joi.boolean(),
  transactionProtectionInfoLink: Joi.string()
});
const accountCenter$1 = Joi.object({
  enabled: Joi.boolean(),
  position: commonPositions,
  expanded: Joi.boolean(),
  minimal: Joi.boolean(),
  hideTransactionProtectionBtn: Joi.boolean(),
  transactionProtectionInfoLink: Joi.string(),
  containerElement: Joi.string()
});
const connectModalOptions = Joi.object({
  showSidebar: Joi.boolean(),
  disableClose: Joi.boolean(),
  autoConnectLastWallet: Joi.boolean(),
  autoConnectAllPreviousWallet: Joi.boolean(),
  iDontHaveAWalletLink: Joi.string(),
  wheresMyWalletLink: Joi.string(),
  removeWhereIsMyWalletWarning: Joi.boolean(),
  removeIDontHaveAWalletInfoLink: Joi.boolean(),
  disableUDResolution: Joi.boolean()
});
const containerElements = Joi.object({
  accountCenter: Joi.string(),
  connectModal: Joi.string()
});
const themeMap = Joi.object({
  "--w3o-background-color": Joi.string(),
  "--w3o-font-family": Joi.string(),
  "--w3o-foreground-color": Joi.string(),
  "--w3o-text-color": Joi.string(),
  "--w3o-border-color": Joi.string(),
  "--w3o-action-color": Joi.string(),
  "--w3o-border-radius": Joi.string()
});
const presetTheme = Joi.string().valid("default", "dark", "light", "system");
const theme = Joi.alternatives().try(themeMap, presetTheme);
const initOptions = Joi.object({
  wallets: walletInit,
  chains: chains$1.required(),
  appMetadata: appMetadata$1,
  i18n: Joi.object().unknown(),
  apiKey: Joi.string(),
  accountCenter: Joi.object({
    desktop: accountCenterInitOptions,
    mobile: accountCenterInitOptions,
    hideTransactionProtectionBtn: Joi.boolean(),
    transactionProtectionInfoLink: Joi.string()
  }),
  notify: [notifyOptions, notify$1],
  gas: Joi.object({
    get: Joi.function().required(),
    stream: Joi.function().required()
  }),
  connect: connectModalOptions,
  containerElements,
  transactionPreview: Joi.object({
    patchProvider: Joi.function().required(),
    init: Joi.function().required(),
    previewTransaction: Joi.function()
  }),
  theme,
  disableFontDownload: Joi.boolean(),
  unstoppableResolution: Joi.function()
});
const connectOptions = Joi.object({
  autoSelect: Joi.alternatives().try(Joi.object({
    label: Joi.string().required(),
    disableModals: Joi.boolean()
  }), Joi.string())
});
const disconnectOptions = Joi.object({
  label: Joi.string().required()
}).required();
const secondaryTokenValidation = Joi.object({
  address: Joi.string().required(),
  icon: Joi.string().optional()
});
const setChainOptions = Joi.object({
  chainId: chainIdValidation.required(),
  chainNamespace: chainNamespaceValidation,
  wallet: Joi.string(),
  rpcUrl: Joi.string(),
  label: Joi.string(),
  token: Joi.string(),
  protectedRpcUrl: Joi.string(),
  secondaryTokens: Joi.array().max(5).items(secondaryTokenValidation).optional()
});
const customNotificationUpdate = Joi.object({
  key: Joi.string().required(),
  type: Joi.string().allow("pending", "error", "success", "hint"),
  eventCode: Joi.string(),
  message: Joi.string().required(),
  id: Joi.string().required(),
  autoDismiss: Joi.number(),
  onClick: Joi.function(),
  link: Joi.string()
});
const preflightNotifications$1 = Joi.object({
  sendTransaction: Joi.function(),
  estimateGas: Joi.function(),
  gasPrice: Joi.function(),
  balance: Joi.alternatives(Joi.string(), Joi.number()),
  txDetails: Joi.object({
    value: Joi.alternatives(Joi.string(), Joi.number()),
    to: Joi.string(),
    from: Joi.string()
  }),
  txApproveReminderTimeout: Joi.number()
});
const customNotification$1 = Joi.object({
  key: Joi.string(),
  type: Joi.string().allow("pending", "error", "success", "hint"),
  eventCode: Joi.string(),
  message: Joi.string(),
  id: Joi.string(),
  autoDismiss: Joi.number(),
  onClick: Joi.function(),
  link: Joi.string()
});
const notification = Joi.object({
  id: Joi.string().required(),
  key: Joi.string().required(),
  type: Joi.string().allow("pending", "error", "success", "hint").required(),
  eventCode: Joi.string().required(),
  message: Joi.string().required(),
  autoDismiss: Joi.number().required(),
  network: Joi.string().required(),
  startTime: Joi.number(),
  onClick: Joi.function(),
  link: Joi.string()
});
const transactionHandlerReturn = Joi.any().allow(customNotificationUpdate, Joi.boolean().allow(false));
function validateWallet(data) {
  return validate(wallet, data);
}
function validateInitOptions(data) {
  return validate(initOptions, data);
}
function validateConnectOptions(data) {
  return validate(connectOptions, data);
}
function validateDisconnectOptions(data) {
  return validate(disconnectOptions, data);
}
function validateString(str, label) {
  return validate(Joi.string().required().label(label || "value"), str);
}
function validateSetChainOptions(data) {
  return validate(setChainOptions, data);
}
function validateAccountCenterUpdate(data) {
  return validate(accountCenter$1, data);
}
function validateConnectModalUpdate(data) {
  return validate(connectModalOptions, data);
}
function validateWalletInit(data) {
  return validate(walletInit, data);
}
function validateLocale(data) {
  return validate(locale, data);
}
function validateNotify(data) {
  return validate(notify$1, data);
}
function validateNotifyOptions(data) {
  return validate(notifyOptions, data);
}
function validateTransactionHandlerReturn(data) {
  return validate(transactionHandlerReturn, data);
}
function validateNotification(data) {
  return validate(notification, data);
}
function validatePreflightNotifications(data) {
  return validate(preflightNotifications$1, data);
}
function validateCustomNotificationUpdate(data) {
  return validate(customNotificationUpdate, data);
}
function validateCustomNotification(data) {
  return validate(customNotification$1, data);
}
function validateUpdateBalances(data) {
  return validate(wallets$1, data);
}
function validateUpdateTheme(data) {
  return validate(theme, data);
}
function validateAppMetadataUpdate(data) {
  return validate(appMetadataUpdate, data);
}
function addChains(chains2) {
  const action = {
    type: ADD_CHAINS,
    payload: chains2.map(({ namespace = "evm", id, rpcUrl, ...rest }) => ({
      ...rest,
      namespace,
      id: id.toLowerCase(),
      rpcUrl: rpcUrl ? rpcUrl.trim() : null
    }))
  };
  dispatch$1(action);
}
function updateChain(updatedChain) {
  const { label, token, rpcUrl, id: chainId, namespace: chainNamespace } = updatedChain;
  const error = validateSetChainOptions({ label, token, rpcUrl, chainId, chainNamespace });
  if (error) {
    throw error;
  }
  const action = {
    type: UPDATE_CHAINS,
    payload: updatedChain
  };
  dispatch$1(action);
}
function addWallet(wallet2) {
  const error = validateWallet(wallet2);
  if (error) {
    console.error(error);
    throw error;
  }
  const action = {
    type: ADD_WALLET,
    payload: wallet2
  };
  dispatch$1(action);
}
function updateWallet(id, update2) {
  const error = validateWallet(update2);
  if (error) {
    console.error(error);
    throw error;
  }
  const action = {
    type: UPDATE_WALLET,
    payload: {
      id,
      ...update2
    }
  };
  dispatch$1(action);
}
function removeWallet(id) {
  const error = validateString(id, "wallet id");
  if (error) {
    throw error;
  }
  const action = {
    type: REMOVE_WALLET,
    payload: {
      id
    }
  };
  dispatch$1(action);
}
function setPrimaryWallet(wallet2, address) {
  const error = validateWallet(wallet2) || address && validateString(address, "address");
  if (error) {
    throw error;
  }
  if (address) {
    const account2 = wallet2.accounts.find((ac) => ac.address === address);
    if (account2) {
      wallet2.accounts = [
        account2,
        ...wallet2.accounts.filter(({ address: address2 }) => address2 !== account2.address)
      ];
    }
  }
  addWallet(wallet2);
}
function updateAccount(id, address, update2) {
  const action = {
    type: UPDATE_ACCOUNT,
    payload: {
      id,
      address,
      ...update2
    }
  };
  dispatch$1(action);
}
function updateAccountCenter(update2) {
  const error = validateAccountCenterUpdate(update2);
  if (error) {
    throw error;
  }
  const action = {
    type: UPDATE_ACCOUNT_CENTER,
    payload: update2
  };
  dispatch$1(action);
}
function updateConnectModal(update2) {
  const error = validateConnectModalUpdate(update2);
  if (error) {
    throw error;
  }
  const action = {
    type: UPDATE_CONNECT_MODAL,
    payload: update2
  };
  dispatch$1(action);
}
function updateNotify(update2) {
  const error = validateNotify(update2);
  if (error) {
    throw error;
  }
  const action = {
    type: UPDATE_NOTIFY,
    payload: update2
  };
  dispatch$1(action);
}
function addNotification(notification2) {
  const error = validateNotification(notification2);
  if (error) {
    throw error;
  }
  const action = {
    type: ADD_NOTIFICATION,
    payload: notification2
  };
  dispatch$1(action);
}
function addCustomNotification(notification2) {
  const customNotificationError = validateCustomNotificationUpdate(notification2);
  if (customNotificationError) {
    throw customNotificationError;
  }
  const action = {
    type: ADD_NOTIFICATION,
    payload: notification2
  };
  dispatch$1(action);
}
function customNotification(updatedNotification) {
  const customNotificationError = validateCustomNotification(updatedNotification);
  if (customNotificationError) {
    throw customNotificationError;
  }
  const customIdKey = `customNotification-${nanoid()}`;
  const notification2 = {
    ...updatedNotification,
    id: customIdKey,
    key: customIdKey
  };
  addCustomNotification(notification2);
  const dismiss = () => removeNotification(notification2.id);
  const update2 = (notificationUpdate) => {
    const customNotificationError2 = validateCustomNotification(updatedNotification);
    if (customNotificationError2) {
      throw customNotificationError2;
    }
    const notificationAfterUpdate = {
      ...notificationUpdate,
      id: notification2.id,
      key: notification2.key
    };
    addCustomNotification(notificationAfterUpdate);
    return {
      dismiss,
      update: update2
    };
  };
  addCustomNotification(notification2);
  return {
    dismiss,
    update: update2
  };
}
function removeNotification(id) {
  if (typeof id !== "string") {
    throw new Error("Notification id must be of type string");
  }
  const action = {
    type: REMOVE_NOTIFICATION,
    payload: id
  };
  dispatch$1(action);
}
function resetStore() {
  const action = {
    type: RESET_STORE
  };
  dispatch$1(action);
}
function setWalletModules(wallets2) {
  const error = validateWalletInit(wallets2);
  if (error) {
    throw error;
  }
  const modules = initializeWalletModules(wallets2);
  const dedupedWallets = uniqueWalletsByLabel(modules);
  const action = {
    type: SET_WALLET_MODULES,
    payload: dedupedWallets
  };
  dispatch$1(action);
}
function setLocale(locale2) {
  const error = validateLocale(locale2);
  if (error) {
    throw error;
  }
  const action = {
    type: SET_LOCALE,
    payload: locale2
  };
  dispatch$1(action);
}
function updateAllWallets(wallets2) {
  const error = validateUpdateBalances(wallets2);
  if (error) {
    throw error;
  }
  const action = {
    type: UPDATE_ALL_WALLETS,
    payload: wallets2
  };
  dispatch$1(action);
}
function initializeWalletModules(modules) {
  const { device } = configuration;
  return modules.reduce((acc, walletInit2) => {
    const initialized = walletInit2({ device });
    if (initialized) {
      acc.push(...Array.isArray(initialized) ? initialized : [initialized]);
    }
    return acc;
  }, []);
}
function uniqueWalletsByLabel(walletModuleList) {
  return walletModuleList.filter((wallet2, i) => wallet2 && walletModuleList.findIndex((innerWallet) => innerWallet && innerWallet.label === wallet2.label) === i);
}
function updateTheme(theme2) {
  const error = validateUpdateTheme(theme2);
  if (error) {
    throw error;
  }
  const themingObj = returnTheme(theme2);
  themingObj && handleThemeChange(themingObj);
}
function updateAppMetadata(update2) {
  const error = validateAppMetadataUpdate(update2);
  if (error) {
    throw error;
  }
  const action = {
    type: UPDATE_APP_METADATA,
    payload: update2
  };
  dispatch$1(action);
}
async function connect$1(options2) {
  if (options2) {
    const error = validateConnectOptions(options2);
    if (error) {
      throw error;
    }
  }
  const { chains: chains2 } = state$1.get();
  if (!chains2.length)
    throw new Error("At least one chain must be set before attempting to connect a wallet");
  const { autoSelect } = options2 || {
    autoSelect: { label: "", disableModals: false }
  };
  if (autoSelect && (typeof autoSelect === "string" || autoSelect.label)) {
    await wait$1(50);
  }
  if (!state$1.get().walletModules.length) {
    setWalletModules(configuration.initialWalletInit);
  }
  connectWallet$.next({
    autoSelect: typeof autoSelect === "string" ? { label: autoSelect, disableModals: false } : autoSelect,
    inProgress: true
  });
  const result$ = connectWallet$.pipe(filter(({ inProgress, actionRequired }) => inProgress === false && !actionRequired), withLatestFrom(wallets$), pluck(1));
  return firstValueFrom(result$);
}
var connect = {
  selectingWallet: {
    header: "Available Wallets",
    sidebar: {
      heading: "",
      subheading: "Connect your wallet",
      paragraph: "Connecting your wallet is like “logging in” to Web3. Select your wallet from the options to get started.",
      IDontHaveAWallet: "I don't have a wallet"
    },
    recommendedWalletsPart1: "{app} only supports",
    recommendedWalletsPart2: "on this platform. Please use or install one of the supported wallets to continue",
    installWallet: "You do not have any wallets installed that {app} supports, please use a supported wallet",
    agreement: {
      agree: "I agree to the",
      terms: "Terms & Conditions",
      and: "and",
      privacy: "Privacy Policy"
    },
    whyDontISeeMyWallet: "Why don't I see my wallet?",
    learnMore: "Click here to learn more"
  },
  connectingWallet: {
    header: "{connectionRejected, select, false {Connecting to {wallet}...} other {Connection Rejected}}",
    sidebar: {
      subheading: "Approve Connection",
      paragraph: "Please approve the connection in your wallet and authorize access to continue."
    },
    mainText: "Connecting...",
    paragraph: "Make sure to select all accounts that you want to grant access to.",
    previousConnection: "{wallet} already has a pending connection request, please open the {wallet} app to login and connect.",
    rejectedText: "Connection Rejected!",
    rejectedCTA: "Click here to try again",
    primaryButton: "Back to wallets"
  },
  connectedWallet: {
    header: "Connection Successful",
    sidebar: {
      subheading: "Connection Successful!",
      paragraph: "Your wallet is now connected to {app}"
    },
    mainText: "Connected"
  }
};
var modals = {
  actionRequired: {
    heading: "Action required in {wallet}",
    paragraph: "Please switch the active account in your wallet.",
    linkText: "Learn more.",
    buttonText: "Okay"
  },
  switchChain: {
    heading: "Switch Chain",
    paragraph1: "{app} requires that you switch your wallet to the {nextNetworkName} network to continue.",
    paragraph2: "*Some wallets may not support changing networks. If you can not change networks in your wallet you may consider switching to a different wallet."
  },
  confirmDisconnectAll: {
    heading: "Disconnect all Wallets",
    description: "Are you sure that you would like to disconnect all your wallets?",
    confirm: "Confirm",
    cancel: "Cancel"
  },
  confirmTransactionProtection: {
    heading: "Enable Transaction Protection",
    description: "Protect RPC endpoints hide your transaction from front-running and sandwich bots.",
    link: "Learn more",
    enable: "Enable",
    dismiss: "Dismiss"
  }
};
var accountCenter = {
  connectAnotherWallet: "Connect another Wallet",
  disconnectAllWallets: "Disconnect all Wallets",
  currentNetwork: "Current Network",
  enableTransactionProtection: "Enable Transaction Protection",
  appInfo: "App Info",
  learnMore: "Learn More",
  gettingStartedGuide: "Getting Started Guide",
  smartContracts: "Smart Contract(s)",
  explore: "Explore",
  poweredBy: "powered by",
  addAccount: "Add Account",
  setPrimaryAccount: "Set Primary Account",
  disconnectWallet: "Disconnect Wallet",
  copyAddress: "Copy Wallet address"
};
var notify = {
  transaction: {
    txRequest: "Your transaction is waiting for you to confirm",
    nsfFail: "You have insufficient funds for this transaction",
    txUnderpriced: "The gas price for your transaction is too low, try a higher gas price",
    txRepeat: "This could be a repeat transaction",
    txAwaitingApproval: "You have a previous transaction waiting for you to confirm",
    txConfirmReminder: "Please confirm your transaction to continue",
    txSendFail: "You rejected the transaction",
    txSent: "Your transaction has been sent to the network",
    txStallPending: "Your transaction has stalled before it was sent, please try again",
    txStuck: "Your transaction is stuck due to a nonce gap",
    txPool: "Your transaction has started",
    txStallConfirmed: "Your transaction has stalled and hasn't been confirmed",
    txSpeedUp: "Your transaction has been sped up",
    txCancel: "Your transaction is being canceled",
    txFailed: "Your transaction has failed",
    txConfirmed: "Your transaction has succeeded",
    txError: "Oops something went wrong, please try again",
    txReplaceError: "There was an error replacing your transaction, please try again"
  },
  watched: {
    txPool: "Your account is {verb} {formattedValue} {asset} {preposition} {counterpartyShortened}",
    txSpeedUp: "Transaction for {formattedValue} {asset} {preposition} {counterpartyShortened} has been sped up",
    txCancel: "Transaction for {formattedValue} {asset} {preposition} {counterpartyShortened} has been canceled",
    txConfirmed: "Your account successfully {verb} {formattedValue} {asset} {preposition} {counterpartyShortened}",
    txFailed: "Your account failed to {verb} {formattedValue} {asset} {preposition} {counterpartyShortened}",
    txStuck: "Your transaction is stuck due to a nonce gap"
  },
  time: {
    minutes: "min",
    seconds: "sec"
  }
};
var en = {
  connect,
  modals,
  accountCenter,
  notify
};
const ethersProviders = {};
function getProvider(chain) {
  if (!chain)
    return null;
  if (!ethersProviders[chain.rpcUrl]) {
    ethersProviders[chain.rpcUrl] = new providers.StaticJsonRpcProvider(chain.providerConnectionInfo && chain.providerConnectionInfo.url ? chain.providerConnectionInfo : chain.rpcUrl);
  }
  return ethersProviders[chain.rpcUrl];
}
function requestAccounts(provider) {
  const args = { method: "eth_requestAccounts" };
  return provider.request(args);
}
function selectAccounts(provider) {
  const args = { method: "eth_selectAccounts" };
  return provider.request(args);
}
function getChainId(provider) {
  return provider.request({ method: "eth_chainId" });
}
function listenAccountsChanged(args) {
  const { provider, disconnected$ } = args;
  const addHandler = (handler) => {
    provider.on("accountsChanged", handler);
  };
  const removeHandler = (handler) => {
    provider.removeListener("accountsChanged", handler);
  };
  return fromEventPattern(addHandler, removeHandler).pipe(takeUntil(disconnected$));
}
function listenChainChanged(args) {
  const { provider, disconnected$ } = args;
  const addHandler = (handler) => {
    provider.on("chainChanged", handler);
  };
  const removeHandler = (handler) => {
    provider.removeListener("chainChanged", handler);
  };
  return fromEventPattern(addHandler, removeHandler).pipe(takeUntil(disconnected$));
}
function trackWallet(provider, label) {
  const disconnected$ = disconnectWallet$.pipe(filter((wallet2) => wallet2 === label), take(1));
  const accountsChanged$ = listenAccountsChanged({
    provider,
    disconnected$
  }).pipe(share());
  accountsChanged$.subscribe(async ([address]) => {
    try {
      await syncWalletConnectedAccounts(label);
    } catch (error) {
      console.warn("Web3Onboard: Error whilst trying to sync connected accounts:", error);
    }
    if (!address) {
      disconnect({ label });
      return;
    }
    const { wallets: wallets2 } = state$1.get();
    const { accounts: accounts2 } = wallets2.find((wallet2) => wallet2.label === label);
    const [[existingAccount], restAccounts] = partition(accounts2, (account2) => account2.address === address);
    updateWallet(label, {
      accounts: [
        existingAccount || {
          address,
          ens: null,
          uns: null,
          balance: null
        },
        ...restAccounts
      ]
    });
    if (state$1.get().notify.enabled && !existingAccount) {
      const sdk = await getBNMulitChainSdk();
      if (sdk) {
        const wallet2 = state$1.get().wallets.find((wallet3) => wallet3.label === label);
        try {
          sdk.subscribe({
            id: address,
            chainId: wallet2.chains[0].id,
            type: "account"
          });
        } catch (error) {
        }
      }
    }
  });
  accountsChanged$.pipe(switchMap(async ([address]) => {
    if (!address)
      return;
    const { wallets: wallets2, chains: chains2 } = state$1.get();
    const primaryWallet = wallets2.find((wallet2) => wallet2.label === label);
    const { chains: walletChains, accounts: accounts2 } = primaryWallet;
    const [connectedWalletChain] = walletChains;
    const chain = chains2.find(({ namespace, id }) => namespace === "evm" && id === connectedWalletChain.id);
    const balanceProm = getBalance(address, chain);
    const secondaryTokenBal = updateSecondaryTokens(primaryWallet, address, chain);
    const account2 = accounts2.find((account3) => account3.address === address);
    const ensChain = chains2.find(({ id }) => id === validEnsChain(connectedWalletChain.id));
    const ensProm = account2 && account2.ens ? Promise.resolve(account2.ens) : ensChain ? getEns(address, ensChain) : Promise.resolve(null);
    const unsProm = account2 && account2.uns ? Promise.resolve(account2.uns) : getUns(address, chain);
    return Promise.all([
      Promise.resolve(address),
      balanceProm,
      ensProm,
      unsProm,
      secondaryTokenBal
    ]);
  })).subscribe((res) => {
    if (!res)
      return;
    const [address, balance2, ens2, uns2, secondaryTokens2] = res;
    updateAccount(label, address, { balance: balance2, ens: ens2, uns: uns2, secondaryTokens: secondaryTokens2 });
  });
  const chainChanged$ = listenChainChanged({ provider, disconnected$ }).pipe(share());
  chainChanged$.subscribe(async (chainId) => {
    const { wallets: wallets2 } = state$1.get();
    const { chains: chains2, accounts: accounts2 } = wallets2.find((wallet2) => wallet2.label === label);
    const [connectedWalletChain] = chains2;
    if (chainId === connectedWalletChain.id)
      return;
    if (state$1.get().notify.enabled) {
      const sdk = await getBNMulitChainSdk();
      if (sdk) {
        const wallet2 = state$1.get().wallets.find((wallet3) => wallet3.label === label);
        wallet2.accounts.forEach(({ address }) => {
          sdk.unsubscribe({
            id: address,
            chainId: wallet2.chains[0].id,
            timeout: 6e4
          });
        });
        wallet2.accounts.forEach(({ address }) => {
          try {
            sdk.subscribe({
              id: address,
              chainId,
              type: "account"
            });
          } catch (error) {
          }
        });
      }
    }
    const resetAccounts = accounts2.map(({ address }) => ({
      address,
      ens: null,
      uns: null,
      balance: null
    }));
    updateWallet(label, {
      chains: [{ namespace: "evm", id: chainId }],
      accounts: resetAccounts
    });
  });
  chainChanged$.pipe(switchMap(async (chainId) => {
    const { wallets: wallets2, chains: chains2 } = state$1.get();
    const primaryWallet = wallets2.find((wallet2) => wallet2.label === label);
    const { accounts: accounts2 } = primaryWallet;
    const chain = chains2.find(({ namespace, id }) => namespace === "evm" && id === chainId);
    return Promise.all(accounts2.map(async ({ address }) => {
      const balanceProm = getBalance(address, chain);
      const secondaryTokenBal = updateSecondaryTokens(primaryWallet, address, chain);
      const ensChain = chains2.find(({ id }) => id === validEnsChain(chainId));
      const ensProm = ensChain ? getEns(address, ensChain) : Promise.resolve(null);
      const unsProm = validEnsChain(chainId) ? getUns(address, ensChain) : Promise.resolve(null);
      const [balance2, ens2, uns2, secondaryTokens2] = await Promise.all([
        balanceProm,
        ensProm,
        unsProm,
        secondaryTokenBal
      ]);
      return {
        address,
        balance: balance2,
        ens: ens2,
        uns: uns2,
        secondaryTokens: secondaryTokens2
      };
    }));
  })).subscribe((updatedAccounts) => {
    updatedAccounts && updateWallet(label, { accounts: updatedAccounts });
  });
  disconnected$.subscribe(() => {
    provider.disconnect && provider.disconnect();
  });
}
async function getEns(address, chain) {
  if (!chain)
    return null;
  const provider = getProvider(chain);
  try {
    const name = await provider.lookupAddress(address);
    let ens2 = null;
    if (name) {
      const resolver = await provider.getResolver(name);
      if (resolver) {
        const [contentHash, avatar] = await Promise.all([
          resolver.getContentHash(),
          resolver.getAvatar()
        ]);
        const getText = resolver.getText.bind(resolver);
        ens2 = {
          name,
          avatar,
          contentHash,
          getText
        };
      }
    }
    return ens2;
  } catch (error) {
    console.error(error);
    return null;
  }
}
async function getUns(address, chain) {
  const { unstoppableResolution } = configuration;
  if (!unstoppableResolution || !utils.isAddress(address) || !chain)
    return null;
  try {
    return await unstoppableResolution(address);
  } catch (error) {
    console.error(error);
    return null;
  }
}
async function getBalance(address, chain) {
  if (!chain)
    return null;
  const { wallets: wallets2 } = state$1.get();
  try {
    const wallet2 = wallets2.find((wallet3) => !!wallet3.provider);
    const provider = wallet2.provider;
    const balanceHex = await provider.request({
      method: "eth_getBalance",
      params: [address, "latest"]
    });
    return balanceHex ? { [chain.token || "eth"]: weiToEth(balanceHex) } : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}
function switchChain(provider, chainId) {
  return provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId }]
  });
}
function addNewChain(provider, chain) {
  return provider.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: chain.id,
        chainName: chain.label,
        nativeCurrency: {
          name: chain.label,
          symbol: chain.token,
          decimals: 18
        },
        rpcUrls: [chain.publicRpcUrl || chain.rpcUrl],
        blockExplorerUrls: chain.blockExplorerUrl ? [chain.blockExplorerUrl] : void 0
      }
    ]
  });
}
function updateChainRPC(provider, chain, rpcUrl) {
  return provider.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: chain.id,
        chainName: chain.label,
        nativeCurrency: {
          name: chain.label,
          symbol: chain.token,
          decimals: 18
        },
        rpcUrls: [rpcUrl],
        blockExplorerUrls: chain.blockExplorerUrl ? [chain.blockExplorerUrl] : void 0
      }
    ]
  });
}
async function getPermissions(provider) {
  try {
    const permissions = await provider.request({
      method: "wallet_getPermissions"
    });
    return Array.isArray(permissions) ? permissions : [];
  } catch (error) {
    return [];
  }
}
async function syncWalletConnectedAccounts(label) {
  const wallet2 = state$1.get().wallets.find((wallet3) => wallet3.label === label);
  const permissions = await getPermissions(wallet2.provider);
  const accountsPermissions = permissions.find(({ parentCapability }) => parentCapability === "eth_accounts");
  if (accountsPermissions) {
    const { value: connectedAccounts } = accountsPermissions.caveats.find(({ type }) => type === "restrictReturnedAccounts") || { value: null };
    if (connectedAccounts) {
      const syncedAccounts = wallet2.accounts.filter(({ address }) => connectedAccounts.includes(address));
      updateWallet(wallet2.label, { ...wallet2, accounts: syncedAccounts });
    }
  }
}
async function updateBalances(addresses) {
  const { wallets: wallets2, chains: chains2 } = state$1.get();
  const updatedWallets = await Promise.all(wallets2.map(async (wallet2) => {
    const chain = chains2.find(({ id }) => id === wallet2.chains[0].id);
    const updatedAccounts = await Promise.all(wallet2.accounts.map(async (account2) => {
      const secondaryTokens2 = await updateSecondaryTokens(wallet2, account2.address, chain);
      if (!addresses || addresses.some((address) => address.toLowerCase() === account2.address.toLowerCase())) {
        const updatedBalance = await getBalance(account2.address, chain);
        return { ...account2, balance: updatedBalance, secondaryTokens: secondaryTokens2 };
      }
      return { ...account2, secondaryTokens: secondaryTokens2 };
    }));
    return { ...wallet2, accounts: updatedAccounts };
  }));
  updateAllWallets(updatedWallets);
}
const updateSecondaryTokens = async (wallet2, account2, chain) => {
  if (!chain)
    return;
  const chainRPC = chain.rpcUrl;
  if (!chain.secondaryTokens || !chain.secondaryTokens.length || !chainRPC)
    return;
  const ethersProvider = new ethers.providers.Web3Provider(wallet2.provider, "any");
  const signer = ethersProvider.getSigner();
  const erc20ABISubset = [
    {
      inputs: [{ name: "owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function"
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [{ name: "", type: "string" }],
      stateMutability: "view",
      type: "function"
    }
  ];
  const tokenBalances = await Promise.all(chain.secondaryTokens.map(async (token) => {
    try {
      const swapContract = new ethers.Contract(token.address, erc20ABISubset, signer);
      const bigNumBalance = await swapContract.balanceOf(account2);
      const tokenName = await swapContract.symbol();
      return {
        name: tokenName,
        balance: weiToEth(bigNumBalance.toHexString()),
        icon: token.icon
      };
    } catch (error) {
      console.error(`There was an error fetching balance and/or symbol 
          for token contract: ${token.address} - ${error}`);
    }
  }));
  return tokenBalances;
};
function handleTransactionUpdates(transaction) {
  const customized = state$1.get().notify.transactionHandler(transaction);
  const invalid = validateTransactionHandlerReturn(customized);
  if (invalid) {
    throw invalid;
  }
  if (transaction.eventCode === "txConfirmed") {
    updateBalances([transaction.watchedAddress, transaction.counterparty]);
  }
  const notification2 = transactionEventToNotification(transaction, customized);
  addNotification(notification2);
  updateTransaction(transaction);
}
function transactionEventToNotification(transaction, customization) {
  const { id, hash: hash2, startTime, eventCode, direction, counterparty, value, asset, network } = transaction;
  const type = eventToType(eventCode);
  const key = `${id || hash2}-${typeof customization === "object" && customization.eventCode || eventCode}`;
  const counterpartyShortened = counterparty && counterparty.substring(0, 4) + "..." + counterparty.substring(counterparty.length - 4);
  const formattedValue = new BigNumber(value || 0).div(new BigNumber("1000000000000000000")).toString(10);
  const formatterOptions = counterparty && value ? {
    messageId: `notify.watched['${eventCode}']`,
    values: {
      verb: eventCode === "txConfirmed" ? direction === "incoming" ? "received" : "sent" : direction === "incoming" ? "receiving" : "sending",
      formattedValue,
      preposition: direction === "incoming" ? "from" : "to",
      counterpartyShortened,
      asset
    }
  } : {
    messageId: `notify.transaction['${eventCode}']`,
    values: { formattedValue, asset }
  };
  const formatter = get_store_value($format);
  const notificationDefaultMessages = en.notify;
  const typeKey = counterparty ? "watched" : "transaction";
  const notificationMessageType = notificationDefaultMessages[typeKey];
  const defaultMessage = notificationMessageType[eventCode];
  const message = formatter(formatterOptions.messageId, {
    values: formatterOptions.values,
    default: defaultMessage
  });
  let notification2 = {
    id: id || hash2,
    type,
    key,
    network,
    startTime: startTime || Date.now(),
    eventCode,
    message,
    autoDismiss: typeToDismissTimeout(typeof customization === "object" && customization.type || type)
  };
  if (typeof customization === "object") {
    notification2 = { ...notification2, ...customization };
  }
  return notification2;
}
function eventToType(eventCode) {
  switch (eventCode) {
    case "txSent":
    case "txPool":
      return "pending";
    case "txSpeedUp":
    case "txCancel":
    case "txRequest":
    case "txRepeat":
    case "txAwaitingApproval":
    case "txConfirmReminder":
    case "txStuck":
      return "hint";
    case "txError":
    case "txSendFail":
    case "txFailed":
    case "txDropped":
    case "nsfFail":
    case "txUnderpriced":
      return "error";
    case "txConfirmed":
      return "success";
    default:
      return "hint";
  }
}
function typeToDismissTimeout(type) {
  switch (type) {
    case "success":
    case "hint":
      return 4e3;
    default:
      return 0;
  }
}
let blocknativeMultiChainSdk;
let blocknativeSdk;
async function getBNMulitChainSdk() {
  const { apiKey } = configuration;
  if (!apiKey)
    return null;
  if (!blocknativeMultiChainSdk) {
    const { default: Blocknative } = await import("bnc-sdk");
    blocknativeMultiChainSdk = Blocknative.multichain({
      apiKey: configuration.apiKey
    });
    blocknativeMultiChainSdk.transactions$.subscribe(handleTransactionUpdates);
  }
  return blocknativeMultiChainSdk;
}
async function getBlocknativeSdk() {
  const { apiKey } = configuration;
  if (!apiKey)
    return null;
  if (!blocknativeSdk) {
    const { default: Blocknative } = await import("bnc-sdk");
    blocknativeSdk = new Blocknative({
      dappId: configuration.apiKey,
      networkId: 1
    });
    return blocknativeSdk;
  }
  return blocknativeSdk;
}
async function disconnect(options2) {
  const error = validateDisconnectOptions(options2);
  if (error) {
    throw error;
  }
  const { label } = options2;
  if (state$1.get().notify.enabled) {
    const sdk = await getBNMulitChainSdk();
    if (sdk) {
      const wallet2 = state$1.get().wallets.find((wallet3) => wallet3.label === label);
      wallet2.accounts.forEach(({ address }) => {
        sdk.unsubscribe({
          id: address,
          chainId: wallet2.chains[0].id,
          timeout: 6e4
        });
      });
    }
  }
  disconnectWallet$.next(label);
  removeWallet(label);
  const labels = JSON.parse(getLocalStore(STORAGE_KEYS.LAST_CONNECTED_WALLET));
  if (Array.isArray(labels) && labels.indexOf(label) >= 0) {
    setLocalStore(STORAGE_KEYS.LAST_CONNECTED_WALLET, JSON.stringify(labels.filter((walletLabel) => walletLabel !== label)));
  }
  if (typeof labels === "string" && labels === label) {
    delLocalStore(STORAGE_KEYS.LAST_CONNECTED_WALLET);
  }
  return state$1.get().wallets;
}
async function setChain(options2) {
  const error = validateSetChainOptions(options2);
  if (error) {
    throw error;
  }
  const { wallets: wallets2, chains: chains2 } = state$1.get();
  const { chainId, chainNamespace = "evm", wallet: walletToSet, rpcUrl, label, token } = options2;
  const chainIdHex = toHexString(chainId);
  const chain = chains2.find(({ namespace, id }) => namespace === chainNamespace && id.toLowerCase() === chainIdHex.toLowerCase());
  if (!chain) {
    throw new Error(`Chain with chainId: ${chainId} and chainNamespace: ${chainNamespace} has not been set and must be added when Onboard is initialized.`);
  }
  const wallet2 = walletToSet ? wallets2.find(({ label: label2 }) => label2 === walletToSet) : wallets2[0];
  if (!wallet2) {
    throw new Error(walletToSet ? `Wallet with label ${walletToSet} is not connected` : "A wallet must be connected before a chain can be set");
  }
  const [walletConnectedChain] = wallet2.chains;
  if (walletConnectedChain.namespace === chainNamespace && walletConnectedChain.id === chainIdHex) {
    return true;
  }
  try {
    await switchChain(wallet2.provider, chainIdHex);
    return true;
  } catch (error2) {
    const { code } = error2;
    const switchChainModalClosed$ = switchChainModal$.pipe(filter((x) => x === null), map(() => false));
    if (code === ProviderRpcErrorCode.CHAIN_NOT_ADDED || code === ProviderRpcErrorCode.UNRECOGNIZED_CHAIN_ID) {
      if (rpcUrl || label || token) {
        if (rpcUrl) {
          chain.rpcUrl = rpcUrl;
        }
        if (label) {
          chain.label = label;
        }
        if (token) {
          chain.token = token;
        }
        updateChain(chain);
      }
      return chainNotInWallet(wallet2, chain, switchChainModalClosed$, chainIdHex);
    }
    if (code === ProviderRpcErrorCode.UNSUPPORTED_METHOD) {
      switchChainModal$.next({ chain });
      return firstValueFrom(switchChainModalClosed$);
    }
  }
  return false;
}
const chainNotInWallet = async (wallet2, chain, switchChainModalClosed$, chainIdHex) => {
  try {
    await addNewChain(wallet2.provider, chain);
    await switchChain(wallet2.provider, chainIdHex);
    return true;
  } catch (error) {
    const { code } = error;
    if (code === ProviderRpcErrorCode.ACCOUNT_ACCESS_REJECTED) {
      return false;
    }
    switchChainModal$.next({ chain });
    return firstValueFrom(switchChainModalClosed$);
  }
};
function initialize(options2) {
  if (options2) {
    const { en: customizedEn } = options2;
    const merged = merge(en, customizedEn || {});
    addMessages("en", merged);
    const customLocales = Object.keys(options2).filter((key) => key !== "en");
    customLocales.forEach((locale2) => {
      const dictionary2 = options2[locale2];
      dictionary2 && addMessages(locale2, dictionary2);
    });
  } else {
    addMessages("en", en);
  }
  init$2({
    fallbackLocale: "en",
    initialLocale: getLocaleFromNavigator()
  });
}
var closeIcon = `
  <svg width="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
  </svg>
`;
function add_css$i(target) {
  append_styles(target, "svelte-1ubf722", ".close-button.svelte-1ubf722.svelte-1ubf722{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;height:2rem;width:2rem;border-radius:2rem;cursor:pointer;color:var(--onboard-close-button-color, inherit)}.close-button.svelte-1ubf722.svelte-1ubf722:hover::before{opacity:0.2}.close-button.svelte-1ubf722:hover .svg-box.svelte-1ubf722{opacity:1}.close-button.svelte-1ubf722.svelte-1ubf722::before{content:'';position:absolute;height:inherit;width:inherit;opacity:0.1;background:currentColor;transition:300ms ease-in-out opacity}.svg-box.svelte-1ubf722.svelte-1ubf722{position:absolute;height:1.5rem;width:1.5rem;opacity:0.6;transition:300ms ease-in-out opacity}");
}
function create_fragment$i(ctx) {
  let div1;
  let div0;
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      attr(div0, "class", "svg-box svelte-1ubf722");
      attr(div1, "class", "close-button svelte-1ubf722");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      div0.innerHTML = closeIcon;
    },
    p: noop,
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(div1);
    }
  };
}
class CloseButton extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(this, options2, null, create_fragment$i, safe_not_equal, {}, add_css$i);
  }
}
function cubicOut(t) {
  const f = t - 1;
  return f * f * f + 1;
}
function quartOut(t) {
  return Math.pow(t - 1, 3) * (1 - t) + 1;
}
function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
  const o = +getComputedStyle(node).opacity;
  return {
    delay,
    duration,
    easing,
    css: (t) => `opacity: ${t * o}`
  };
}
function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
  const style = getComputedStyle(node);
  const target_opacity = +style.opacity;
  const transform = style.transform === "none" ? "" : style.transform;
  const od = target_opacity * (1 - opacity);
  const [xValue, xUnit] = split_css_unit(x);
  const [yValue, yUnit] = split_css_unit(y);
  return {
    delay,
    duration,
    easing,
    css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * xValue}${xUnit}, ${(1 - t) * yValue}${yUnit});
			opacity: ${target_opacity - od * u}`
  };
}
function slide(node, { delay = 0, duration = 400, easing = cubicOut, axis = "y" } = {}) {
  const style = getComputedStyle(node);
  const opacity = +style.opacity;
  const primary_property = axis === "y" ? "height" : "width";
  const primary_property_value = parseFloat(style[primary_property]);
  const secondary_properties = axis === "y" ? ["top", "bottom"] : ["left", "right"];
  const capitalized_secondary_properties = secondary_properties.map((e) => `${e[0].toUpperCase()}${e.slice(1)}`);
  const padding_start_value = parseFloat(style[`padding${capitalized_secondary_properties[0]}`]);
  const padding_end_value = parseFloat(style[`padding${capitalized_secondary_properties[1]}`]);
  const margin_start_value = parseFloat(style[`margin${capitalized_secondary_properties[0]}`]);
  const margin_end_value = parseFloat(style[`margin${capitalized_secondary_properties[1]}`]);
  const border_width_start_value = parseFloat(style[`border${capitalized_secondary_properties[0]}Width`]);
  const border_width_end_value = parseFloat(style[`border${capitalized_secondary_properties[1]}Width`]);
  return {
    delay,
    duration,
    easing,
    css: (t) => `overflow: hidden;opacity: ${Math.min(t * 20, 1) * opacity};${primary_property}: ${t * primary_property_value}px;padding-${secondary_properties[0]}: ${t * padding_start_value}px;padding-${secondary_properties[1]}: ${t * padding_end_value}px;margin-${secondary_properties[0]}: ${t * margin_start_value}px;margin-${secondary_properties[1]}: ${t * margin_end_value}px;border-${secondary_properties[0]}-width: ${t * border_width_start_value}px;border-${secondary_properties[1]}-width: ${t * border_width_end_value}px;`
  };
}
function add_css$h(target) {
  append_styles(target, "svelte-baitaa", "section.svelte-baitaa{top:0;left:0;pointer-events:none;z-index:var(--onboard-modal-z-index, var(--modal-z-index))}.background.svelte-baitaa{background:var(--onboard-modal-backdrop, var(--modal-backdrop));pointer-events:all}.full-screen-background.svelte-baitaa{width:100vw;height:100vh}.max-height.svelte-baitaa{max-height:calc(100vh - 2rem)}.modal-position.svelte-baitaa{top:var(--onboard-modal-top, var(--modal-top));bottom:var(--onboard-modal-bottom, var(--modal-bottom));left:var(--onboard-modal-left, var(--modal-left));right:var(--onboard-modal-right, var(--modal-right))}.modal-overflow.svelte-baitaa{overflow:hidden}.modal-styling.svelte-baitaa{--border-radius:var(\n      --onboard-modal-border-radius,\n      var(--w3o-border-radius, 1rem)\n    );border-radius:var(--border-radius) var(--border-radius) 0 0;box-shadow:var(--onboard-modal-box-shadow, var(--box-shadow-0));max-width:100vw}.modal.svelte-baitaa{overflow-y:auto;background:var(--onboard-modal-background, white);color:var(--onboard-modal-color, initial)}.width-100.svelte-baitaa{width:100%}.modal-container-mobile.svelte-baitaa{bottom:0}@media all and (min-width: 768px){.modal-styling.svelte-baitaa{border-radius:var(--border-radius)}.modal-container-mobile.svelte-baitaa{bottom:unset;margin:1rem}.width-100.svelte-baitaa{width:unset}}");
}
function create_fragment$h(ctx) {
  let section;
  let div4;
  let div3;
  let div2;
  let div1;
  let div0;
  let section_transition;
  let current2;
  let mounted;
  let dispose;
  const default_slot_template = (
    /*#slots*/
    ctx[3].default
  );
  const default_slot = create_slot(
    default_slot_template,
    ctx,
    /*$$scope*/
    ctx[2],
    null
  );
  return {
    c() {
      section = element("section");
      div4 = element("div");
      div3 = element("div");
      div2 = element("div");
      div1 = element("div");
      div0 = element("div");
      if (default_slot)
        default_slot.c();
      attr(div0, "class", "modal relative svelte-baitaa");
      attr(div1, "class", "modal-overflow modal-styling relative flex justify-center svelte-baitaa");
      attr(div1, "style", `${/*connectContainerEl*/
      ctx[1] ? "max-width: 100%;" : ""}`);
      attr(div2, "class", "flex relative max-height svelte-baitaa");
      toggle_class(
        div2,
        "width-100",
        /*connectContainerEl*/
        ctx[1]
      );
      attr(div3, "class", "modal-container-mobile modal-position flex svelte-baitaa");
      toggle_class(div3, "absolute", !/*connectContainerEl*/
      ctx[1]);
      toggle_class(
        div3,
        "width-100",
        /*connectContainerEl*/
        ctx[1]
      );
      attr(div4, "class", "background flex items-center justify-center relative svelte-baitaa");
      toggle_class(div4, "full-screen-background", !/*connectContainerEl*/
      ctx[1]);
      attr(section, "class", "svelte-baitaa");
      toggle_class(section, "fixed", !/*connectContainerEl*/
      ctx[1]);
    },
    m(target, anchor) {
      insert(target, section, anchor);
      append(section, div4);
      append(div4, div3);
      append(div3, div2);
      append(div2, div1);
      append(div1, div0);
      if (default_slot) {
        default_slot.m(div0, null);
      }
      current2 = true;
      if (!mounted) {
        dispose = [
          listen(div2, "click", stop_propagation(
            /*click_handler*/
            ctx[4]
          )),
          listen(div4, "click", function() {
            if (is_function(
              /*close*/
              ctx[0]
            ))
              ctx[0].apply(this, arguments);
          })
        ];
        mounted = true;
      }
    },
    p(new_ctx, [dirty]) {
      ctx = new_ctx;
      if (default_slot) {
        if (default_slot.p && (!current2 || dirty & /*$$scope*/
        4)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/
            ctx[2],
            !current2 ? get_all_dirty_from_scope(
              /*$$scope*/
              ctx[2]
            ) : get_slot_changes(
              default_slot_template,
              /*$$scope*/
              ctx[2],
              dirty,
              null
            ),
            null
          );
        }
      }
    },
    i(local) {
      if (current2)
        return;
      transition_in(default_slot, local);
      add_render_callback(() => {
        if (!current2)
          return;
        if (!section_transition)
          section_transition = create_bidirectional_transition(section, fade, {}, true);
        section_transition.run(1);
      });
      current2 = true;
    },
    o(local) {
      transition_out(default_slot, local);
      if (!section_transition)
        section_transition = create_bidirectional_transition(section, fade, {}, false);
      section_transition.run(0);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(section);
      if (default_slot)
        default_slot.d(detaching);
      if (detaching && section_transition)
        section_transition.end();
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance$h($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  const connectContainerEl = !!configuration.containerElements.connectModal;
  const html = document.documentElement;
  onMount(() => {
    if (!connectContainerEl) {
      html.style.position = "sticky";
      html.style.overflow = "hidden";
    }
  });
  onDestroy(() => {
    if (!connectContainerEl) {
      html.style.position = "";
      html.style.removeProperty("overflow");
    }
  });
  let { close } = $$props;
  function click_handler(event) {
    bubble.call(this, $$self, event);
  }
  $$self.$$set = ($$props2) => {
    if ("close" in $$props2)
      $$invalidate(0, close = $$props2.close);
    if ("$$scope" in $$props2)
      $$invalidate(2, $$scope = $$props2.$$scope);
  };
  return [close, connectContainerEl, $$scope, slots, click_handler];
}
class Modal extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(this, options2, instance$h, create_fragment$h, safe_not_equal, { close: 0 }, add_css$h);
  }
}
function add_css$g(target) {
  append_styles(target, "svelte-tz7ru1", ".container.svelte-tz7ru1{padding:var(--onboard-spacing-4, var(--spacing-4));font-size:var(--onboard-font-size-6, var(--font-size-6));line-height:24px}input.svelte-tz7ru1{height:1rem;width:1rem;margin-right:0.5rem}");
}
function create_if_block$a(ctx) {
  let div;
  let label;
  let input;
  let t0;
  let span;
  let t1_value = (
    /*$_*/
    ctx[1]("connect.selectingWallet.agreement.agree") + ""
  );
  let t1;
  let t2;
  let t3_value = " ";
  let t3;
  let t4;
  let t5;
  let mounted;
  let dispose;
  let if_block0 = (
    /*termsUrl*/
    ctx[3] && create_if_block_2$4(ctx)
  );
  let if_block1 = (
    /*privacyUrl*/
    ctx[4] && create_if_block_1$5(ctx)
  );
  return {
    c() {
      div = element("div");
      label = element("label");
      input = element("input");
      t0 = space();
      span = element("span");
      t1 = text(t1_value);
      t2 = space();
      t3 = text(t3_value);
      t4 = space();
      if (if_block0)
        if_block0.c();
      t5 = space();
      if (if_block1)
        if_block1.c();
      attr(input, "class", " svelte-tz7ru1");
      attr(input, "type", "checkbox");
      attr(label, "class", "flex");
      attr(div, "class", "container flex items-center svelte-tz7ru1");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, label);
      append(label, input);
      input.checked = /*agreed*/
      ctx[0];
      append(label, t0);
      append(label, span);
      append(span, t1);
      append(span, t2);
      append(span, t3);
      append(span, t4);
      if (if_block0)
        if_block0.m(span, null);
      append(span, t5);
      if (if_block1)
        if_block1.m(span, null);
      if (!mounted) {
        dispose = listen(
          input,
          "change",
          /*input_change_handler*/
          ctx[6]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & /*agreed*/
      1) {
        input.checked = /*agreed*/
        ctx2[0];
      }
      if (dirty & /*$_*/
      2 && t1_value !== (t1_value = /*$_*/
      ctx2[1]("connect.selectingWallet.agreement.agree") + ""))
        set_data(t1, t1_value);
      if (
        /*termsUrl*/
        ctx2[3]
      )
        if_block0.p(ctx2, dirty);
      if (
        /*privacyUrl*/
        ctx2[4]
      )
        if_block1.p(ctx2, dirty);
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_2$4(ctx) {
  let a;
  let t0_value = (
    /*$_*/
    ctx[1]("connect.selectingWallet.agreement.terms") + ""
  );
  let t0;
  let t1_value = (
    /*privacyUrl*/
    ctx[4] ? " " + /*$_*/
    ctx[1]("connect.selectingWallet.agreement.and") + " " : "."
  );
  let t1;
  return {
    c() {
      a = element("a");
      t0 = text(t0_value);
      t1 = text(t1_value);
      attr(
        a,
        "href",
        /*termsUrl*/
        ctx[3]
      );
      attr(a, "target", "_blank");
    },
    m(target, anchor) {
      insert(target, a, anchor);
      append(a, t0);
      insert(target, t1, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & /*$_*/
      2 && t0_value !== (t0_value = /*$_*/
      ctx2[1]("connect.selectingWallet.agreement.terms") + ""))
        set_data(t0, t0_value);
      if (dirty & /*$_*/
      2 && t1_value !== (t1_value = /*privacyUrl*/
      ctx2[4] ? " " + /*$_*/
      ctx2[1]("connect.selectingWallet.agreement.and") + " " : "."))
        set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching)
        detach(a);
      if (detaching)
        detach(t1);
    }
  };
}
function create_if_block_1$5(ctx) {
  let a;
  let t0_value = (
    /*$_*/
    ctx[1]("connect.selectingWallet.agreement.privacy") + ""
  );
  let t0;
  let t1;
  return {
    c() {
      a = element("a");
      t0 = text(t0_value);
      t1 = text(".");
      attr(
        a,
        "href",
        /*privacyUrl*/
        ctx[4]
      );
      attr(a, "target", "_blank");
    },
    m(target, anchor) {
      insert(target, a, anchor);
      append(a, t0);
      insert(target, t1, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & /*$_*/
      2 && t0_value !== (t0_value = /*$_*/
      ctx2[1]("connect.selectingWallet.agreement.privacy") + ""))
        set_data(t0, t0_value);
    },
    d(detaching) {
      if (detaching)
        detach(a);
      if (detaching)
        detach(t1);
    }
  };
}
function create_fragment$g(ctx) {
  let if_block_anchor;
  let if_block = (
    /*showTermsOfService*/
    ctx[5] && create_if_block$a(ctx)
  );
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, [dirty]) {
      if (
        /*showTermsOfService*/
        ctx2[5]
      )
        if_block.p(ctx2, dirty);
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function instance$g($$self, $$props, $$invalidate) {
  let $appMetadata$;
  let $_;
  component_subscribe($$self, $format, ($$value) => $$invalidate(1, $_ = $$value));
  let { agreed } = $$props;
  const { terms: termsAgreed, privacy: privacyAgreed, version: versionAgreed } = JSON.parse(getLocalStore(STORAGE_KEYS.TERMS_AGREEMENT) || "{}");
  const blankAgreement = {
    termsUrl: "",
    privacyUrl: "",
    version: ""
  };
  const appMetadata$ = state$1.select("appMetadata").pipe(startWith$2(state$1.get().appMetadata), shareReplay$2(1));
  component_subscribe($$self, appMetadata$, (value) => $$invalidate(7, $appMetadata$ = value));
  const { termsUrl, privacyUrl, version } = $appMetadata$ && $appMetadata$.agreement || blankAgreement;
  const showTermsOfService = !!(termsUrl && !termsAgreed || privacyUrl && !privacyAgreed || version && version !== versionAgreed);
  agreed = !showTermsOfService;
  function input_change_handler() {
    agreed = this.checked;
    $$invalidate(0, agreed);
  }
  $$self.$$set = ($$props2) => {
    if ("agreed" in $$props2)
      $$invalidate(0, agreed = $$props2.agreed);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*agreed*/
    1) {
      if (agreed) {
        setLocalStore(STORAGE_KEYS.TERMS_AGREEMENT, JSON.stringify({
          version,
          terms: !!termsUrl,
          privacy: !!privacyUrl
        }));
      } else if (agreed === false) {
        delLocalStore(STORAGE_KEYS.TERMS_AGREEMENT);
      }
    }
  };
  return [
    agreed,
    $_,
    appMetadata$,
    termsUrl,
    privacyUrl,
    showTermsOfService,
    input_change_handler
  ];
}
class Agreement extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(this, options2, instance$g, create_fragment$g, safe_not_equal, { agreed: 0 }, add_css$g);
  }
}
function add_css$f(target) {
  append_styles(target, "svelte-2btye1", ".icon.svelte-2btye1{color:var(--onboard-white, var(--white));border-radius:50px;bottom:-0.25rem;right:-0.25rem}.yellow.svelte-2btye1{background:var(--onboard-warning-500, var(--warning-500))}");
}
function create_fragment$f(ctx) {
  let div;
  let div_class_value;
  let div_style_value;
  return {
    c() {
      div = element("div");
      attr(div, "class", div_class_value = null_to_empty(`${/*className*/
      ctx[2]} icon flex absolute`) + " svelte-2btye1");
      attr(div, "style", div_style_value = `width: ${/*size*/
      ctx[0]}px; height: ${/*size*/
      ctx[0]}px; padding: ${/*size*/
      ctx[0] / 6}px;`);
      toggle_class(
        div,
        "yellow",
        /*color*/
        ctx[1] === "yellow"
      );
    },
    m(target, anchor) {
      insert(target, div, anchor);
      div.innerHTML = pendingIcon;
    },
    p(ctx2, [dirty]) {
      if (dirty & /*className*/
      4 && div_class_value !== (div_class_value = null_to_empty(`${/*className*/
      ctx2[2]} icon flex absolute`) + " svelte-2btye1")) {
        attr(div, "class", div_class_value);
      }
      if (dirty & /*size*/
      1 && div_style_value !== (div_style_value = `width: ${/*size*/
      ctx2[0]}px; height: ${/*size*/
      ctx2[0]}px; padding: ${/*size*/
      ctx2[0] / 6}px;`)) {
        attr(div, "style", div_style_value);
      }
      if (dirty & /*className, color*/
      6) {
        toggle_class(
          div,
          "yellow",
          /*color*/
          ctx2[1] === "yellow"
        );
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function instance$f($$self, $$props, $$invalidate) {
  let { size } = $$props;
  let { color = "yellow" } = $$props;
  let { class: className = "test" } = $$props;
  $$self.$$set = ($$props2) => {
    if ("size" in $$props2)
      $$invalidate(0, size = $$props2.size);
    if ("color" in $$props2)
      $$invalidate(1, color = $$props2.color);
    if ("class" in $$props2)
      $$invalidate(2, className = $$props2.class);
  };
  return [size, color, className];
}
class PendingStatusIcon extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(this, options2, instance$f, create_fragment$f, safe_not_equal, { size: 0, color: 1, class: 2 }, add_css$f);
  }
}
function add_css$e(target) {
  append_styles(target, "svelte-1bikw7k", ".icon.svelte-1bikw7k{color:var(--onboard-white, var(--white));border-radius:50px}.green.svelte-1bikw7k{background:var(--onboard-success-600, var(--success-600))}.blue.svelte-1bikw7k{background:var(--onboard-primary-1, var(--primary-1))}");
}
function create_fragment$e(ctx) {
  let div;
  let div_style_value;
  return {
    c() {
      div = element("div");
      attr(div, "class", "icon flex svelte-1bikw7k");
      attr(div, "style", div_style_value = `width: ${/*size*/
      ctx[0]}px; height: ${/*size*/
      ctx[0]}px; padding: ${/*size*/
      ctx[0] / 5}px;`);
      toggle_class(
        div,
        "green",
        /*color*/
        ctx[1] === "green"
      );
      toggle_class(
        div,
        "blue",
        /*color*/
        ctx[1] === "blue"
      );
    },
    m(target, anchor) {
      insert(target, div, anchor);
      div.innerHTML = successIcon;
    },
    p(ctx2, [dirty]) {
      if (dirty & /*size*/
      1 && div_style_value !== (div_style_value = `width: ${/*size*/
      ctx2[0]}px; height: ${/*size*/
      ctx2[0]}px; padding: ${/*size*/
      ctx2[0] / 5}px;`)) {
        attr(div, "style", div_style_value);
      }
      if (dirty & /*color*/
      2) {
        toggle_class(
          div,
          "green",
          /*color*/
          ctx2[1] === "green"
        );
      }
      if (dirty & /*color*/
      2) {
        toggle_class(
          div,
          "blue",
          /*color*/
          ctx2[1] === "blue"
        );
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function instance$e($$self, $$props, $$invalidate) {
  let { size } = $$props;
  let { color = "green" } = $$props;
  $$self.$$set = ($$props2) => {
    if ("size" in $$props2)
      $$invalidate(0, size = $$props2.size);
    if ("color" in $$props2)
      $$invalidate(1, color = $$props2.color);
  };
  return [size, color];
}
class SuccessStatusIcon extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(this, options2, instance$e, create_fragment$e, safe_not_equal, { size: 0, color: 1 }, add_css$e);
  }
}
function add_css$d(target) {
  append_styles(target, "svelte-1le5672", ".loading-container.svelte-1le5672.svelte-1le5672{font-family:inherit;font-size:inherit;color:inherit}span.svelte-1le5672.svelte-1le5672{font-family:inherit;font-size:0.889em;margin-top:1rem}.loading.svelte-1le5672.svelte-1le5672{display:inline-block}.loading.svelte-1le5672 div.svelte-1le5672{font-size:inherit;display:block;position:absolute;border:3px solid;border-radius:50%;animation:svelte-1le5672-bn-loading 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;border-color:currentColor transparent transparent transparent}.loading.svelte-1le5672 .loading-first.svelte-1le5672{animation-delay:-0.45s}.loading.svelte-1le5672 .loading-second.svelte-1le5672{animation-delay:-0.3s}.loading.svelte-1le5672 .loading-third.svelte-1le5672{animation-delay:-0.15s}@keyframes svelte-1le5672-bn-loading{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}");
}
function create_if_block$9(ctx) {
  let span;
  let t;
  return {
    c() {
      span = element("span");
      t = text(
        /*description*/
        ctx[0]
      );
      attr(span, "class", "svelte-1le5672");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t);
    },
    p(ctx2, dirty) {
      if (dirty & /*description*/
      1)
        set_data(
          t,
          /*description*/
          ctx2[0]
        );
    },
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_fragment$d(ctx) {
  let div4;
  let div3;
  let div0;
  let div0_style_value;
  let t0;
  let div1;
  let div1_style_value;
  let t1;
  let div2;
  let div2_style_value;
  let div3_style_value;
  let t2;
  let if_block = (
    /*description*/
    ctx[0] && create_if_block$9(ctx)
  );
  return {
    c() {
      div4 = element("div");
      div3 = element("div");
      div0 = element("div");
      t0 = space();
      div1 = element("div");
      t1 = space();
      div2 = element("div");
      t2 = space();
      if (if_block)
        if_block.c();
      attr(div0, "class", "loading-first svelte-1le5672");
      attr(div0, "style", div0_style_value = `height: ${/*size*/
      ctx[1]}; width: ${/*size*/
      ctx[1]};`);
      attr(div1, "class", "loading-second svelte-1le5672");
      attr(div1, "style", div1_style_value = `height: ${/*size*/
      ctx[1]}; width: ${/*size*/
      ctx[1]};`);
      attr(div2, "class", "loading-third svelte-1le5672");
      attr(div2, "style", div2_style_value = `height: ${/*size*/
      ctx[1]}; width: ${/*size*/
      ctx[1]};`);
      attr(div3, "class", "loading relative svelte-1le5672");
      attr(div3, "style", div3_style_value = `height: ${/*size*/
      ctx[1]}; width: ${/*size*/
      ctx[1]};`);
      attr(div4, "class", "loading-container flex flex-column justify-center items-center absolute svelte-1le5672");
    },
    m(target, anchor) {
      insert(target, div4, anchor);
      append(div4, div3);
      append(div3, div0);
      append(div3, t0);
      append(div3, div1);
      append(div3, t1);
      append(div3, div2);
      append(div4, t2);
      if (if_block)
        if_block.m(div4, null);
    },
    p(ctx2, [dirty]) {
      if (dirty & /*size*/
      2 && div0_style_value !== (div0_style_value = `height: ${/*size*/
      ctx2[1]}; width: ${/*size*/
      ctx2[1]};`)) {
        attr(div0, "style", div0_style_value);
      }
      if (dirty & /*size*/
      2 && div1_style_value !== (div1_style_value = `height: ${/*size*/
      ctx2[1]}; width: ${/*size*/
      ctx2[1]};`)) {
        attr(div1, "style", div1_style_value);
      }
      if (dirty & /*size*/
      2 && div2_style_value !== (div2_style_value = `height: ${/*size*/
      ctx2[1]}; width: ${/*size*/
      ctx2[1]};`)) {
        attr(div2, "style", div2_style_value);
      }
      if (dirty & /*size*/
      2 && div3_style_value !== (div3_style_value = `height: ${/*size*/
      ctx2[1]}; width: ${/*size*/
      ctx2[1]};`)) {
        attr(div3, "style", div3_style_value);
      }
      if (
        /*description*/
        ctx2[0]
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block$9(ctx2);
          if_block.c();
          if_block.m(div4, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(div4);
      if (if_block)
        if_block.d();
    }
  };
}
function instance$d($$self, $$props, $$invalidate) {
  let { description = "" } = $$props;
  let { size = "2rem" } = $$props;
  $$self.$$set = ($$props2) => {
    if ("description" in $$props2)
      $$invalidate(0, description = $$props2.description);
    if ("size" in $$props2)
      $$invalidate(1, size = $$props2.size);
  };
  return [description, size];
}
class Spinner extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(this, options2, instance$d, create_fragment$d, safe_not_equal, { description: 0, size: 1 }, add_css$d);
  }
}
function add_css$c(target) {
  append_styles(target, "svelte-i129jl", ".icon.svelte-i129jl{height:100%}.border-custom.svelte-i129jl{border:1px solid var(--border-color)}.border-yellow.svelte-i129jl{border:1px solid var(--onboard-warning-500, var(--warning-500))}.border-gray.svelte-i129jl{border:1px solid var(--onboard-gray-400, var(--gray-400))}.border-green.svelte-i129jl{border:1px solid var(--onboard-success-500, var(--success-500))}.border-dark-green.svelte-i129jl{border:1px solid var(--onboard-success-700, var(--success-700))}.border-blue.svelte-i129jl{border:1px solid\n      var(\n        --onboard-wallet-app-icon-border-color,\n        var(--onboard-primary-300, var(--primary-300))\n      )}.border-dark-blue.svelte-i129jl{border:1px solid\n      var(\n        --onboard-wallet-app-icon-border-color,\n        var(--onboard-primary-600, var(--primary-600))\n      )}.border-transparent.svelte-i129jl{border:1px solid transparent}.border-black.svelte-i129jl{border:1px solid var(--onboard-gray-600, var(--gray-600))}.background-gray.svelte-i129jl{background:var(\n      --onboard-wallet-app-icon-background-gray,\n      var(--onboard-gray-500, var(--gray-500))\n    )}.background-light-gray.svelte-i129jl{background:var(\n      --onboard-wallet-app-icon-background-light-gray,\n      var(--onboard-gray-100, var(--gray-100))\n    )}.background-light-blue.svelte-i129jl{background:var(\n      --onboard-wallet-app-icon-background-light-blue,\n      var(--onboard-primary-100, var(--primary-100))\n    )}.background-green.svelte-i129jl{background:var(\n      --onboard-wallet-app-icon-background-green,\n      var(--onboard-success-100, var(--success-100))\n    )}.background-white.svelte-i129jl{background:var(\n      --onboard-wallet-app-icon-background-white,\n      var(--onboard-white, var(--white))\n    )}.background-transparent.svelte-i129jl{background:var(\n      --onboard-wallet-app-icon-background-transparent,\n      transparent\n    )}@keyframes svelte-i129jl-pulse{from{opacity:0}to{opacity:1}}.placeholder-icon.svelte-i129jl{width:100%;height:100%;background:var(--onboard-gray-100, var(--gray-100));border-radius:32px;animation:svelte-i129jl-pulse infinite 750ms alternate ease-in-out}.spinner-container.svelte-i129jl{color:var(--onboard-primary-300, var(--primary-300))}img.svelte-i129jl{max-width:100%;height:auto}.pending-status-icon{z-index:1;fill:white;box-shadow:0px 2px 12px 0px rgba(0, 0, 0, 0.1)}.status-icon-container.svelte-i129jl{right:-0.25rem;bottom:-0.25rem;position:absolute}");
}
const get_status_slot_changes = (dirty) => ({});
const get_status_slot_context = (ctx) => ({});
function create_else_block$4(ctx) {
  let await_block_anchor;
  let promise2;
  let current2;
  let info = {
    ctx,
    current: null,
    token: null,
    hasCatch: false,
    pending: create_pending_block$1,
    then: create_then_block$1,
    catch: create_catch_block$1,
    value: 13,
    blocks: [, , ,]
  };
  handle_promise(promise2 = /*icon*/
  ctx[1], info);
  return {
    c() {
      await_block_anchor = empty();
      info.block.c();
    },
    m(target, anchor) {
      insert(target, await_block_anchor, anchor);
      info.block.m(target, info.anchor = anchor);
      info.mount = () => await_block_anchor.parentNode;
      info.anchor = await_block_anchor;
      current2 = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      info.ctx = ctx;
      if (dirty & /*icon*/
      2 && promise2 !== (promise2 = /*icon*/
      ctx[1]) && handle_promise(promise2, info))
        ;
      else {
        update_await_block_branch(info, ctx, dirty);
      }
    },
    i(local) {
      if (current2)
        return;
      transition_in(info.block);
      current2 = true;
    },
    o(local) {
      for (let i = 0; i < 3; i += 1) {
        const block = info.blocks[i];
        transition_out(block);
      }
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(await_block_anchor);
      info.block.d(detaching);
      info.token = null;
      info = null;
    }
  };
}
function create_if_block$8(ctx) {
  let div;
  let spinner;
  let current2;
  spinner = new Spinner({ props: { size: "2rem" } });
  return {
    c() {
      div = element("div");
      create_component(spinner.$$.fragment);
      attr(div, "class", "spinner-container svelte-i129jl");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(spinner, div, null);
      current2 = true;
    },
    p: noop,
    i(local) {
      if (current2)
        return;
      transition_in(spinner.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(spinner.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_component(spinner);
    }
  };
}
function create_catch_block$1(ctx) {
  return {
    c: noop,
    m: noop,
    p: noop,
    i: noop,
    o: noop,
    d: noop
  };
}
function create_then_block$1(ctx) {
  let div;
  let show_if;
  let div_intro;
  let t;
  let if_block1_anchor;
  let current2;
  function select_block_type_1(ctx2, dirty) {
    if (dirty & /*icon*/
    2)
      show_if = null;
    if (show_if == null)
      show_if = !!isSVG(
        /*iconLoaded*/
        ctx2[13]
      );
    if (show_if)
      return create_if_block_2$3;
    return create_else_block_1$2;
  }
  let current_block_type = select_block_type_1(ctx, -1);
  let if_block0 = current_block_type(ctx);
  let if_block1 = (
    /*loading*/
    ctx[2] && /*windowWidth*/
    ctx[9] <= MOBILE_WINDOW_WIDTH && create_if_block_1$4()
  );
  return {
    c() {
      div = element("div");
      if_block0.c();
      t = space();
      if (if_block1)
        if_block1.c();
      if_block1_anchor = empty();
      attr(div, "class", "icon flex justify-center items-center svelte-i129jl");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if_block0.m(div, null);
      insert(target, t, anchor);
      if (if_block1)
        if_block1.m(target, anchor);
      insert(target, if_block1_anchor, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type_1(ctx2, dirty)) && if_block0) {
        if_block0.p(ctx2, dirty);
      } else {
        if_block0.d(1);
        if_block0 = current_block_type(ctx2);
        if (if_block0) {
          if_block0.c();
          if_block0.m(div, null);
        }
      }
      if (
        /*loading*/
        ctx2[2] && /*windowWidth*/
        ctx2[9] <= MOBILE_WINDOW_WIDTH
      ) {
        if (if_block1) {
          if (dirty & /*loading, windowWidth*/
          516) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block_1$4();
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
        }
      } else if (if_block1) {
        group_outros();
        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current2)
        return;
      if (local) {
        if (!div_intro) {
          add_render_callback(() => {
            div_intro = create_in_transition(div, fade, {});
            div_intro.start();
          });
        }
      }
      transition_in(if_block1);
      current2 = true;
    },
    o(local) {
      transition_out(if_block1);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if_block0.d();
      if (detaching)
        detach(t);
      if (if_block1)
        if_block1.d(detaching);
      if (detaching)
        detach(if_block1_anchor);
    }
  };
}
function create_else_block_1$2(ctx) {
  let img;
  let img_src_value;
  return {
    c() {
      img = element("img");
      if (!src_url_equal(img.src, img_src_value = /*iconLoaded*/
      ctx[13]))
        attr(img, "src", img_src_value);
      attr(img, "alt", "logo");
      attr(img, "class", "svelte-i129jl");
    },
    m(target, anchor) {
      insert(target, img, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & /*icon*/
      2 && !src_url_equal(img.src, img_src_value = /*iconLoaded*/
      ctx2[13])) {
        attr(img, "src", img_src_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(img);
    }
  };
}
function create_if_block_2$3(ctx) {
  let html_tag;
  let raw_value = (
    /*iconLoaded*/
    ctx[13] + ""
  );
  let html_anchor;
  return {
    c() {
      html_tag = new HtmlTag(false);
      html_anchor = empty();
      html_tag.a = html_anchor;
    },
    m(target, anchor) {
      html_tag.m(raw_value, target, anchor);
      insert(target, html_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & /*icon*/
      2 && raw_value !== (raw_value = /*iconLoaded*/
      ctx2[13] + ""))
        html_tag.p(raw_value);
    },
    d(detaching) {
      if (detaching)
        detach(html_anchor);
      if (detaching)
        html_tag.d();
    }
  };
}
function create_if_block_1$4(ctx) {
  let div;
  let pendingstatusicon;
  let current2;
  pendingstatusicon = new PendingStatusIcon({
    props: { class: "pending-status-icon", size: 20 }
  });
  return {
    c() {
      div = element("div");
      create_component(pendingstatusicon.$$.fragment);
      attr(div, "class", "status-icon-container svelte-i129jl");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(pendingstatusicon, div, null);
      current2 = true;
    },
    i(local) {
      if (current2)
        return;
      transition_in(pendingstatusicon.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(pendingstatusicon.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_component(pendingstatusicon);
    }
  };
}
function create_pending_block$1(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      attr(div, "class", "placeholder-icon svelte-i129jl");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    p: noop,
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_fragment$c(ctx) {
  let div;
  let current_block_type_index;
  let if_block;
  let t;
  let div_style_value;
  let current2;
  let mounted;
  let dispose;
  add_render_callback(
    /*onwindowresize*/
    ctx[12]
  );
  const if_block_creators = [create_if_block$8, create_else_block$4];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (
      /*loading*/
      ctx2[2] && /*windowWidth*/
      ctx2[9] >= MOBILE_WINDOW_WIDTH
    )
      return 0;
    return 1;
  }
  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  const status_slot_template = (
    /*#slots*/
    ctx[11].status
  );
  const status_slot = create_slot(
    status_slot_template,
    ctx,
    /*$$scope*/
    ctx[10],
    get_status_slot_context
  );
  return {
    c() {
      div = element("div");
      if_block.c();
      t = space();
      if (status_slot)
        status_slot.c();
      attr(div, "class", "relative svelte-i129jl");
      attr(div, "style", div_style_value = `${/*background*/
      ctx[6] === "custom" ? `background-color: ${/*customBackgroundColor*/
      ctx[7]}` : ""}; padding: ${/*padding*/
      ctx[3] - 1}px; width: ${/*size*/
      ctx[0]}px; height: ${/*size*/
      ctx[0]}px; border-radius: ${/*radius*/
      ctx[8]}px; color: ${/*color*/
      ctx[4]};`);
      toggle_class(
        div,
        "border-custom",
        /*border*/
        ctx[5] === "custom"
      );
      toggle_class(
        div,
        "border-yellow",
        /*border*/
        ctx[5] === "yellow"
      );
      toggle_class(
        div,
        "border-gray",
        /*border*/
        ctx[5] === "gray"
      );
      toggle_class(
        div,
        "border-green",
        /*border*/
        ctx[5] === "green"
      );
      toggle_class(
        div,
        "border-dark-green",
        /*border*/
        ctx[5] === "darkGreen"
      );
      toggle_class(
        div,
        "border-blue",
        /*border*/
        ctx[5] === "blue"
      );
      toggle_class(
        div,
        "border-dark-blue",
        /*border*/
        ctx[5] === "darkBlue"
      );
      toggle_class(
        div,
        "border-transparent",
        /*border*/
        ctx[5] === "transparent"
      );
      toggle_class(
        div,
        "border-black",
        /*border*/
        ctx[5] === "black"
      );
      toggle_class(
        div,
        "background-gray",
        /*background*/
        ctx[6] === "gray"
      );
      toggle_class(
        div,
        "background-light-gray",
        /*background*/
        ctx[6] === "lightGray"
      );
      toggle_class(
        div,
        "background-light-blue",
        /*background*/
        ctx[6] === "lightBlue"
      );
      toggle_class(
        div,
        "background-green",
        /*background*/
        ctx[6] === "green"
      );
      toggle_class(
        div,
        "background-white",
        /*background*/
        ctx[6] === "white"
      );
      toggle_class(
        div,
        "background-transparent",
        /*background*/
        ctx[6] === "transparent"
      );
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if_blocks[current_block_type_index].m(div, null);
      append(div, t);
      if (status_slot) {
        status_slot.m(div, null);
      }
      current2 = true;
      if (!mounted) {
        dispose = listen(
          window,
          "resize",
          /*onwindowresize*/
          ctx[12]
        );
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block = if_blocks[current_block_type_index];
        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block.c();
        } else {
          if_block.p(ctx2, dirty);
        }
        transition_in(if_block, 1);
        if_block.m(div, t);
      }
      if (status_slot) {
        if (status_slot.p && (!current2 || dirty & /*$$scope*/
        1024)) {
          update_slot_base(
            status_slot,
            status_slot_template,
            ctx2,
            /*$$scope*/
            ctx2[10],
            !current2 ? get_all_dirty_from_scope(
              /*$$scope*/
              ctx2[10]
            ) : get_slot_changes(
              status_slot_template,
              /*$$scope*/
              ctx2[10],
              dirty,
              get_status_slot_changes
            ),
            get_status_slot_context
          );
        }
      }
      if (!current2 || dirty & /*background, customBackgroundColor, padding, size, radius, color*/
      473 && div_style_value !== (div_style_value = `${/*background*/
      ctx2[6] === "custom" ? `background-color: ${/*customBackgroundColor*/
      ctx2[7]}` : ""}; padding: ${/*padding*/
      ctx2[3] - 1}px; width: ${/*size*/
      ctx2[0]}px; height: ${/*size*/
      ctx2[0]}px; border-radius: ${/*radius*/
      ctx2[8]}px; color: ${/*color*/
      ctx2[4]};`)) {
        attr(div, "style", div_style_value);
      }
      if (!current2 || dirty & /*border*/
      32) {
        toggle_class(
          div,
          "border-custom",
          /*border*/
          ctx2[5] === "custom"
        );
      }
      if (!current2 || dirty & /*border*/
      32) {
        toggle_class(
          div,
          "border-yellow",
          /*border*/
          ctx2[5] === "yellow"
        );
      }
      if (!current2 || dirty & /*border*/
      32) {
        toggle_class(
          div,
          "border-gray",
          /*border*/
          ctx2[5] === "gray"
        );
      }
      if (!current2 || dirty & /*border*/
      32) {
        toggle_class(
          div,
          "border-green",
          /*border*/
          ctx2[5] === "green"
        );
      }
      if (!current2 || dirty & /*border*/
      32) {
        toggle_class(
          div,
          "border-dark-green",
          /*border*/
          ctx2[5] === "darkGreen"
        );
      }
      if (!current2 || dirty & /*border*/
      32) {
        toggle_class(
          div,
          "border-blue",
          /*border*/
          ctx2[5] === "blue"
        );
      }
      if (!current2 || dirty & /*border*/
      32) {
        toggle_class(
          div,
          "border-dark-blue",
          /*border*/
          ctx2[5] === "darkBlue"
        );
      }
      if (!current2 || dirty & /*border*/
      32) {
        toggle_class(
          div,
          "border-transparent",
          /*border*/
          ctx2[5] === "transparent"
        );
      }
      if (!current2 || dirty & /*border*/
      32) {
        toggle_class(
          div,
          "border-black",
          /*border*/
          ctx2[5] === "black"
        );
      }
      if (!current2 || dirty & /*background*/
      64) {
        toggle_class(
          div,
          "background-gray",
          /*background*/
          ctx2[6] === "gray"
        );
      }
      if (!current2 || dirty & /*background*/
      64) {
        toggle_class(
          div,
          "background-light-gray",
          /*background*/
          ctx2[6] === "lightGray"
        );
      }
      if (!current2 || dirty & /*background*/
      64) {
        toggle_class(
          div,
          "background-light-blue",
          /*background*/
          ctx2[6] === "lightBlue"
        );
      }
      if (!current2 || dirty & /*background*/
      64) {
        toggle_class(
          div,
          "background-green",
          /*background*/
          ctx2[6] === "green"
        );
      }
      if (!current2 || dirty & /*background*/
      64) {
        toggle_class(
          div,
          "background-white",
          /*background*/
          ctx2[6] === "white"
        );
      }
      if (!current2 || dirty & /*background*/
      64) {
        toggle_class(
          div,
          "background-transparent",
          /*background*/
          ctx2[6] === "transparent"
        );
      }
    },
    i(local) {
      if (current2)
        return;
      transition_in(if_block);
      transition_in(status_slot, local);
      current2 = true;
    },
    o(local) {
      transition_out(if_block);
      transition_out(status_slot, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if_blocks[current_block_type_index].d();
      if (status_slot)
        status_slot.d(detaching);
      mounted = false;
      dispose();
    }
  };
}
function instance$c($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { size } = $$props;
  let { icon } = $$props;
  let { loading = false } = $$props;
  let { padding = size / 6 } = $$props;
  let { color = "black" } = $$props;
  let { border = "transparent" } = $$props;
  let { background = "transparent" } = $$props;
  let { customBackgroundColor = "" } = $$props;
  let { radius = 12 } = $$props;
  let windowWidth;
  function onwindowresize() {
    $$invalidate(9, windowWidth = window.innerWidth);
  }
  $$self.$$set = ($$props2) => {
    if ("size" in $$props2)
      $$invalidate(0, size = $$props2.size);
    if ("icon" in $$props2)
      $$invalidate(1, icon = $$props2.icon);
    if ("loading" in $$props2)
      $$invalidate(2, loading = $$props2.loading);
    if ("padding" in $$props2)
      $$invalidate(3, padding = $$props2.padding);
    if ("color" in $$props2)
      $$invalidate(4, color = $$props2.color);
    if ("border" in $$props2)
      $$invalidate(5, border = $$props2.border);
    if ("background" in $$props2)
      $$invalidate(6, background = $$props2.background);
    if ("customBackgroundColor" in $$props2)
      $$invalidate(7, customBackgroundColor = $$props2.customBackgroundColor);
    if ("radius" in $$props2)
      $$invalidate(8, radius = $$props2.radius);
    if ("$$scope" in $$props2)
      $$invalidate(10, $$scope = $$props2.$$scope);
  };
  return [
    size,
    icon,
    loading,
    padding,
    color,
    border,
    background,
    customBackgroundColor,
    radius,
    windowWidth,
    $$scope,
    slots,
    onwindowresize
  ];
}
class WalletAppBadge extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(
      this,
      options2,
      instance$c,
      create_fragment$c,
      safe_not_equal,
      {
        size: 0,
        icon: 1,
        loading: 2,
        padding: 3,
        color: 4,
        border: 5,
        background: 6,
        customBackgroundColor: 7,
        radius: 8
      },
      add_css$c
    );
  }
}
function add_css$b(target) {
  append_styles(target, "svelte-q2gson", ".container.svelte-q2gson{gap:1rem;padding:0.75rem;color:var(--onboard-warning-700, var(--warning-700));font-size:var(--onboard-font-size-7, var(--font-size-7));line-height:16px;border:1px solid var(--onboard-warning-400, var(--warning-400));background:var(--onboard-warning-100, var(--warning-100));border-radius:12px}.icon.svelte-q2gson{color:var(--onboard-warning-700, var(--warning-700));width:1rem;height:1rem;flex:0 0 auto}");
}
function create_fragment$b(ctx) {
  let div2;
  let div0;
  let t;
  let div1;
  let div2_intro;
  let current2;
  const default_slot_template = (
    /*#slots*/
    ctx[1].default
  );
  const default_slot = create_slot(
    default_slot_template,
    ctx,
    /*$$scope*/
    ctx[0],
    null
  );
  return {
    c() {
      div2 = element("div");
      div0 = element("div");
      if (default_slot)
        default_slot.c();
      t = space();
      div1 = element("div");
      attr(div1, "class", "icon svelte-q2gson");
      attr(div2, "class", "container flex justify-between svelte-q2gson");
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, div0);
      if (default_slot) {
        default_slot.m(div0, null);
      }
      append(div2, t);
      append(div2, div1);
      div1.innerHTML = infoIcon;
      current2 = true;
    },
    p(ctx2, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current2 || dirty & /*$$scope*/
        1)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx2,
            /*$$scope*/
            ctx2[0],
            !current2 ? get_all_dirty_from_scope(
              /*$$scope*/
              ctx2[0]
            ) : get_slot_changes(
              default_slot_template,
              /*$$scope*/
              ctx2[0],
              dirty,
              null
            ),
            null
          );
        }
      }
    },
    i(local) {
      if (current2)
        return;
      transition_in(default_slot, local);
      if (local) {
        if (!div2_intro) {
          add_render_callback(() => {
            div2_intro = create_in_transition(div2, slide, { delay: 50, duration: 500 });
            div2_intro.start();
          });
        }
      }
      current2 = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div2);
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function instance$b($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  $$self.$$set = ($$props2) => {
    if ("$$scope" in $$props2)
      $$invalidate(0, $$scope = $$props2.$$scope);
  };
  return [$$scope, slots];
}
class Warning extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(this, options2, instance$b, create_fragment$b, safe_not_equal, {}, add_css$b);
  }
}
function add_css$a(target) {
  append_styles(target, "svelte-1kfgpsl", ".container.svelte-1kfgpsl{padding:var(--onboard-spacing-4, var(--spacing-4));color:var(\n      --onboard-connect-accent-text-color,\n      var(--onboard-gray-700, var(--gray-700))\n    )}.connecting-container.svelte-1kfgpsl{padding:var(--onboard-spacing-4, var(--spacing-4));border-radius:var(--onboard-border-radius-1, var(--border-radius-1));background:var(--onboard-success-100, var(--success-100));border:1px solid var(--onboard-success-600, var(--success-600));width:100%}.text.svelte-1kfgpsl{right:var(--onboard-spacing-5, var(--spacing-5))}.tick.svelte-1kfgpsl{color:var(--onboard-success-700, var(--success-700))}");
}
function create_fragment$a(ctx) {
  let div7;
  let div6;
  let div4;
  let div2;
  let walletappbadge0;
  let t0;
  let div0;
  let successstatusicon;
  let t1;
  let div1;
  let walletappbadge1;
  let t2;
  let div3;
  let t3_value = (
    /*$_*/
    ctx[2]("connect.connectedWallet.mainText", {
      default: en.connect.connectedWallet.mainText,
      values: { wallet: (
        /*selectedWallet*/
        ctx[0].label
      ) }
    }) + ""
  );
  let t3;
  let t4;
  let div5;
  let current2;
  walletappbadge0 = new WalletAppBadge({
    props: {
      size: 40,
      padding: 8,
      background: (
        /*$appMetadata$*/
        ctx[1] && /*$appMetadata$*/
        ctx[1].icon ? "lightBlue" : "lightGray"
      ),
      border: "darkGreen",
      icon: (
        /*$appMetadata$*/
        ctx[1] && /*$appMetadata$*/
        ctx[1].icon || questionIcon
      )
    }
  });
  successstatusicon = new SuccessStatusIcon({ props: { size: 17 } });
  walletappbadge1 = new WalletAppBadge({
    props: {
      size: 40,
      padding: 8,
      border: "darkGreen",
      background: "white",
      icon: (
        /*selectedWallet*/
        ctx[0].icon
      )
    }
  });
  return {
    c() {
      div7 = element("div");
      div6 = element("div");
      div4 = element("div");
      div2 = element("div");
      create_component(walletappbadge0.$$.fragment);
      t0 = space();
      div0 = element("div");
      create_component(successstatusicon.$$.fragment);
      t1 = space();
      div1 = element("div");
      create_component(walletappbadge1.$$.fragment);
      t2 = space();
      div3 = element("div");
      t3 = text(t3_value);
      t4 = space();
      div5 = element("div");
      attr(div0, "class", "relative");
      set_style(div0, "right", "1rem");
      set_style(div0, "top", "4px");
      set_style(div0, "z-index", "1");
      attr(div1, "class", "relative");
      set_style(div1, "right", "1.75rem");
      attr(div2, "class", "flex justify-center items-end relative");
      attr(div3, "class", "text relative svelte-1kfgpsl");
      attr(div4, "class", "flex items-center");
      attr(div5, "class", "tick flex items-center svelte-1kfgpsl");
      set_style(div5, "width", "24px");
      attr(div6, "class", "connecting-container flex justify-between items-center svelte-1kfgpsl");
      attr(div7, "class", "container svelte-1kfgpsl");
    },
    m(target, anchor) {
      insert(target, div7, anchor);
      append(div7, div6);
      append(div6, div4);
      append(div4, div2);
      mount_component(walletappbadge0, div2, null);
      append(div2, t0);
      append(div2, div0);
      mount_component(successstatusicon, div0, null);
      append(div2, t1);
      append(div2, div1);
      mount_component(walletappbadge1, div1, null);
      append(div4, t2);
      append(div4, div3);
      append(div3, t3);
      append(div6, t4);
      append(div6, div5);
      div5.innerHTML = successIcon;
      current2 = true;
    },
    p(ctx2, [dirty]) {
      const walletappbadge0_changes = {};
      if (dirty & /*$appMetadata$*/
      2)
        walletappbadge0_changes.background = /*$appMetadata$*/
        ctx2[1] && /*$appMetadata$*/
        ctx2[1].icon ? "lightBlue" : "lightGray";
      if (dirty & /*$appMetadata$*/
      2)
        walletappbadge0_changes.icon = /*$appMetadata$*/
        ctx2[1] && /*$appMetadata$*/
        ctx2[1].icon || questionIcon;
      walletappbadge0.$set(walletappbadge0_changes);
      const walletappbadge1_changes = {};
      if (dirty & /*selectedWallet*/
      1)
        walletappbadge1_changes.icon = /*selectedWallet*/
        ctx2[0].icon;
      walletappbadge1.$set(walletappbadge1_changes);
      if ((!current2 || dirty & /*$_, selectedWallet*/
      5) && t3_value !== (t3_value = /*$_*/
      ctx2[2]("connect.connectedWallet.mainText", {
        default: en.connect.connectedWallet.mainText,
        values: { wallet: (
          /*selectedWallet*/
          ctx2[0].label
        ) }
      }) + ""))
        set_data(t3, t3_value);
    },
    i(local) {
      if (current2)
        return;
      transition_in(walletappbadge0.$$.fragment, local);
      transition_in(successstatusicon.$$.fragment, local);
      transition_in(walletappbadge1.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(walletappbadge0.$$.fragment, local);
      transition_out(successstatusicon.$$.fragment, local);
      transition_out(walletappbadge1.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div7);
      destroy_component(walletappbadge0);
      destroy_component(successstatusicon);
      destroy_component(walletappbadge1);
    }
  };
}
function instance$a($$self, $$props, $$invalidate) {
  let $appMetadata$;
  let $_;
  component_subscribe($$self, $format, ($$value) => $$invalidate(2, $_ = $$value));
  let { selectedWallet } = $$props;
  const appMetadata$ = state$1.select("appMetadata").pipe(startWith$2(state$1.get().appMetadata), shareReplay$2(1));
  component_subscribe($$self, appMetadata$, (value) => $$invalidate(1, $appMetadata$ = value));
  $$self.$$set = ($$props2) => {
    if ("selectedWallet" in $$props2)
      $$invalidate(0, selectedWallet = $$props2.selectedWallet);
  };
  return [selectedWallet, $appMetadata$, $_, appMetadata$];
}
class ConnectedWallet extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(this, options2, instance$a, create_fragment$a, safe_not_equal, { selectedWallet: 0 }, add_css$a);
  }
}
function add_css$9(target) {
  append_styles(target, "svelte-j1ywa3", ".container.svelte-j1ywa3{padding:var(--onboard-spacing-4, var(--spacing-4))}.connecting-container.svelte-j1ywa3{width:100%;padding:var(--onboard-spacing-4, var(--spacing-4));transition:background-color 100ms ease-in-out,\n      border-color 100ms ease-in-out;border-radius:24px;background:var(--onboard-primary-100, var(--primary-100));border:1px solid;border-color:var(--onboard-primary-300, var(--primary-300));color:var(--onboard-gray-600, var(--gray-600))}.connecting-container.warning.svelte-j1ywa3{background:var(--onboard-warning-100, var(--warning-100));border-color:var(--onboard-warning-400, var(--warning-400))}.text.svelte-j1ywa3{line-height:16px;margin-bottom:var(--onboard-spacing-5, var(--spacing-5))}.text.text-rejected.svelte-j1ywa3{line-height:24px;margin-bottom:0}.subtext.svelte-j1ywa3{font-size:var(--onboard-font-size-7, var(--font-size-7));line-height:16px}.rejected-cta.svelte-j1ywa3{color:var(--onboard-primary-500, var(--primary-500))}.onboard-button-primary.svelte-j1ywa3{bottom:var(--onboard-spacing-3, var(--spacing-3))}.ml.svelte-j1ywa3{margin-left:var(--onboard-spacing-4, var(--spacing-4))}@media all and (max-width: 520px){.connecting-container.svelte-j1ywa3{border-radius:var(--onboard-border-radius-4, var(--border-radius-4))}.container.svelte-j1ywa3{padding-bottom:0}.wallet-badges.svelte-j1ywa3{display:none}.connecting-wallet-info.svelte-j1ywa3{margin:0}.onboard-button-primary.svelte-j1ywa3{display:none}}");
}
function create_else_block$3(ctx) {
  let div;
  let t_value = (
    /*$_*/
    ctx[7](
      `connect.connectingWallet.${/*previousConnectionRequest*/
      ctx[5] ? "previousConnection" : "paragraph"}`,
      {
        default: en.connect.connectingWallet.paragraph,
        values: { wallet: (
          /*selectedWallet*/
          ctx[1].label
        ) }
      }
    ) + ""
  );
  let t;
  return {
    c() {
      div = element("div");
      t = text(t_value);
      attr(div, "class", "subtext svelte-j1ywa3");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
    },
    p(ctx2, dirty) {
      if (dirty & /*$_, previousConnectionRequest, selectedWallet*/
      162 && t_value !== (t_value = /*$_*/
      ctx2[7](
        `connect.connectingWallet.${/*previousConnectionRequest*/
        ctx2[5] ? "previousConnection" : "paragraph"}`,
        {
          default: en.connect.connectingWallet.paragraph,
          values: { wallet: (
            /*selectedWallet*/
            ctx2[1].label
          ) }
        }
      ) + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_if_block$7(ctx) {
  let div;
  let t_value = (
    /*$_*/
    ctx[7]("connect.connectingWallet.rejectedCTA", {
      default: en.connect.connectingWallet.rejectedCTA,
      values: { wallet: (
        /*selectedWallet*/
        ctx[1].label
      ) }
    }) + ""
  );
  let t;
  let mounted;
  let dispose;
  return {
    c() {
      div = element("div");
      t = text(t_value);
      attr(div, "class", "rejected-cta pointer subtext svelte-j1ywa3");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
      if (!mounted) {
        dispose = listen(div, "click", function() {
          if (is_function(
            /*connectWallet*/
            ctx[0]
          ))
            ctx[0].apply(this, arguments);
        });
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty & /*$_, selectedWallet*/
      130 && t_value !== (t_value = /*$_*/
      ctx[7]("connect.connectingWallet.rejectedCTA", {
        default: en.connect.connectingWallet.rejectedCTA,
        values: { wallet: (
          /*selectedWallet*/
          ctx[1].label
        ) }
      }) + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching)
        detach(div);
      mounted = false;
      dispose();
    }
  };
}
function create_fragment$9(ctx) {
  let div6;
  let div5;
  let div4;
  let div1;
  let walletappbadge0;
  let t0;
  let div0;
  let walletappbadge1;
  let t1;
  let div3;
  let div2;
  let t2_value = (
    /*$_*/
    ctx[7](
      `connect.connectingWallet.${/*connectionRejected*/
      ctx[4] ? "rejectedText" : "mainText"}`,
      {
        default: (
          /*connectionRejected*/
          ctx[4] ? en.connect.connectingWallet.rejectedText : en.connect.connectingWallet.mainText
        ),
        values: { wallet: (
          /*selectedWallet*/
          ctx[1].label
        ) }
      }
    ) + ""
  );
  let t2;
  let t3;
  let t4;
  let button;
  let t5_value = (
    /*$_*/
    ctx[7]("connect.connectingWallet.primaryButton", {
      default: en.connect.connectingWallet.primaryButton
    }) + ""
  );
  let t5;
  let current2;
  let mounted;
  let dispose;
  walletappbadge0 = new WalletAppBadge({
    props: {
      size: 40,
      padding: 8,
      icon: (
        /*$appMetadata$*/
        ctx[6] && /*$appMetadata$*/
        ctx[6].icon || questionIcon
      ),
      border: (
        /*connectionRejected*/
        ctx[4] || /*previousConnectionRequest*/
        ctx[5] ? "yellow" : "blue"
      ),
      background: "lightGray"
    }
  });
  walletappbadge1 = new WalletAppBadge({
    props: {
      size: 40,
      padding: 8,
      border: (
        /*connectionRejected*/
        ctx[4] || /*previousConnectionRequest*/
        ctx[5] ? "yellow" : "blue"
      ),
      background: "white",
      icon: (
        /*selectedWallet*/
        ctx[1].icon
      )
    }
  });
  function select_block_type(ctx2, dirty) {
    if (
      /*connectionRejected*/
      ctx2[4]
    )
      return create_if_block$7;
    return create_else_block$3;
  }
  let current_block_type = select_block_type(ctx);
  let if_block = current_block_type(ctx);
  return {
    c() {
      div6 = element("div");
      div5 = element("div");
      div4 = element("div");
      div1 = element("div");
      create_component(walletappbadge0.$$.fragment);
      t0 = space();
      div0 = element("div");
      create_component(walletappbadge1.$$.fragment);
      t1 = space();
      div3 = element("div");
      div2 = element("div");
      t2 = text(t2_value);
      t3 = space();
      if_block.c();
      t4 = space();
      button = element("button");
      t5 = text(t5_value);
      attr(div0, "class", "relative");
      set_style(div0, "right", "0.5rem");
      attr(div1, "class", "flex justify-center relative wallet-badges svelte-j1ywa3");
      attr(div2, "class", "text svelte-j1ywa3");
      toggle_class(
        div2,
        "text-rejected",
        /*connectionRejected*/
        ctx[4]
      );
      attr(div3, "class", "flex flex-column justify-center ml connecting-wallet-info svelte-j1ywa3");
      attr(div4, "class", "flex");
      attr(div5, "class", "connecting-container flex justify-between items-center svelte-j1ywa3");
      toggle_class(
        div5,
        "warning",
        /*connectionRejected*/
        ctx[4] || /*previousConnectionRequest*/
        ctx[5]
      );
      attr(button, "class", "onboard-button-primary absolute svelte-j1ywa3");
      attr(div6, "class", "container flex flex-column items-center svelte-j1ywa3");
    },
    m(target, anchor) {
      insert(target, div6, anchor);
      append(div6, div5);
      append(div5, div4);
      append(div4, div1);
      mount_component(walletappbadge0, div1, null);
      append(div1, t0);
      append(div1, div0);
      mount_component(walletappbadge1, div0, null);
      append(div4, t1);
      append(div4, div3);
      append(div3, div2);
      append(div2, t2);
      append(div3, t3);
      if_block.m(div3, null);
      append(div6, t4);
      append(div6, button);
      append(button, t5);
      current2 = true;
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*click_handler*/
          ctx[9]
        );
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      const walletappbadge0_changes = {};
      if (dirty & /*$appMetadata$*/
      64)
        walletappbadge0_changes.icon = /*$appMetadata$*/
        ctx2[6] && /*$appMetadata$*/
        ctx2[6].icon || questionIcon;
      if (dirty & /*connectionRejected, previousConnectionRequest*/
      48)
        walletappbadge0_changes.border = /*connectionRejected*/
        ctx2[4] || /*previousConnectionRequest*/
        ctx2[5] ? "yellow" : "blue";
      walletappbadge0.$set(walletappbadge0_changes);
      const walletappbadge1_changes = {};
      if (dirty & /*connectionRejected, previousConnectionRequest*/
      48)
        walletappbadge1_changes.border = /*connectionRejected*/
        ctx2[4] || /*previousConnectionRequest*/
        ctx2[5] ? "yellow" : "blue";
      if (dirty & /*selectedWallet*/
      2)
        walletappbadge1_changes.icon = /*selectedWallet*/
        ctx2[1].icon;
      walletappbadge1.$set(walletappbadge1_changes);
      if ((!current2 || dirty & /*$_, connectionRejected, selectedWallet*/
      146) && t2_value !== (t2_value = /*$_*/
      ctx2[7](
        `connect.connectingWallet.${/*connectionRejected*/
        ctx2[4] ? "rejectedText" : "mainText"}`,
        {
          default: (
            /*connectionRejected*/
            ctx2[4] ? en.connect.connectingWallet.rejectedText : en.connect.connectingWallet.mainText
          ),
          values: { wallet: (
            /*selectedWallet*/
            ctx2[1].label
          ) }
        }
      ) + ""))
        set_data(t2, t2_value);
      if (!current2 || dirty & /*connectionRejected*/
      16) {
        toggle_class(
          div2,
          "text-rejected",
          /*connectionRejected*/
          ctx2[4]
        );
      }
      if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(div3, null);
        }
      }
      if (!current2 || dirty & /*connectionRejected, previousConnectionRequest*/
      48) {
        toggle_class(
          div5,
          "warning",
          /*connectionRejected*/
          ctx2[4] || /*previousConnectionRequest*/
          ctx2[5]
        );
      }
      if ((!current2 || dirty & /*$_*/
      128) && t5_value !== (t5_value = /*$_*/
      ctx2[7]("connect.connectingWallet.primaryButton", {
        default: en.connect.connectingWallet.primaryButton
      }) + ""))
        set_data(t5, t5_value);
    },
    i(local) {
      if (current2)
        return;
      transition_in(walletappbadge0.$$.fragment, local);
      transition_in(walletappbadge1.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(walletappbadge0.$$.fragment, local);
      transition_out(walletappbadge1.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div6);
      destroy_component(walletappbadge0);
      destroy_component(walletappbadge1);
      if_block.d();
      mounted = false;
      dispose();
    }
  };
}
function instance$9($$self, $$props, $$invalidate) {
  let $appMetadata$;
  let $_;
  component_subscribe($$self, $format, ($$value) => $$invalidate(7, $_ = $$value));
  let { connectWallet } = $$props;
  let { selectedWallet } = $$props;
  let { deselectWallet } = $$props;
  let { setStep } = $$props;
  let { connectionRejected } = $$props;
  let { previousConnectionRequest } = $$props;
  const appMetadata$ = state$1.select("appMetadata").pipe(startWith$2(state$1.get().appMetadata), shareReplay$2(1));
  component_subscribe($$self, appMetadata$, (value) => $$invalidate(6, $appMetadata$ = value));
  const click_handler = () => {
    deselectWallet(selectedWallet.label);
    setStep("selectingWallet");
  };
  $$self.$$set = ($$props2) => {
    if ("connectWallet" in $$props2)
      $$invalidate(0, connectWallet = $$props2.connectWallet);
    if ("selectedWallet" in $$props2)
      $$invalidate(1, selectedWallet = $$props2.selectedWallet);
    if ("deselectWallet" in $$props2)
      $$invalidate(2, deselectWallet = $$props2.deselectWallet);
    if ("setStep" in $$props2)
      $$invalidate(3, setStep = $$props2.setStep);
    if ("connectionRejected" in $$props2)
      $$invalidate(4, connectionRejected = $$props2.connectionRejected);
    if ("previousConnectionRequest" in $$props2)
      $$invalidate(5, previousConnectionRequest = $$props2.previousConnectionRequest);
  };
  return [
    connectWallet,
    selectedWallet,
    deselectWallet,
    setStep,
    connectionRejected,
    previousConnectionRequest,
    $appMetadata$,
    $_,
    appMetadata$,
    click_handler
  ];
}
class ConnectingWallet extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(
      this,
      options2,
      instance$9,
      create_fragment$9,
      safe_not_equal,
      {
        connectWallet: 0,
        selectedWallet: 1,
        deselectWallet: 2,
        setStep: 3,
        connectionRejected: 4,
        previousConnectionRequest: 5
      },
      add_css$9
    );
  }
}
function add_css$8(target) {
  append_styles(target, "svelte-1uy2ffh", ".outer-container.svelte-1uy2ffh{padding:var(--onboard-spacing-4, var(--spacing-4))}.link.svelte-1uy2ffh{font-size:var(--onboard-font-size-7, var(--font-size-7));line-height:16px;color:var(--onboard-primary-500, var(--primary-500));text-decoration:none}");
}
function get_each_context$1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[3] = list[i].name;
  child_ctx[4] = list[i].url;
  child_ctx[6] = i;
  return child_ctx;
}
function create_else_block$2(ctx) {
  let t_value = (
    /*$_*/
    ctx[1]("connect.selectingWallet.installWallet", {
      default: en.connect.selectingWallet.installWallet,
      values: {
        app: (
          /*$appMetadata$*/
          ctx[0].name || "this app"
        )
      }
    }) + ""
  );
  let t;
  return {
    c() {
      t = text(t_value);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & /*$_, $appMetadata$*/
      3 && t_value !== (t_value = /*$_*/
      ctx2[1]("connect.selectingWallet.installWallet", {
        default: en.connect.selectingWallet.installWallet,
        values: {
          app: (
            /*$appMetadata$*/
            ctx2[0].name || "this app"
          )
        }
      }) + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching)
        detach(t);
    }
  };
}
function create_if_block$6(ctx) {
  let t0_value = (
    /*$_*/
    ctx[1]("connect.selectingWallet.recommendedWalletsPart1", {
      default: en.connect.selectingWallet.recommendedWalletsPart1,
      values: {
        app: (
          /*$appMetadata$*/
          ctx[0].name || "This app"
        )
      }
    }) + ""
  );
  let t0;
  let t1;
  let t2;
  let t3_value = (
    /*$_*/
    ctx[1]("connect.selectingWallet.recommendedWalletsPart2", {
      default: en.connect.selectingWallet.recommendedWalletsPart2
    }) + ""
  );
  let t3;
  let each_value = (
    /*$appMetadata$*/
    ctx[0].recommendedInjectedWallets
  );
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
  }
  return {
    c() {
      t0 = text(t0_value);
      t1 = space();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t2 = space();
      t3 = text(t3_value);
    },
    m(target, anchor) {
      insert(target, t0, anchor);
      insert(target, t1, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(target, anchor);
        }
      }
      insert(target, t2, anchor);
      insert(target, t3, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & /*$_, $appMetadata$*/
      3 && t0_value !== (t0_value = /*$_*/
      ctx2[1]("connect.selectingWallet.recommendedWalletsPart1", {
        default: en.connect.selectingWallet.recommendedWalletsPart1,
        values: {
          app: (
            /*$appMetadata$*/
            ctx2[0].name || "This app"
          )
        }
      }) + ""))
        set_data(t0, t0_value);
      if (dirty & /*$appMetadata$*/
      1) {
        each_value = /*$appMetadata$*/
        ctx2[0].recommendedInjectedWallets;
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$1(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block$1(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(t2.parentNode, t2);
          }
        }
        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }
        each_blocks.length = each_value.length;
      }
      if (dirty & /*$_*/
      2 && t3_value !== (t3_value = /*$_*/
      ctx2[1]("connect.selectingWallet.recommendedWalletsPart2", {
        default: en.connect.selectingWallet.recommendedWalletsPart2
      }) + ""))
        set_data(t3, t3_value);
    },
    d(detaching) {
      if (detaching)
        detach(t0);
      if (detaching)
        detach(t1);
      destroy_each(each_blocks, detaching);
      if (detaching)
        detach(t2);
      if (detaching)
        detach(t3);
    }
  };
}
function create_each_block$1(ctx) {
  let a;
  let t0_value = (
    /*name*/
    ctx[3] + ""
  );
  let t0;
  let t1_value = (
    /*i*/
    ctx[6] < /*$appMetadata$*/
    ctx[0].recommendedInjectedWallets.length - 1 ? ", " : ""
  );
  let t1;
  let a_href_value;
  return {
    c() {
      a = element("a");
      t0 = text(t0_value);
      t1 = text(t1_value);
      attr(a, "class", "link pointer svelte-1uy2ffh");
      attr(a, "href", a_href_value = /*url*/
      ctx[4]);
      attr(a, "target", "_blank");
      attr(a, "rel", "noreferrer noopener");
    },
    m(target, anchor) {
      insert(target, a, anchor);
      append(a, t0);
      append(a, t1);
    },
    p(ctx2, dirty) {
      if (dirty & /*$appMetadata$*/
      1 && t0_value !== (t0_value = /*name*/
      ctx2[3] + ""))
        set_data(t0, t0_value);
      if (dirty & /*$appMetadata$*/
      1 && t1_value !== (t1_value = /*i*/
      ctx2[6] < /*$appMetadata$*/
      ctx2[0].recommendedInjectedWallets.length - 1 ? ", " : ""))
        set_data(t1, t1_value);
      if (dirty & /*$appMetadata$*/
      1 && a_href_value !== (a_href_value = /*url*/
      ctx2[4])) {
        attr(a, "href", a_href_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(a);
    }
  };
}
function create_default_slot$4(ctx) {
  let if_block_anchor;
  function select_block_type(ctx2, dirty) {
    if (
      /*$appMetadata$*/
      ctx2[0].recommendedInjectedWallets
    )
      return create_if_block$6;
    return create_else_block$2;
  }
  let current_block_type = select_block_type(ctx);
  let if_block = current_block_type(ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      }
    },
    d(detaching) {
      if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function create_fragment$8(ctx) {
  let div;
  let warning;
  let current2;
  warning = new Warning({
    props: {
      $$slots: { default: [create_default_slot$4] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      div = element("div");
      create_component(warning.$$.fragment);
      attr(div, "class", "outer-container svelte-1uy2ffh");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(warning, div, null);
      current2 = true;
    },
    p(ctx2, [dirty]) {
      const warning_changes = {};
      if (dirty & /*$$scope, $_, $appMetadata$*/
      131) {
        warning_changes.$$scope = { dirty, ctx: ctx2 };
      }
      warning.$set(warning_changes);
    },
    i(local) {
      if (current2)
        return;
      transition_in(warning.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(warning.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_component(warning);
    }
  };
}
function instance$8($$self, $$props, $$invalidate) {
  let $appMetadata$;
  let $_;
  component_subscribe($$self, $format, ($$value) => $$invalidate(1, $_ = $$value));
  const appMetadata$ = state$1.select("appMetadata").pipe(startWith$2(state$1.get().appMetadata), shareReplay$2(1));
  component_subscribe($$self, appMetadata$, (value) => $$invalidate(0, $appMetadata$ = value));
  return [$appMetadata$, $_, appMetadata$];
}
class InstallWallet extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(this, options2, instance$8, create_fragment$8, safe_not_equal, {}, add_css$8);
  }
}
function add_css$7(target) {
  append_styles(target, "svelte-1vlog3j", "button.svelte-1vlog3j:disabled{opacity:0.5}button.wallet-button-styling.svelte-1vlog3j{position:relative;align-items:flex-start;flex:1;padding:0;background:none;color:var(--onboard-wallet-button-color, inherit)}.wallet-button-container.svelte-1vlog3j{display:flex}.wallet-button-container-inner.svelte-1vlog3j{position:relative;display:flex;flex-flow:column;align-items:center;gap:0.5rem;padding:0.75rem;width:5rem}.name.svelte-1vlog3j{font-size:var(--onboard-font-size-7, var(--font-size-7));line-height:1rem;text-overflow:ellipsis;max-width:5rem;max-height:2rem;overflow:hidden}.status-icon.svelte-1vlog3j{position:absolute;top:3.5rem;left:3.5rem}@media screen and (min-width: 768px){button.wallet-button-styling.svelte-1vlog3j{transition:background-color 250ms ease-in-out;background:var(--onboard-wallet-button-background, none);border:1px solid transparent;border-color:var(--onboard-wallet-button-border-color, var(--border-color));border-radius:var(--onboard-wallet-button-border-radius, var(--border-radius-1))}button.wallet-button-styling.svelte-1vlog3j:hover{background:var(--onboard-wallet-button-background-hover, var(--foreground-color));color:var(--onboard-wallet-button-color-hover)}.wallet-button-container-inner.svelte-1vlog3j{flex:1;flex-flow:row nowrap;gap:1rem;padding:1rem}button.connected.svelte-1vlog3j{border-color:var(--onboard-success-500, var(--success-500))}.name.svelte-1vlog3j{font-size:1rem;line-height:1.25rem;text-align:initial;max-width:inherit;max-height:3rem}.status-icon.svelte-1vlog3j{top:0;bottom:0;left:auto;right:1rem;margin:auto;height:20px}}");
}
function create_if_block$5(ctx) {
  let div;
  let successstatusicon;
  let current2;
  successstatusicon = new SuccessStatusIcon({ props: { size: 20 } });
  return {
    c() {
      div = element("div");
      create_component(successstatusicon.$$.fragment);
      attr(div, "class", "status-icon svelte-1vlog3j");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(successstatusicon, div, null);
      current2 = true;
    },
    i(local) {
      if (current2)
        return;
      transition_in(successstatusicon.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(successstatusicon.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_component(successstatusicon);
    }
  };
}
function create_fragment$7(ctx) {
  let div2;
  let button;
  let div1;
  let walletappbadge;
  let t0;
  let div0;
  let t1;
  let t2;
  let button_intro;
  let current2;
  let mounted;
  let dispose;
  add_render_callback(
    /*onwindowresize*/
    ctx[7]
  );
  walletappbadge = new WalletAppBadge({
    props: {
      size: (
        /*windowWidth*/
        ctx[6] >= MOBILE_WINDOW_WIDTH ? 48 : 56
      ),
      icon: (
        /*icon*/
        ctx[0]
      ),
      loading: (
        /*connecting*/
        ctx[4]
      ),
      border: (
        /*connected*/
        ctx[3] ? "green" : "custom"
      ),
      background: "transparent"
    }
  });
  let if_block = (
    /*connected*/
    ctx[3] && create_if_block$5()
  );
  return {
    c() {
      div2 = element("div");
      button = element("button");
      div1 = element("div");
      create_component(walletappbadge.$$.fragment);
      t0 = space();
      div0 = element("div");
      t1 = text(
        /*label*/
        ctx[1]
      );
      t2 = space();
      if (if_block)
        if_block.c();
      attr(div0, "class", "name svelte-1vlog3j");
      attr(div1, "class", "wallet-button-container-inner svelte-1vlog3j");
      attr(button, "class", "wallet-button-styling svelte-1vlog3j");
      button.disabled = /*disabled*/
      ctx[5];
      toggle_class(
        button,
        "connected",
        /*connected*/
        ctx[3]
      );
      attr(div2, "class", "wallet-button-container svelte-1vlog3j");
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      append(div2, button);
      append(button, div1);
      mount_component(walletappbadge, div1, null);
      append(div1, t0);
      append(div1, div0);
      append(div0, t1);
      append(div1, t2);
      if (if_block)
        if_block.m(div1, null);
      current2 = true;
      if (!mounted) {
        dispose = [
          listen(
            window,
            "resize",
            /*onwindowresize*/
            ctx[7]
          ),
          listen(button, "click", function() {
            if (is_function(
              /*onClick*/
              ctx[2]
            ))
              ctx[2].apply(this, arguments);
          })
        ];
        mounted = true;
      }
    },
    p(new_ctx, [dirty]) {
      ctx = new_ctx;
      const walletappbadge_changes = {};
      if (dirty & /*windowWidth*/
      64)
        walletappbadge_changes.size = /*windowWidth*/
        ctx[6] >= MOBILE_WINDOW_WIDTH ? 48 : 56;
      if (dirty & /*icon*/
      1)
        walletappbadge_changes.icon = /*icon*/
        ctx[0];
      if (dirty & /*connecting*/
      16)
        walletappbadge_changes.loading = /*connecting*/
        ctx[4];
      if (dirty & /*connected*/
      8)
        walletappbadge_changes.border = /*connected*/
        ctx[3] ? "green" : "custom";
      walletappbadge.$set(walletappbadge_changes);
      if (!current2 || dirty & /*label*/
      2)
        set_data(
          t1,
          /*label*/
          ctx[1]
        );
      if (
        /*connected*/
        ctx[3]
      ) {
        if (if_block) {
          if (dirty & /*connected*/
          8) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$5();
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(div1, null);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
      if (!current2 || dirty & /*disabled*/
      32) {
        button.disabled = /*disabled*/
        ctx[5];
      }
      if (!current2 || dirty & /*connected*/
      8) {
        toggle_class(
          button,
          "connected",
          /*connected*/
          ctx[3]
        );
      }
    },
    i(local) {
      if (current2)
        return;
      transition_in(walletappbadge.$$.fragment, local);
      transition_in(if_block);
      if (local) {
        if (!button_intro) {
          add_render_callback(() => {
            button_intro = create_in_transition(button, fade, {});
            button_intro.start();
          });
        }
      }
      current2 = true;
    },
    o(local) {
      transition_out(walletappbadge.$$.fragment, local);
      transition_out(if_block);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div2);
      destroy_component(walletappbadge);
      if (if_block)
        if_block.d();
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance$7($$self, $$props, $$invalidate) {
  let { icon } = $$props;
  let { label } = $$props;
  let { onClick } = $$props;
  let { connected } = $$props;
  let { connecting } = $$props;
  let { disabled } = $$props;
  let windowWidth;
  function onwindowresize() {
    $$invalidate(6, windowWidth = window.innerWidth);
  }
  $$self.$$set = ($$props2) => {
    if ("icon" in $$props2)
      $$invalidate(0, icon = $$props2.icon);
    if ("label" in $$props2)
      $$invalidate(1, label = $$props2.label);
    if ("onClick" in $$props2)
      $$invalidate(2, onClick = $$props2.onClick);
    if ("connected" in $$props2)
      $$invalidate(3, connected = $$props2.connected);
    if ("connecting" in $$props2)
      $$invalidate(4, connecting = $$props2.connecting);
    if ("disabled" in $$props2)
      $$invalidate(5, disabled = $$props2.disabled);
  };
  return [
    icon,
    label,
    onClick,
    connected,
    connecting,
    disabled,
    windowWidth,
    onwindowresize
  ];
}
class WalletButton extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(
      this,
      options2,
      instance$7,
      create_fragment$7,
      safe_not_equal,
      {
        icon: 0,
        label: 1,
        onClick: 2,
        connected: 3,
        connecting: 4,
        disabled: 5
      },
      add_css$7
    );
  }
}
function add_css$6(target) {
  append_styles(target, "svelte-kpc6js", ".wallets-container.svelte-kpc6js{display:flex;gap:0.5rem;overflow-x:scroll;overflow-y:hidden;padding:0.75rem 0.5rem;border-bottom:1px solid var(--border-color);-ms-overflow-style:none;scrollbar-width:none}.wallets-container.svelte-kpc6js::-webkit-scrollbar{display:none}.warning-container.svelte-kpc6js{margin:1rem 1rem 0}.notice-container.svelte-kpc6js{flex:0 0 100%;margin-top:0.75rem}@media all and (min-width: 768px){.wallets-container.svelte-kpc6js{display:grid;grid-template-columns:repeat(var(--onboard-wallet-columns, 2), 1fr);padding:1rem;border:none}.notice-container.svelte-kpc6js{grid-column:span 2;margin:0}}");
}
function get_each_context(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[10] = list[i];
  return child_ctx;
}
function create_if_block_1$3(ctx) {
  let div;
  let warning;
  let current2;
  warning = new Warning({
    props: {
      $$slots: { default: [create_default_slot_1] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      div = element("div");
      create_component(warning.$$.fragment);
      attr(div, "class", "warning-container svelte-kpc6js");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(warning, div, null);
      current2 = true;
    },
    p(ctx2, dirty) {
      const warning_changes = {};
      if (dirty & /*$$scope, connectingErrorMessage*/
      8200) {
        warning_changes.$$scope = { dirty, ctx: ctx2 };
      }
      warning.$set(warning_changes);
    },
    i(local) {
      if (current2)
        return;
      transition_in(warning.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(warning.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_component(warning);
    }
  };
}
function create_default_slot_1(ctx) {
  let html_tag;
  let html_anchor;
  return {
    c() {
      html_tag = new HtmlTag(false);
      html_anchor = empty();
      html_tag.a = html_anchor;
    },
    m(target, anchor) {
      html_tag.m(
        /*connectingErrorMessage*/
        ctx[3],
        target,
        anchor
      );
      insert(target, html_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & /*connectingErrorMessage*/
      8)
        html_tag.p(
          /*connectingErrorMessage*/
          ctx2[3]
        );
    },
    d(detaching) {
      if (detaching)
        detach(html_anchor);
      if (detaching)
        html_tag.d();
    }
  };
}
function create_each_block(ctx) {
  let walletbutton;
  let current2;
  function func() {
    return (
      /*func*/
      ctx[9](
        /*wallet*/
        ctx[10]
      )
    );
  }
  walletbutton = new WalletButton({
    props: {
      connected: (
        /*checkConnected*/
        ctx[7](
          /*wallet*/
          ctx[10].label
        )
      ),
      connecting: (
        /*connectingWalletLabel*/
        ctx[2] === /*wallet*/
        ctx[10].label
      ),
      label: (
        /*wallet*/
        ctx[10].label
      ),
      icon: (
        /*wallet*/
        ctx[10].icon
      ),
      onClick: func,
      disabled: (
        /*windowWidth*/
        ctx[4] <= MOBILE_WINDOW_WIDTH && /*connectingWalletLabel*/
        ctx[2] && /*connectingWalletLabel*/
        ctx[2] !== /*wallet*/
        ctx[10].label
      )
    }
  });
  return {
    c() {
      create_component(walletbutton.$$.fragment);
    },
    m(target, anchor) {
      mount_component(walletbutton, target, anchor);
      current2 = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const walletbutton_changes = {};
      if (dirty & /*wallets*/
      1)
        walletbutton_changes.connected = /*checkConnected*/
        ctx[7](
          /*wallet*/
          ctx[10].label
        );
      if (dirty & /*connectingWalletLabel, wallets*/
      5)
        walletbutton_changes.connecting = /*connectingWalletLabel*/
        ctx[2] === /*wallet*/
        ctx[10].label;
      if (dirty & /*wallets*/
      1)
        walletbutton_changes.label = /*wallet*/
        ctx[10].label;
      if (dirty & /*wallets*/
      1)
        walletbutton_changes.icon = /*wallet*/
        ctx[10].icon;
      if (dirty & /*selectWallet, wallets*/
      3)
        walletbutton_changes.onClick = func;
      if (dirty & /*windowWidth, connectingWalletLabel, wallets*/
      21)
        walletbutton_changes.disabled = /*windowWidth*/
        ctx[4] <= MOBILE_WINDOW_WIDTH && /*connectingWalletLabel*/
        ctx[2] && /*connectingWalletLabel*/
        ctx[2] !== /*wallet*/
        ctx[10].label;
      walletbutton.$set(walletbutton_changes);
    },
    i(local) {
      if (current2)
        return;
      transition_in(walletbutton.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(walletbutton.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      destroy_component(walletbutton, detaching);
    }
  };
}
function create_if_block$4(ctx) {
  let div;
  let warning;
  let current2;
  warning = new Warning({
    props: {
      $$slots: { default: [create_default_slot$3] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      div = element("div");
      create_component(warning.$$.fragment);
      attr(div, "class", "notice-container svelte-kpc6js");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(warning, div, null);
      current2 = true;
    },
    p(ctx2, dirty) {
      const warning_changes = {};
      if (dirty & /*$$scope, $_*/
      8224) {
        warning_changes.$$scope = { dirty, ctx: ctx2 };
      }
      warning.$set(warning_changes);
    },
    i(local) {
      if (current2)
        return;
      transition_in(warning.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(warning.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_component(warning);
    }
  };
}
function create_default_slot$3(ctx) {
  let div;
  let t0_value = (
    /*$_*/
    ctx[5]("connect.selectingWallet.whyDontISeeMyWallet", {
      default: en.connect.selectingWallet.whyDontISeeMyWallet
    }) + ""
  );
  let t0;
  let t1;
  let a;
  let t2_value = (
    /*$_*/
    ctx[5]("connect.selectingWallet.learnMore", {
      default: en.connect.selectingWallet.learnMore
    }) + ""
  );
  let t2;
  return {
    c() {
      div = element("div");
      t0 = text(t0_value);
      t1 = space();
      a = element("a");
      t2 = text(t2_value);
      attr(a, "class", "link pointer");
      attr(
        a,
        "href",
        /*connect*/
        ctx[6].wheresMyWalletLink || wheresMyWalletDefault
      );
      attr(a, "target", "_blank");
      attr(a, "rel", "noreferrer noopener");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t0);
      insert(target, t1, anchor);
      insert(target, a, anchor);
      append(a, t2);
    },
    p(ctx2, dirty) {
      if (dirty & /*$_*/
      32 && t0_value !== (t0_value = /*$_*/
      ctx2[5]("connect.selectingWallet.whyDontISeeMyWallet", {
        default: en.connect.selectingWallet.whyDontISeeMyWallet
      }) + ""))
        set_data(t0, t0_value);
      if (dirty & /*$_*/
      32 && t2_value !== (t2_value = /*$_*/
      ctx2[5]("connect.selectingWallet.learnMore", {
        default: en.connect.selectingWallet.learnMore
      }) + ""))
        set_data(t2, t2_value);
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (detaching)
        detach(t1);
      if (detaching)
        detach(a);
    }
  };
}
function create_fragment$6(ctx) {
  let div1;
  let t0;
  let div0;
  let t1;
  let current2;
  let mounted;
  let dispose;
  add_render_callback(
    /*onwindowresize*/
    ctx[8]
  );
  let if_block0 = (
    /*connectingErrorMessage*/
    ctx[3] && create_if_block_1$3(ctx)
  );
  let each_value = (
    /*wallets*/
    ctx[0]
  );
  let each_blocks = [];
  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  }
  const out = (i) => transition_out(each_blocks[i], 1, 1, () => {
    each_blocks[i] = null;
  });
  let if_block1 = !/*connect*/
  ctx[6].removeWhereIsMyWalletWarning && create_if_block$4(ctx);
  return {
    c() {
      div1 = element("div");
      if (if_block0)
        if_block0.c();
      t0 = space();
      div0 = element("div");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t1 = space();
      if (if_block1)
        if_block1.c();
      attr(div0, "class", "wallets-container svelte-kpc6js");
      attr(div1, "class", "outer-container");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      if (if_block0)
        if_block0.m(div1, null);
      append(div1, t0);
      append(div1, div0);
      for (let i = 0; i < each_blocks.length; i += 1) {
        if (each_blocks[i]) {
          each_blocks[i].m(div0, null);
        }
      }
      append(div0, t1);
      if (if_block1)
        if_block1.m(div0, null);
      current2 = true;
      if (!mounted) {
        dispose = listen(
          window,
          "resize",
          /*onwindowresize*/
          ctx[8]
        );
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (
        /*connectingErrorMessage*/
        ctx2[3]
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
          if (dirty & /*connectingErrorMessage*/
          8) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_1$3(ctx2);
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(div1, t0);
        }
      } else if (if_block0) {
        group_outros();
        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });
        check_outros();
      }
      if (dirty & /*checkConnected, wallets, connectingWalletLabel, selectWallet, windowWidth, MOBILE_WINDOW_WIDTH*/
      151) {
        each_value = /*wallets*/
        ctx2[0];
        let i;
        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context(ctx2, each_value, i);
          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
            each_blocks[i] = create_each_block(child_ctx);
            each_blocks[i].c();
            transition_in(each_blocks[i], 1);
            each_blocks[i].m(div0, t1);
          }
        }
        group_outros();
        for (i = each_value.length; i < each_blocks.length; i += 1) {
          out(i);
        }
        check_outros();
      }
      if (!/*connect*/
      ctx2[6].removeWhereIsMyWalletWarning)
        if_block1.p(ctx2, dirty);
    },
    i(local) {
      if (current2)
        return;
      transition_in(if_block0);
      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }
      transition_in(if_block1);
      current2 = true;
    },
    o(local) {
      transition_out(if_block0);
      each_blocks = each_blocks.filter(Boolean);
      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }
      transition_out(if_block1);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div1);
      if (if_block0)
        if_block0.d();
      destroy_each(each_blocks, detaching);
      if (if_block1)
        if_block1.d();
      mounted = false;
      dispose();
    }
  };
}
const wheresMyWalletDefault = "https://www.blocknative.com/blog/metamask-wont-connect-web3-wallet-troubleshooting";
function instance$6($$self, $$props, $$invalidate) {
  let $_;
  component_subscribe($$self, $format, ($$value) => $$invalidate(5, $_ = $$value));
  let { wallets: wallets2 } = $$props;
  let { selectWallet } = $$props;
  let { connectingWalletLabel } = $$props;
  let { connectingErrorMessage } = $$props;
  let windowWidth;
  const { connect: connect2 } = state$1.get();
  function checkConnected(label) {
    const { wallets: wallets3 } = state$1.get();
    return !!wallets3.find((wallet2) => wallet2.label === label);
  }
  function onwindowresize() {
    $$invalidate(4, windowWidth = window.innerWidth);
  }
  const func = (wallet2) => selectWallet(wallet2);
  $$self.$$set = ($$props2) => {
    if ("wallets" in $$props2)
      $$invalidate(0, wallets2 = $$props2.wallets);
    if ("selectWallet" in $$props2)
      $$invalidate(1, selectWallet = $$props2.selectWallet);
    if ("connectingWalletLabel" in $$props2)
      $$invalidate(2, connectingWalletLabel = $$props2.connectingWalletLabel);
    if ("connectingErrorMessage" in $$props2)
      $$invalidate(3, connectingErrorMessage = $$props2.connectingErrorMessage);
  };
  return [
    wallets2,
    selectWallet,
    connectingWalletLabel,
    connectingErrorMessage,
    windowWidth,
    $_,
    connect2,
    checkConnected,
    onwindowresize,
    func
  ];
}
class SelectingWallet extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(
      this,
      options2,
      instance$6,
      create_fragment$6,
      safe_not_equal,
      {
        wallets: 0,
        selectWallet: 1,
        connectingWalletLabel: 2,
        connectingErrorMessage: 3
      },
      add_css$6
    );
  }
}
function add_css$5(target) {
  append_styles(target, "svelte-obaru3", ".sidebar.svelte-obaru3{--background-color:var(\n      --onboard-connect-sidebar-background,\n      var(--w3o-foreground-color, none)\n    );--text-color:var(--onboard-connect-sidebar-color, inherit);--border-color:var(--onboard-connect-sidebar-border-color, inherit);display:flex;flex-flow:column;gap:1rem;padding:1rem;align-items:center}.inner-container.svelte-obaru3{display:flex;flex-flow:column;align-items:center;align-self:stretch;gap:0.5rem;padding:1.5rem;text-align:center;border:1px solid transparent;border-radius:12px;border-color:var(--border-color);background:var(--background-color);color:var(--text-color)}.icon-container.svelte-obaru3{display:flex;height:3.5rem;width:auto;min-width:3.5rem;max-width:100%}.heading.svelte-obaru3{font-size:var(--onboard-font-size-3, var(--font-size-3));margin:0 0 var(--onboard-spacing-5, var(--spacing-5)) 0}.subheading.svelte-obaru3{line-height:1rem}.description.svelte-obaru3{line-height:1.25rem;font-size:var(--onboard-font-size-6, var(--font-size-6))}img.svelte-obaru3{max-width:100%;height:auto}.indicators.svelte-obaru3{margin-top:auto}.indicator.svelte-obaru3{box-sizing:content-box;width:8px;height:8px;border-radius:8px;background:var(\n      --onboard-connect-sidebar-progress-background,\n      var(--onboard-gray-700, var(--gray-700))\n    );transition:background 250ms ease-in-out}.indicator.on.svelte-obaru3{background:var(\n      --onboard-connect-sidebar-progress-color,\n      var(--action-color)\n    );border:2px solid\n      var(\n        --onboard-connect-sidebar-progress-background,\n        var(--onboard-gray-700, var(--gray-700))\n      )}.join.svelte-obaru3{box-sizing:content-box;z-index:1;right:4px;height:2px;background:var(\n      --onboard-connect-sidebar-progress-background,\n      var(--onboard-gray-700, var(--gray-700))\n    );transition:background 250ms ease-in-out}.join.active.svelte-obaru3{background:var(\n      --onboard-connect-sidebar-progress-color,\n      var(--action-color)\n    )}.no-link.svelte-obaru3{display:flex;flex-direction:row;align-items:center;padding:0.25rem 0.5rem 0.25rem 0.75rem;gap:0.25rem;font-size:var(--onboard-font-size-6, var(--font-size-6))}.info-icon.svelte-obaru3{width:1.25rem;display:flex;align-items:center}@media all and (min-width: 768px){.sidebar.svelte-obaru3{max-width:280px;border-right:1px solid;border-color:var(--border-color);background:var(--background-color)}.inner-container.svelte-obaru3{border:none;text-align:initial;flex:1;align-items:flex-start;gap:1rem}.indicators.svelte-obaru3{margin-bottom:0.25rem}}");
}
function create_if_block_3$2(ctx) {
  let div;
  let t;
  let show_if = (
    /*$_*/
    ctx[3](`connect.${/*step*/
    ctx[0]}.sidebar.header`, { default: "" })
  );
  let if_block1_anchor;
  function select_block_type(ctx2, dirty) {
    if (
      /*$appMetadata$*/
      ctx2[2] && /*$appMetadata$*/
      (ctx2[2].logo || /*$appMetadata$*/
      ctx2[2].icon)
    )
      return create_if_block_5$2;
    return create_else_block_1$1;
  }
  let current_block_type = select_block_type(ctx);
  let if_block0 = current_block_type(ctx);
  let if_block1 = show_if && create_if_block_4$2(ctx);
  return {
    c() {
      div = element("div");
      if_block0.c();
      t = space();
      if (if_block1)
        if_block1.c();
      if_block1_anchor = empty();
      attr(div, "class", "icon-container svelte-obaru3");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if_block0.m(div, null);
      insert(target, t, anchor);
      if (if_block1)
        if_block1.m(target, anchor);
      insert(target, if_block1_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block0) {
        if_block0.p(ctx2, dirty);
      } else {
        if_block0.d(1);
        if_block0 = current_block_type(ctx2);
        if (if_block0) {
          if_block0.c();
          if_block0.m(div, null);
        }
      }
      if (dirty & /*$_, step*/
      9)
        show_if = /*$_*/
        ctx2[3](`connect.${/*step*/
        ctx2[0]}.sidebar.header`, { default: "" });
      if (show_if) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
        } else {
          if_block1 = create_if_block_4$2(ctx2);
          if_block1.c();
          if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if_block0.d();
      if (detaching)
        detach(t);
      if (if_block1)
        if_block1.d(detaching);
      if (detaching)
        detach(if_block1_anchor);
    }
  };
}
function create_else_block_1$1(ctx) {
  let html_tag;
  let html_anchor;
  return {
    c() {
      html_tag = new HtmlTag(false);
      html_anchor = empty();
      html_tag.a = html_anchor;
    },
    m(target, anchor) {
      html_tag.m(defaultBnIcon, target, anchor);
      insert(target, html_anchor, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching)
        detach(html_anchor);
      if (detaching)
        html_tag.d();
    }
  };
}
function create_if_block_5$2(ctx) {
  let show_if;
  let if_block_anchor;
  function select_block_type_1(ctx2, dirty) {
    if (dirty & /*$appMetadata$*/
    4)
      show_if = null;
    if (show_if == null)
      show_if = !!isSVG(
        /*$appMetadata$*/
        ctx2[2].logo || /*$appMetadata$*/
        ctx2[2].icon
      );
    if (show_if)
      return create_if_block_6$2;
    return create_else_block$1;
  }
  let current_block_type = select_block_type_1(ctx, -1);
  let if_block = current_block_type(ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type_1(ctx2, dirty)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      }
    },
    d(detaching) {
      if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function create_else_block$1(ctx) {
  let img;
  let img_src_value;
  return {
    c() {
      img = element("img");
      if (!src_url_equal(img.src, img_src_value = /*$appMetadata$*/
      ctx[2].logo || /*$appMetadata$*/
      ctx[2].icon))
        attr(img, "src", img_src_value);
      attr(img, "alt", "logo");
      attr(img, "class", "svelte-obaru3");
    },
    m(target, anchor) {
      insert(target, img, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & /*$appMetadata$*/
      4 && !src_url_equal(img.src, img_src_value = /*$appMetadata$*/
      ctx2[2].logo || /*$appMetadata$*/
      ctx2[2].icon)) {
        attr(img, "src", img_src_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(img);
    }
  };
}
function create_if_block_6$2(ctx) {
  let html_tag;
  let raw_value = (
    /*$appMetadata$*/
    (ctx[2].logo || /*$appMetadata$*/
    ctx[2].icon) + ""
  );
  let t;
  return {
    c() {
      html_tag = new HtmlTag(false);
      t = text("​");
      html_tag.a = t;
    },
    m(target, anchor) {
      html_tag.m(raw_value, target, anchor);
      insert(target, t, anchor);
    },
    p(ctx2, dirty) {
      if (dirty & /*$appMetadata$*/
      4 && raw_value !== (raw_value = /*$appMetadata$*/
      (ctx2[2].logo || /*$appMetadata$*/
      ctx2[2].icon) + ""))
        html_tag.p(raw_value);
    },
    d(detaching) {
      if (detaching)
        html_tag.d();
      if (detaching)
        detach(t);
    }
  };
}
function create_if_block_4$2(ctx) {
  let div;
  let t_value = (
    /*$_*/
    ctx[3](`connect.${/*step*/
    ctx[0]}.sidebar.header`, { default: (
      /*heading*/
      ctx[7]
    ) }) + ""
  );
  let t;
  return {
    c() {
      div = element("div");
      t = text(t_value);
      attr(div, "class", "heading svelte-obaru3");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, t);
    },
    p(ctx2, dirty) {
      if (dirty & /*$_, step*/
      9 && t_value !== (t_value = /*$_*/
      ctx2[3](`connect.${/*step*/
      ctx2[0]}.sidebar.header`, { default: (
        /*heading*/
        ctx2[7]
      ) }) + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_if_block_2$2(ctx) {
  let a;
  let t0_value = (
    /*$_*/
    ctx[3]("connect.selectingWallet.sidebar.IDontHaveAWallet", {
      default: en.connect.selectingWallet.sidebar.IDontHaveAWallet
    }) + ""
  );
  let t0;
  let t1;
  let div;
  return {
    c() {
      a = element("a");
      t0 = text(t0_value);
      t1 = space();
      div = element("div");
      attr(div, "class", "info-icon svelte-obaru3");
      attr(
        a,
        "href",
        /*connect*/
        ctx[4].iDontHaveAWalletLink || "https://ethereum.org/en/wallets/find-wallet/#main-content"
      );
      attr(a, "target", "_blank");
      attr(a, "rel", "noreferrer noopener");
      attr(a, "class", "no-link svelte-obaru3");
    },
    m(target, anchor) {
      insert(target, a, anchor);
      append(a, t0);
      append(a, t1);
      append(a, div);
      div.innerHTML = infoIcon;
    },
    p(ctx2, dirty) {
      if (dirty & /*$_*/
      8 && t0_value !== (t0_value = /*$_*/
      ctx2[3]("connect.selectingWallet.sidebar.IDontHaveAWallet", {
        default: en.connect.selectingWallet.sidebar.IDontHaveAWallet
      }) + ""))
        set_data(t0, t0_value);
    },
    d(detaching) {
      if (detaching)
        detach(a);
    }
  };
}
function create_if_block_1$2(ctx) {
  let div5;
  let div0;
  let t0;
  let div1;
  let div1_style_value;
  let t1;
  let div2;
  let t2;
  let div3;
  let div3_style_value;
  let t3;
  let div4;
  return {
    c() {
      div5 = element("div");
      div0 = element("div");
      t0 = space();
      div1 = element("div");
      t1 = space();
      div2 = element("div");
      t2 = space();
      div3 = element("div");
      t3 = space();
      div4 = element("div");
      attr(div0, "class", "indicator relative svelte-obaru3");
      toggle_class(div0, "on", true);
      attr(div1, "class", "join relative svelte-obaru3");
      attr(div1, "style", div1_style_value = `${/*step*/
      ctx[0] !== "selectingWallet" ? "right: 4px; width: 52px;" : "right: 2px; width: 54px;"}`);
      toggle_class(
        div1,
        "active",
        /*step*/
        ctx[0] !== "selectingWallet"
      );
      attr(div2, "class", "indicator relative svelte-obaru3");
      attr(div2, "style", `right: 8px;`);
      toggle_class(
        div2,
        "on",
        /*step*/
        ctx[0] !== "selectingWallet"
      );
      attr(div3, "class", "join relative svelte-obaru3");
      attr(div3, "style", div3_style_value = `${/*step*/
      ctx[0] === "connectedWallet" ? "right: 12px; width: 52px;" : "right: 10px; width: 54px;"}`);
      toggle_class(
        div3,
        "active",
        /*step*/
        ctx[0] === "connectedWallet"
      );
      attr(div4, "style", `right: 16px;`);
      attr(div4, "class", "indicator relative svelte-obaru3");
      toggle_class(
        div4,
        "on",
        /*step*/
        ctx[0] === "connectedWallet"
      );
      attr(div5, "class", "indicators flex items-center svelte-obaru3");
    },
    m(target, anchor) {
      insert(target, div5, anchor);
      append(div5, div0);
      append(div5, t0);
      append(div5, div1);
      append(div5, t1);
      append(div5, div2);
      append(div5, t2);
      append(div5, div3);
      append(div5, t3);
      append(div5, div4);
    },
    p(ctx2, dirty) {
      if (dirty & /*step*/
      1 && div1_style_value !== (div1_style_value = `${/*step*/
      ctx2[0] !== "selectingWallet" ? "right: 4px; width: 52px;" : "right: 2px; width: 54px;"}`)) {
        attr(div1, "style", div1_style_value);
      }
      if (dirty & /*step*/
      1) {
        toggle_class(
          div1,
          "active",
          /*step*/
          ctx2[0] !== "selectingWallet"
        );
      }
      if (dirty & /*step*/
      1) {
        toggle_class(
          div2,
          "on",
          /*step*/
          ctx2[0] !== "selectingWallet"
        );
      }
      if (dirty & /*step*/
      1 && div3_style_value !== (div3_style_value = `${/*step*/
      ctx2[0] === "connectedWallet" ? "right: 12px; width: 52px;" : "right: 10px; width: 54px;"}`)) {
        attr(div3, "style", div3_style_value);
      }
      if (dirty & /*step*/
      1) {
        toggle_class(
          div3,
          "active",
          /*step*/
          ctx2[0] === "connectedWallet"
        );
      }
      if (dirty & /*step*/
      1) {
        toggle_class(
          div4,
          "on",
          /*step*/
          ctx2[0] === "connectedWallet"
        );
      }
    },
    d(detaching) {
      if (detaching)
        detach(div5);
    }
  };
}
function create_if_block$3(ctx) {
  let div5;
  let div0;
  let t0;
  let div1;
  let div1_style_value;
  let t1;
  let div2;
  let t2;
  let div3;
  let div3_style_value;
  let t3;
  let div4;
  return {
    c() {
      div5 = element("div");
      div0 = element("div");
      t0 = space();
      div1 = element("div");
      t1 = space();
      div2 = element("div");
      t2 = space();
      div3 = element("div");
      t3 = space();
      div4 = element("div");
      attr(div0, "class", "indicator relative svelte-obaru3");
      toggle_class(div0, "on", true);
      attr(div1, "class", "join relative svelte-obaru3");
      attr(div1, "style", div1_style_value = `right: 2px; ${/*step*/
      ctx[0] !== "selectingWallet" ? "width: 78px;" : "width: 82px;"}`);
      toggle_class(
        div1,
        "active",
        /*step*/
        ctx[0] !== "selectingWallet"
      );
      attr(div2, "class", "indicator relative svelte-obaru3");
      attr(div2, "style", `right: 4px;`);
      toggle_class(
        div2,
        "on",
        /*step*/
        ctx[0] !== "selectingWallet"
      );
      attr(div3, "class", "join relative svelte-obaru3");
      attr(div3, "style", div3_style_value = `right: 6px; ${/*step*/
      ctx[0] === "connectedWallet" ? "width: 74px;" : "width: 81px;"}`);
      toggle_class(
        div3,
        "active",
        /*step*/
        ctx[0] === "connectedWallet"
      );
      attr(div4, "style", `right: 8px;`);
      attr(div4, "class", "indicator relative svelte-obaru3");
      toggle_class(
        div4,
        "on",
        /*step*/
        ctx[0] === "connectedWallet"
      );
      attr(div5, "class", "indicators flex items-center svelte-obaru3");
    },
    m(target, anchor) {
      insert(target, div5, anchor);
      append(div5, div0);
      append(div5, t0);
      append(div5, div1);
      append(div5, t1);
      append(div5, div2);
      append(div5, t2);
      append(div5, div3);
      append(div5, t3);
      append(div5, div4);
    },
    p(ctx2, dirty) {
      if (dirty & /*step*/
      1 && div1_style_value !== (div1_style_value = `right: 2px; ${/*step*/
      ctx2[0] !== "selectingWallet" ? "width: 78px;" : "width: 82px;"}`)) {
        attr(div1, "style", div1_style_value);
      }
      if (dirty & /*step*/
      1) {
        toggle_class(
          div1,
          "active",
          /*step*/
          ctx2[0] !== "selectingWallet"
        );
      }
      if (dirty & /*step*/
      1) {
        toggle_class(
          div2,
          "on",
          /*step*/
          ctx2[0] !== "selectingWallet"
        );
      }
      if (dirty & /*step*/
      1 && div3_style_value !== (div3_style_value = `right: 6px; ${/*step*/
      ctx2[0] === "connectedWallet" ? "width: 74px;" : "width: 81px;"}`)) {
        attr(div3, "style", div3_style_value);
      }
      if (dirty & /*step*/
      1) {
        toggle_class(
          div3,
          "active",
          /*step*/
          ctx2[0] === "connectedWallet"
        );
      }
      if (dirty & /*step*/
      1) {
        toggle_class(
          div4,
          "on",
          /*step*/
          ctx2[0] === "connectedWallet"
        );
      }
    },
    d(detaching) {
      if (detaching)
        detach(div5);
    }
  };
}
function create_fragment$5(ctx) {
  let div4;
  let div2;
  let t0;
  let div0;
  let t1_value = (
    /*$_*/
    ctx[3](`connect.${/*step*/
    ctx[0]}.sidebar.subheading`, { default: (
      /*subheading*/
      ctx[5]
    ) }) + ""
  );
  let t1;
  let t2;
  let div1;
  let t3_value = (
    /*$_*/
    ctx[3](`connect.${/*step*/
    ctx[0]}.sidebar.paragraph`, {
      values: {
        app: (
          /*$appMetadata$*/
          ctx[2] && /*$appMetadata$*/
          ctx[2].name || "This App"
        )
      },
      default: (
        /*paragraph*/
        ctx[6]
      )
    }) + ""
  );
  let t3;
  let t4;
  let t5;
  let t6;
  let t7;
  let div3;
  let mounted;
  let dispose;
  add_render_callback(
    /*onwindowresize*/
    ctx[9]
  );
  let if_block0 = (
    /*windowWidth*/
    ctx[1] >= MOBILE_WINDOW_WIDTH && create_if_block_3$2(ctx)
  );
  let if_block1 = !/*connect*/
  ctx[4].removeIDontHaveAWalletInfoLink && create_if_block_2$2(ctx);
  let if_block2 = (
    /*windowWidth*/
    ctx[1] < MOBILE_WINDOW_WIDTH && create_if_block_1$2(ctx)
  );
  let if_block3 = (
    /*windowWidth*/
    ctx[1] >= MOBILE_WINDOW_WIDTH && create_if_block$3(ctx)
  );
  return {
    c() {
      div4 = element("div");
      div2 = element("div");
      if (if_block0)
        if_block0.c();
      t0 = space();
      div0 = element("div");
      t1 = text(t1_value);
      t2 = space();
      div1 = element("div");
      t3 = text(t3_value);
      t4 = space();
      if (if_block1)
        if_block1.c();
      t5 = space();
      if (if_block2)
        if_block2.c();
      t6 = space();
      if (if_block3)
        if_block3.c();
      t7 = space();
      div3 = element("div");
      attr(div0, "class", "subheading svelte-obaru3");
      attr(div1, "class", "description svelte-obaru3");
      attr(div2, "class", "inner-container svelte-obaru3");
      attr(div4, "class", "sidebar svelte-obaru3");
    },
    m(target, anchor) {
      insert(target, div4, anchor);
      append(div4, div2);
      if (if_block0)
        if_block0.m(div2, null);
      append(div2, t0);
      append(div2, div0);
      append(div0, t1);
      append(div2, t2);
      append(div2, div1);
      append(div1, t3);
      append(div2, t4);
      if (if_block1)
        if_block1.m(div2, null);
      append(div2, t5);
      if (if_block2)
        if_block2.m(div2, null);
      append(div4, t6);
      if (if_block3)
        if_block3.m(div4, null);
      append(div4, t7);
      append(div4, div3);
      div3.innerHTML = poweredByBlocknative;
      if (!mounted) {
        dispose = listen(
          window,
          "resize",
          /*onwindowresize*/
          ctx[9]
        );
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (
        /*windowWidth*/
        ctx2[1] >= MOBILE_WINDOW_WIDTH
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
        } else {
          if_block0 = create_if_block_3$2(ctx2);
          if_block0.c();
          if_block0.m(div2, t0);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (dirty & /*$_, step*/
      9 && t1_value !== (t1_value = /*$_*/
      ctx2[3](`connect.${/*step*/
      ctx2[0]}.sidebar.subheading`, { default: (
        /*subheading*/
        ctx2[5]
      ) }) + ""))
        set_data(t1, t1_value);
      if (dirty & /*$_, step, $appMetadata$*/
      13 && t3_value !== (t3_value = /*$_*/
      ctx2[3](`connect.${/*step*/
      ctx2[0]}.sidebar.paragraph`, {
        values: {
          app: (
            /*$appMetadata$*/
            ctx2[2] && /*$appMetadata$*/
            ctx2[2].name || "This App"
          )
        },
        default: (
          /*paragraph*/
          ctx2[6]
        )
      }) + ""))
        set_data(t3, t3_value);
      if (!/*connect*/
      ctx2[4].removeIDontHaveAWalletInfoLink)
        if_block1.p(ctx2, dirty);
      if (
        /*windowWidth*/
        ctx2[1] < MOBILE_WINDOW_WIDTH
      ) {
        if (if_block2) {
          if_block2.p(ctx2, dirty);
        } else {
          if_block2 = create_if_block_1$2(ctx2);
          if_block2.c();
          if_block2.m(div2, null);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
      if (
        /*windowWidth*/
        ctx2[1] >= MOBILE_WINDOW_WIDTH
      ) {
        if (if_block3) {
          if_block3.p(ctx2, dirty);
        } else {
          if_block3 = create_if_block$3(ctx2);
          if_block3.c();
          if_block3.m(div4, t7);
        }
      } else if (if_block3) {
        if_block3.d(1);
        if_block3 = null;
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(div4);
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
      if (if_block2)
        if_block2.d();
      if (if_block3)
        if_block3.d();
      mounted = false;
      dispose();
    }
  };
}
function instance$5($$self, $$props, $$invalidate) {
  let $appMetadata$;
  let $_;
  component_subscribe($$self, $format, ($$value) => $$invalidate(3, $_ = $$value));
  let { step } = $$props;
  const { connect: connect2 } = state$1.get();
  const defaultContent = en.connect[step].sidebar;
  const { subheading, paragraph } = defaultContent;
  const { heading } = defaultContent;
  let windowWidth;
  const appMetadata$ = state$1.select("appMetadata").pipe(startWith$2(state$1.get().appMetadata), shareReplay$2(1));
  component_subscribe($$self, appMetadata$, (value) => $$invalidate(2, $appMetadata$ = value));
  function onwindowresize() {
    $$invalidate(1, windowWidth = window.innerWidth);
  }
  $$self.$$set = ($$props2) => {
    if ("step" in $$props2)
      $$invalidate(0, step = $$props2.step);
  };
  return [
    step,
    windowWidth,
    $appMetadata$,
    $_,
    connect2,
    subheading,
    paragraph,
    heading,
    appMetadata$,
    onwindowresize
  ];
}
class Sidebar extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(this, options2, instance$5, create_fragment$5, safe_not_equal, { step: 0 }, add_css$5);
  }
}
function add_css$4(target) {
  append_styles(target, "svelte-b3j15j", ".container.svelte-b3j15j{--background-color:var(\n      --onboard-main-scroll-container-background,\n      var(--w3o-background-color)\n    );--foreground-color:var(--w3o-foreground-color);--text-color:var(--onboard-connect-text-color, var(--w3o-text-color));--border-color:var(--w3o-border-color, var(--gray-200));--action-color:var(--w3o-action-color, var(--primary-500));font-family:var(--onboard-font-family-normal, var(--font-family-normal));font-size:var(--onboard-font-size-5, 1rem);background:var(--background-color);color:var(--text-color);border-color:var(--border-color);line-height:24px;overflow:hidden;position:relative;display:flex;height:min-content;flex-flow:column-reverse}.content.svelte-b3j15j{width:var(--onboard-connect-content-width, 100%)}.header.svelte-b3j15j{display:flex;padding:1rem;border-bottom:1px solid transparent;background:var(--onboard-connect-header-background);color:var(--onboard-connect-header-color);border-color:var(--border-color)}.header-heading.svelte-b3j15j{line-height:1rem}.button-container.svelte-b3j15j{right:0.5rem;top:0.5rem}.mobile-header.svelte-b3j15j{display:flex;gap:0.5rem;height:4.5rem;padding:1rem;border-bottom:1px solid;border-color:var(--border-color)}.mobile-subheader.svelte-b3j15j{opacity:0.6;font-size:0.875rem;font-weight:400;line-height:1rem;margin-top:0.25rem}.icon-container.svelte-b3j15j{display:flex;flex:0 0 auto;height:2.5rem;width:2.5rem;min-width:2.5rem;justify-content:center;align-items:center}.disabled.svelte-b3j15j{opacity:0.2;pointer-events:none;overflow:hidden}.icon-container svg{display:block;height:100%;width:auto}.w-full.svelte-b3j15j{width:100%}.scroll-container.svelte-b3j15j{overflow-y:auto;transition:opacity 250ms ease-in-out;scrollbar-width:none}.scroll-container.svelte-b3j15j::-webkit-scrollbar{display:none}.mobile-safari.svelte-b3j15j{padding-bottom:80px}@media all and (min-width: 768px){.container.svelte-b3j15j{margin:0;flex-flow:row;height:var(--onboard-connect-content-height, 440px)}.content.svelte-b3j15j{width:var(--onboard-connect-content-width, 488px)}.mobile-subheader.svelte-b3j15j{display:none}.icon-container.svelte-b3j15j{display:none}}");
}
function create_if_block$2(ctx) {
  let modal;
  let current2;
  modal = new Modal({
    props: {
      close: !/*connect*/
      ctx[16].disableClose && /*close*/
      ctx[20],
      $$slots: { default: [create_default_slot$2] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(modal.$$.fragment);
    },
    m(target, anchor) {
      mount_component(modal, target, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      const modal_changes = {};
      if (dirty[0] & /*scrollContainer, selectedWallet, $modalStep$, windowWidth, connectionRejected, previousConnectionRequest, displayConnectingWallet, agreed, wallets, connectingWalletLabel, connectingErrorMessage, availableWallets, $_, $appMetadata$*/
      32766 | dirty[1] & /*$$scope*/
      64) {
        modal_changes.$$scope = { dirty, ctx: ctx2 };
      }
      modal.$set(modal_changes);
    },
    i(local) {
      if (current2)
        return;
      transition_in(modal.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(modal.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      destroy_component(modal, detaching);
    }
  };
}
function create_if_block_9$1(ctx) {
  let sidebar;
  let current2;
  sidebar = new Sidebar({ props: { step: (
    /*$modalStep$*/
    ctx[5]
  ) } });
  return {
    c() {
      create_component(sidebar.$$.fragment);
    },
    m(target, anchor) {
      mount_component(sidebar, target, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      const sidebar_changes = {};
      if (dirty[0] & /*$modalStep$*/
      32)
        sidebar_changes.step = /*$modalStep$*/
        ctx2[5];
      sidebar.$set(sidebar_changes);
    },
    i(local) {
      if (current2)
        return;
      transition_in(sidebar.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(sidebar.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      destroy_component(sidebar, detaching);
    }
  };
}
function create_else_block_3(ctx) {
  let div1;
  let div0;
  let t0_value = (
    /*$_*/
    ctx[14](`connect.${/*$modalStep$*/
    ctx[5]}.header`, {
      default: en.connect[
        /*$modalStep$*/
        ctx[5]
      ].header,
      values: {
        connectionRejected: (
          /*connectionRejected*/
          ctx[1]
        ),
        wallet: (
          /*selectedWallet*/
          ctx[3] && /*selectedWallet*/
          ctx[3].label
        )
      }
    }) + ""
  );
  let t0;
  let t1;
  let t2_value = (
    /*$modalStep$*/
    ctx[5] === "selectingWallet" ? `(${/*availableWallets*/
    ctx[12]})` : ""
  );
  let t2;
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      t0 = text(t0_value);
      t1 = space();
      t2 = text(t2_value);
      attr(div0, "class", "header-heading svelte-b3j15j");
      attr(div1, "class", "header relative flex items-center svelte-b3j15j");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      append(div0, t0);
      append(div0, t1);
      append(div0, t2);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*$_, $modalStep$, connectionRejected, selectedWallet*/
      16426 && t0_value !== (t0_value = /*$_*/
      ctx2[14](`connect.${/*$modalStep$*/
      ctx2[5]}.header`, {
        default: en.connect[
          /*$modalStep$*/
          ctx2[5]
        ].header,
        values: {
          connectionRejected: (
            /*connectionRejected*/
            ctx2[1]
          ),
          wallet: (
            /*selectedWallet*/
            ctx2[3] && /*selectedWallet*/
            ctx2[3].label
          )
        }
      }) + ""))
        set_data(t0, t0_value);
      if (dirty[0] & /*$modalStep$, availableWallets*/
      4128 && t2_value !== (t2_value = /*$modalStep$*/
      ctx2[5] === "selectingWallet" ? `(${/*availableWallets*/
      ctx2[12]})` : ""))
        set_data(t2, t2_value);
    },
    d(detaching) {
      if (detaching)
        detach(div1);
    }
  };
}
function create_if_block_6$1(ctx) {
  let div4;
  let div0;
  let t0;
  let div3;
  let div1;
  let t1_value = (
    /*$_*/
    ctx[14](
      /*$modalStep$*/
      ctx[5] === "connectingWallet" && /*selectedWallet*/
      ctx[3] ? `connect.${/*$modalStep$*/
      ctx[5]}.header` : `connect.${/*$modalStep$*/
      ctx[5]}.sidebar.subheading`,
      {
        default: (
          /*$modalStep$*/
          ctx[5] === "connectingWallet" && /*selectedWallet*/
          ctx[3] ? en.connect[
            /*$modalStep$*/
            ctx[5]
          ].header : en.connect[
            /*$modalStep$*/
            ctx[5]
          ].sidebar.subheading
        ),
        values: {
          connectionRejected: (
            /*connectionRejected*/
            ctx[1]
          ),
          wallet: (
            /*selectedWallet*/
            ctx[3] && /*selectedWallet*/
            ctx[3].label
          )
        }
      }
    ) + ""
  );
  let t1;
  let t2;
  let div2;
  let t3_value = (
    /*$modalStep$*/
    ctx[5] === "selectingWallet" ? `${/*availableWallets*/
    ctx[12]} available wallets` : "1 account selected"
  );
  let t3;
  function select_block_type_1(ctx2, dirty) {
    if (
      /*$appMetadata$*/
      ctx2[13] && /*$appMetadata$*/
      ctx2[13].icon
    )
      return create_if_block_7$1;
    return create_else_block_2;
  }
  let current_block_type = select_block_type_1(ctx);
  let if_block = current_block_type(ctx);
  return {
    c() {
      div4 = element("div");
      div0 = element("div");
      if_block.c();
      t0 = space();
      div3 = element("div");
      div1 = element("div");
      t1 = text(t1_value);
      t2 = space();
      div2 = element("div");
      t3 = text(t3_value);
      attr(div0, "class", "icon-container svelte-b3j15j");
      attr(div1, "class", "header-heading svelte-b3j15j");
      attr(div2, "class", "mobile-subheader svelte-b3j15j");
      attr(div3, "class", "flex flex-column justify-center w-full svelte-b3j15j");
      attr(div4, "class", "mobile-header svelte-b3j15j");
    },
    m(target, anchor) {
      insert(target, div4, anchor);
      append(div4, div0);
      if_block.m(div0, null);
      append(div4, t0);
      append(div4, div3);
      append(div3, div1);
      append(div1, t1);
      append(div3, t2);
      append(div3, div2);
      append(div2, t3);
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type_1(ctx2)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(div0, null);
        }
      }
      if (dirty[0] & /*$_, $modalStep$, selectedWallet, connectionRejected*/
      16426 && t1_value !== (t1_value = /*$_*/
      ctx2[14](
        /*$modalStep$*/
        ctx2[5] === "connectingWallet" && /*selectedWallet*/
        ctx2[3] ? `connect.${/*$modalStep$*/
        ctx2[5]}.header` : `connect.${/*$modalStep$*/
        ctx2[5]}.sidebar.subheading`,
        {
          default: (
            /*$modalStep$*/
            ctx2[5] === "connectingWallet" && /*selectedWallet*/
            ctx2[3] ? en.connect[
              /*$modalStep$*/
              ctx2[5]
            ].header : en.connect[
              /*$modalStep$*/
              ctx2[5]
            ].sidebar.subheading
          ),
          values: {
            connectionRejected: (
              /*connectionRejected*/
              ctx2[1]
            ),
            wallet: (
              /*selectedWallet*/
              ctx2[3] && /*selectedWallet*/
              ctx2[3].label
            )
          }
        }
      ) + ""))
        set_data(t1, t1_value);
      if (dirty[0] & /*$modalStep$, availableWallets*/
      4128 && t3_value !== (t3_value = /*$modalStep$*/
      ctx2[5] === "selectingWallet" ? `${/*availableWallets*/
      ctx2[12]} available wallets` : "1 account selected"))
        set_data(t3, t3_value);
    },
    d(detaching) {
      if (detaching)
        detach(div4);
      if_block.d();
    }
  };
}
function create_else_block_2(ctx) {
  let html_tag;
  let html_anchor;
  return {
    c() {
      html_tag = new HtmlTag(false);
      html_anchor = empty();
      html_tag.a = html_anchor;
    },
    m(target, anchor) {
      html_tag.m(defaultBnIcon, target, anchor);
      insert(target, html_anchor, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching)
        detach(html_anchor);
      if (detaching)
        html_tag.d();
    }
  };
}
function create_if_block_7$1(ctx) {
  let show_if;
  let if_block_anchor;
  function select_block_type_2(ctx2, dirty) {
    if (dirty[0] & /*$appMetadata$*/
    8192)
      show_if = null;
    if (show_if == null)
      show_if = !!isSVG(
        /*$appMetadata$*/
        ctx2[13].icon
      );
    if (show_if)
      return create_if_block_8$1;
    return create_else_block_1;
  }
  let current_block_type = select_block_type_2(ctx, [-1, -1]);
  let if_block = current_block_type(ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (current_block_type === (current_block_type = select_block_type_2(ctx2, dirty)) && if_block) {
        if_block.p(ctx2, dirty);
      } else {
        if_block.d(1);
        if_block = current_block_type(ctx2);
        if (if_block) {
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      }
    },
    d(detaching) {
      if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function create_else_block_1(ctx) {
  let img;
  let img_src_value;
  return {
    c() {
      img = element("img");
      if (!src_url_equal(img.src, img_src_value = /*$appMetadata$*/
      ctx[13].icon))
        attr(img, "src", img_src_value);
      attr(img, "alt", "logo");
    },
    m(target, anchor) {
      insert(target, img, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*$appMetadata$*/
      8192 && !src_url_equal(img.src, img_src_value = /*$appMetadata$*/
      ctx2[13].icon)) {
        attr(img, "src", img_src_value);
      }
    },
    d(detaching) {
      if (detaching)
        detach(img);
    }
  };
}
function create_if_block_8$1(ctx) {
  let html_tag;
  let raw_value = (
    /*$appMetadata$*/
    ctx[13].icon + ""
  );
  let html_anchor;
  return {
    c() {
      html_tag = new HtmlTag(false);
      html_anchor = empty();
      html_tag.a = html_anchor;
    },
    m(target, anchor) {
      html_tag.m(raw_value, target, anchor);
      insert(target, html_anchor, anchor);
    },
    p(ctx2, dirty) {
      if (dirty[0] & /*$appMetadata$*/
      8192 && raw_value !== (raw_value = /*$appMetadata$*/
      ctx2[13].icon + ""))
        html_tag.p(raw_value);
    },
    d(detaching) {
      if (detaching)
        detach(html_anchor);
      if (detaching)
        html_tag.d();
    }
  };
}
function create_if_block_5$1(ctx) {
  let div;
  let closebutton;
  let current2;
  let mounted;
  let dispose;
  closebutton = new CloseButton({});
  return {
    c() {
      div = element("div");
      create_component(closebutton.$$.fragment);
      attr(div, "class", "button-container absolute svelte-b3j15j");
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(closebutton, div, null);
      current2 = true;
      if (!mounted) {
        dispose = listen(
          div,
          "click",
          /*close*/
          ctx[20]
        );
        mounted = true;
      }
    },
    p: noop,
    i(local) {
      if (current2)
        return;
      transition_in(closebutton.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(closebutton.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_component(closebutton);
      mounted = false;
      dispose();
    }
  };
}
function create_if_block_3$1(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current2;
  const if_block_creators = [create_if_block_4$1, create_else_block];
  const if_blocks = [];
  function select_block_type_3(ctx2, dirty) {
    if (
      /*wallets*/
      ctx2[2].length
    )
      return 0;
    return 1;
  }
  current_block_type_index = select_block_type_3(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type_3(ctx2);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block = if_blocks[current_block_type_index];
        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block.c();
        } else {
          if_block.p(ctx2, dirty);
        }
        transition_in(if_block, 1);
        if_block.m(if_block_anchor.parentNode, if_block_anchor);
      }
    },
    i(local) {
      if (current2)
        return;
      transition_in(if_block);
      current2 = true;
    },
    o(local) {
      transition_out(if_block);
      current2 = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function create_else_block(ctx) {
  let installwallet;
  let current2;
  installwallet = new InstallWallet({});
  return {
    c() {
      create_component(installwallet.$$.fragment);
    },
    m(target, anchor) {
      mount_component(installwallet, target, anchor);
      current2 = true;
    },
    p: noop,
    i(local) {
      if (current2)
        return;
      transition_in(installwallet.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(installwallet.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      destroy_component(installwallet, detaching);
    }
  };
}
function create_if_block_4$1(ctx) {
  let agreement2;
  let updating_agreed;
  let t;
  let div;
  let selectingwallet;
  let current2;
  function agreement_agreed_binding(value) {
    ctx[25](value);
  }
  let agreement_props = {};
  if (
    /*agreed*/
    ctx[7] !== void 0
  ) {
    agreement_props.agreed = /*agreed*/
    ctx[7];
  }
  agreement2 = new Agreement({ props: agreement_props });
  binding_callbacks.push(() => bind(agreement2, "agreed", agreement_agreed_binding));
  selectingwallet = new SelectingWallet({
    props: {
      selectWallet: (
        /*selectWallet*/
        ctx[18]
      ),
      wallets: (
        /*wallets*/
        ctx[2]
      ),
      connectingWalletLabel: (
        /*connectingWalletLabel*/
        ctx[8]
      ),
      connectingErrorMessage: (
        /*connectingErrorMessage*/
        ctx[9]
      )
    }
  });
  return {
    c() {
      create_component(agreement2.$$.fragment);
      t = space();
      div = element("div");
      create_component(selectingwallet.$$.fragment);
      attr(div, "class", "svelte-b3j15j");
      toggle_class(div, "disabled", !/*agreed*/
      ctx[7]);
    },
    m(target, anchor) {
      mount_component(agreement2, target, anchor);
      insert(target, t, anchor);
      insert(target, div, anchor);
      mount_component(selectingwallet, div, null);
      current2 = true;
    },
    p(ctx2, dirty) {
      const agreement_changes = {};
      if (!updating_agreed && dirty[0] & /*agreed*/
      128) {
        updating_agreed = true;
        agreement_changes.agreed = /*agreed*/
        ctx2[7];
        add_flush_callback(() => updating_agreed = false);
      }
      agreement2.$set(agreement_changes);
      const selectingwallet_changes = {};
      if (dirty[0] & /*wallets*/
      4)
        selectingwallet_changes.wallets = /*wallets*/
        ctx2[2];
      if (dirty[0] & /*connectingWalletLabel*/
      256)
        selectingwallet_changes.connectingWalletLabel = /*connectingWalletLabel*/
        ctx2[8];
      if (dirty[0] & /*connectingErrorMessage*/
      512)
        selectingwallet_changes.connectingErrorMessage = /*connectingErrorMessage*/
        ctx2[9];
      selectingwallet.$set(selectingwallet_changes);
      if (!current2 || dirty[0] & /*agreed*/
      128) {
        toggle_class(div, "disabled", !/*agreed*/
        ctx2[7]);
      }
    },
    i(local) {
      if (current2)
        return;
      transition_in(agreement2.$$.fragment, local);
      transition_in(selectingwallet.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(agreement2.$$.fragment, local);
      transition_out(selectingwallet.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      destroy_component(agreement2, detaching);
      if (detaching)
        detach(t);
      if (detaching)
        detach(div);
      destroy_component(selectingwallet);
    }
  };
}
function create_if_block_2$1(ctx) {
  let connectingwallet;
  let current2;
  connectingwallet = new ConnectingWallet({
    props: {
      connectWallet: (
        /*connectWallet*/
        ctx[21]
      ),
      connectionRejected: (
        /*connectionRejected*/
        ctx[1]
      ),
      previousConnectionRequest: (
        /*previousConnectionRequest*/
        ctx[6]
      ),
      setStep: (
        /*setStep*/
        ctx[22]
      ),
      deselectWallet: (
        /*deselectWallet*/
        ctx[19]
      ),
      selectedWallet: (
        /*selectedWallet*/
        ctx[3]
      )
    }
  });
  return {
    c() {
      create_component(connectingwallet.$$.fragment);
    },
    m(target, anchor) {
      mount_component(connectingwallet, target, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      const connectingwallet_changes = {};
      if (dirty[0] & /*connectionRejected*/
      2)
        connectingwallet_changes.connectionRejected = /*connectionRejected*/
        ctx2[1];
      if (dirty[0] & /*previousConnectionRequest*/
      64)
        connectingwallet_changes.previousConnectionRequest = /*previousConnectionRequest*/
        ctx2[6];
      if (dirty[0] & /*selectedWallet*/
      8)
        connectingwallet_changes.selectedWallet = /*selectedWallet*/
        ctx2[3];
      connectingwallet.$set(connectingwallet_changes);
    },
    i(local) {
      if (current2)
        return;
      transition_in(connectingwallet.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(connectingwallet.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      destroy_component(connectingwallet, detaching);
    }
  };
}
function create_if_block_1$1(ctx) {
  let connectedwallet;
  let current2;
  connectedwallet = new ConnectedWallet({
    props: {
      selectedWallet: (
        /*selectedWallet*/
        ctx[3]
      )
    }
  });
  return {
    c() {
      create_component(connectedwallet.$$.fragment);
    },
    m(target, anchor) {
      mount_component(connectedwallet, target, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      const connectedwallet_changes = {};
      if (dirty[0] & /*selectedWallet*/
      8)
        connectedwallet_changes.selectedWallet = /*selectedWallet*/
        ctx2[3];
      connectedwallet.$set(connectedwallet_changes);
    },
    i(local) {
      if (current2)
        return;
      transition_in(connectedwallet.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(connectedwallet.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      destroy_component(connectedwallet, detaching);
    }
  };
}
function create_default_slot$2(ctx) {
  let div2;
  let t0;
  let div1;
  let t1;
  let t2;
  let div0;
  let t3;
  let t4;
  let current2;
  let if_block0 = (
    /*connect*/
    ctx[16].showSidebar && create_if_block_9$1(ctx)
  );
  function select_block_type(ctx2, dirty) {
    if (
      /*windowWidth*/
      ctx2[4] <= MOBILE_WINDOW_WIDTH
    )
      return create_if_block_6$1;
    return create_else_block_3;
  }
  let current_block_type = select_block_type(ctx);
  let if_block1 = current_block_type(ctx);
  let if_block2 = !/*connect*/
  ctx[16].disableClose && create_if_block_5$1(ctx);
  let if_block3 = (
    /*$modalStep$*/
    (ctx[5] === "selectingWallet" || /*windowWidth*/
    ctx[4] <= MOBILE_WINDOW_WIDTH) && create_if_block_3$1(ctx)
  );
  let if_block4 = (
    /*displayConnectingWallet*/
    ctx[11] && create_if_block_2$1(ctx)
  );
  let if_block5 = (
    /*$modalStep$*/
    ctx[5] === "connectedWallet" && /*selectedWallet*/
    ctx[3] && /*windowWidth*/
    ctx[4] >= MOBILE_WINDOW_WIDTH && create_if_block_1$1(ctx)
  );
  return {
    c() {
      div2 = element("div");
      if (if_block0)
        if_block0.c();
      t0 = space();
      div1 = element("div");
      if_block1.c();
      t1 = space();
      if (if_block2)
        if_block2.c();
      t2 = space();
      div0 = element("div");
      if (if_block3)
        if_block3.c();
      t3 = space();
      if (if_block4)
        if_block4.c();
      t4 = space();
      if (if_block5)
        if_block5.c();
      attr(div0, "class", "scroll-container svelte-b3j15j");
      attr(div1, "class", "content flex flex-column svelte-b3j15j");
      attr(div2, "class", "container svelte-b3j15j");
      toggle_class(
        div2,
        "mobile-safari",
        /*isSafariMobile*/
        ctx[23]
      );
    },
    m(target, anchor) {
      insert(target, div2, anchor);
      if (if_block0)
        if_block0.m(div2, null);
      append(div2, t0);
      append(div2, div1);
      if_block1.m(div1, null);
      append(div1, t1);
      if (if_block2)
        if_block2.m(div1, null);
      append(div1, t2);
      append(div1, div0);
      if (if_block3)
        if_block3.m(div0, null);
      append(div0, t3);
      if (if_block4)
        if_block4.m(div0, null);
      append(div0, t4);
      if (if_block5)
        if_block5.m(div0, null);
      ctx[26](div0);
      current2 = true;
    },
    p(ctx2, dirty) {
      if (
        /*connect*/
        ctx2[16].showSidebar
      )
        if_block0.p(ctx2, dirty);
      if (current_block_type === (current_block_type = select_block_type(ctx2)) && if_block1) {
        if_block1.p(ctx2, dirty);
      } else {
        if_block1.d(1);
        if_block1 = current_block_type(ctx2);
        if (if_block1) {
          if_block1.c();
          if_block1.m(div1, t1);
        }
      }
      if (!/*connect*/
      ctx2[16].disableClose)
        if_block2.p(ctx2, dirty);
      if (
        /*$modalStep$*/
        ctx2[5] === "selectingWallet" || /*windowWidth*/
        ctx2[4] <= MOBILE_WINDOW_WIDTH
      ) {
        if (if_block3) {
          if_block3.p(ctx2, dirty);
          if (dirty[0] & /*$modalStep$, windowWidth*/
          48) {
            transition_in(if_block3, 1);
          }
        } else {
          if_block3 = create_if_block_3$1(ctx2);
          if_block3.c();
          transition_in(if_block3, 1);
          if_block3.m(div0, t3);
        }
      } else if (if_block3) {
        group_outros();
        transition_out(if_block3, 1, 1, () => {
          if_block3 = null;
        });
        check_outros();
      }
      if (
        /*displayConnectingWallet*/
        ctx2[11]
      ) {
        if (if_block4) {
          if_block4.p(ctx2, dirty);
          if (dirty[0] & /*displayConnectingWallet*/
          2048) {
            transition_in(if_block4, 1);
          }
        } else {
          if_block4 = create_if_block_2$1(ctx2);
          if_block4.c();
          transition_in(if_block4, 1);
          if_block4.m(div0, t4);
        }
      } else if (if_block4) {
        group_outros();
        transition_out(if_block4, 1, 1, () => {
          if_block4 = null;
        });
        check_outros();
      }
      if (
        /*$modalStep$*/
        ctx2[5] === "connectedWallet" && /*selectedWallet*/
        ctx2[3] && /*windowWidth*/
        ctx2[4] >= MOBILE_WINDOW_WIDTH
      ) {
        if (if_block5) {
          if_block5.p(ctx2, dirty);
          if (dirty[0] & /*$modalStep$, selectedWallet, windowWidth*/
          56) {
            transition_in(if_block5, 1);
          }
        } else {
          if_block5 = create_if_block_1$1(ctx2);
          if_block5.c();
          transition_in(if_block5, 1);
          if_block5.m(div0, null);
        }
      } else if (if_block5) {
        group_outros();
        transition_out(if_block5, 1, 1, () => {
          if_block5 = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current2)
        return;
      transition_in(if_block0);
      transition_in(if_block2);
      transition_in(if_block3);
      transition_in(if_block4);
      transition_in(if_block5);
      current2 = true;
    },
    o(local) {
      transition_out(if_block0);
      transition_out(if_block2);
      transition_out(if_block3);
      transition_out(if_block4);
      transition_out(if_block5);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div2);
      if (if_block0)
        if_block0.d();
      if_block1.d();
      if (if_block2)
        if_block2.d();
      if (if_block3)
        if_block3.d();
      if (if_block4)
        if_block4.d();
      if (if_block5)
        if_block5.d();
      ctx[26](null);
    }
  };
}
function create_fragment$4(ctx) {
  let if_block_anchor;
  let current2;
  let mounted;
  let dispose;
  add_render_callback(
    /*onwindowresize*/
    ctx[24]
  );
  let if_block = !/*autoSelect*/
  ctx[0].disableModals && create_if_block$2(ctx);
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current2 = true;
      if (!mounted) {
        dispose = listen(
          window,
          "resize",
          /*onwindowresize*/
          ctx[24]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (!/*autoSelect*/
      ctx2[0].disableModals) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty[0] & /*autoSelect*/
          1) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$2(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current2)
        return;
      transition_in(if_block);
      current2 = true;
    },
    o(local) {
      transition_out(if_block);
      current2 = false;
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
      mounted = false;
      dispose();
    }
  };
}
function instance$4($$self, $$props, $$invalidate) {
  let availableWallets;
  let displayConnectingWallet;
  let $appMetadata$;
  let $modalStep$;
  let $_;
  component_subscribe($$self, $format, ($$value) => $$invalidate(14, $_ = $$value));
  let { autoSelect } = $$props;
  const appMetadata$ = state$1.select("appMetadata").pipe(startWith$2(state$1.get().appMetadata), shareReplay$2(1));
  component_subscribe($$self, appMetadata$, (value) => $$invalidate(13, $appMetadata$ = value));
  const { unstoppableResolution, device } = configuration;
  const { walletModules, connect: connect2, chains: chains2 } = state$1.get();
  const cancelPreviousConnect$ = new Subject();
  let connectionRejected = false;
  let previousConnectionRequest = false;
  let wallets2 = [];
  let selectedWallet;
  let agreed;
  let connectingWalletLabel;
  let connectingErrorMessage;
  let windowWidth;
  let scrollContainer;
  const modalStep$ = new BehaviorSubject("selectingWallet");
  component_subscribe($$self, modalStep$, (value) => $$invalidate(5, $modalStep$ = value));
  connectWallet$.pipe(distinctUntilChanged((prev, curr) => prev.autoSelect && curr.autoSelect && prev.autoSelect.disableModals === curr.autoSelect.disableModals), filter$1(({ autoSelect: autoSelect2 }) => autoSelect2 && autoSelect2.disableModals === false), takeUntil$1(onDestroy$)).subscribe(() => {
    selectedWallet && connectWallet();
  });
  async function selectWallet({ label, icon, getInterface }) {
    $$invalidate(8, connectingWalletLabel = label);
    try {
      const existingWallet = state$1.get().wallets.find((wallet2) => wallet2.label === label);
      if (existingWallet) {
        addWallet(existingWallet);
        setTimeout(() => setStep("connectedWallet"), 1);
        $$invalidate(3, selectedWallet = existingWallet);
        return;
      }
      const { chains: chains3 } = state$1.get();
      const { provider, instance: instance2 } = await getInterface({
        chains: chains3,
        BigNumber: BigNumber$1,
        EventEmitter,
        appMetadata: $appMetadata$
      });
      const loadedIcon = await icon;
      $$invalidate(3, selectedWallet = {
        label,
        icon: loadedIcon,
        provider,
        instance: instance2,
        accounts: [],
        chains: [{ namespace: "evm", id: "0x1" }]
      });
      $$invalidate(9, connectingErrorMessage = "");
      scrollToTop();
      setTimeout(() => setStep("connectingWallet"), 1);
    } catch (error) {
      const { message } = error;
      $$invalidate(9, connectingErrorMessage = message);
      $$invalidate(8, connectingWalletLabel = "");
      scrollToTop();
    }
  }
  function deselectWallet() {
    $$invalidate(3, selectedWallet = null);
  }
  function updateSelectedWallet(update2) {
    $$invalidate(3, selectedWallet = { ...selectedWallet, ...update2 });
  }
  async function autoSelectWallet(wallet2) {
    const { getIcon, getInterface, label } = wallet2;
    const icon = getIcon();
    selectWallet({ label, icon, getInterface });
  }
  async function loadWalletsForSelection() {
    $$invalidate(2, wallets2 = walletModules.map(({ getIcon, getInterface, label }) => {
      return { label, icon: getIcon(), getInterface };
    }));
  }
  function close() {
    connectWallet$.next({ inProgress: false });
  }
  async function connectWallet() {
    $$invalidate(1, connectionRejected = false);
    const { provider, label } = selectedWallet;
    cancelPreviousConnect$.next();
    try {
      const [address] = await Promise.race([
        // resolved account
        requestAccounts(provider),
        // or connect wallet is called again whilst waiting for response
        firstValueFrom(cancelPreviousConnect$.pipe(mapTo([])))
      ]);
      if (!address) {
        return;
      }
      if (state$1.get().connect.autoConnectLastWallet || state$1.get().connect.autoConnectAllPreviousWallet) {
        let labelsList = getLocalStore(STORAGE_KEYS.LAST_CONNECTED_WALLET);
        try {
          let labelsListParsed = JSON.parse(labelsList);
          if (labelsListParsed && Array.isArray(labelsListParsed)) {
            const tempLabels = labelsListParsed;
            labelsList = [.../* @__PURE__ */ new Set([label, ...tempLabels])];
          }
        } catch (err) {
          if (err instanceof SyntaxError && labelsList && typeof labelsList === "string") {
            const tempLabel = labelsList;
            labelsList = [tempLabel];
          } else {
            throw new Error(err);
          }
        }
        if (!labelsList)
          labelsList = [label];
        setLocalStore(STORAGE_KEYS.LAST_CONNECTED_WALLET, JSON.stringify(labelsList));
      }
      const chain = await getChainId(provider);
      if (state$1.get().notify.enabled) {
        const sdk = await getBNMulitChainSdk();
        if (sdk) {
          try {
            sdk.subscribe({
              id: address,
              chainId: chain,
              type: "account"
            });
          } catch (error) {
          }
        }
      }
      const update2 = {
        accounts: [
          {
            address,
            ens: null,
            uns: null,
            balance: null
          }
        ],
        chains: [{ namespace: "evm", id: chain }]
      };
      addWallet({ ...selectedWallet, ...update2 });
      trackWallet(provider, label);
      updateSelectedWallet(update2);
      setStep("connectedWallet");
      scrollToTop();
    } catch (error) {
      const { code } = error;
      scrollToTop();
      if (code === ProviderRpcErrorCode.ACCOUNT_ACCESS_REJECTED) {
        $$invalidate(1, connectionRejected = true);
        if (autoSelect.disableModals) {
          connectWallet$.next({ inProgress: false });
        } else if (autoSelect.label) {
          $$invalidate(0, autoSelect.label = "", autoSelect);
        }
        return;
      }
      if (code === ProviderRpcErrorCode.ACCOUNT_ACCESS_ALREADY_REQUESTED) {
        $$invalidate(6, previousConnectionRequest = true);
        if (autoSelect.disableModals) {
          connectWallet$.next({ inProgress: false });
          return;
        }
        listenAccountsChanged({
          provider: selectedWallet.provider,
          disconnected$: connectWallet$.pipe(filter$1(({ inProgress }) => !inProgress), mapTo(""))
        }).pipe(take$1(1)).subscribe(([account2]) => {
          account2 && connectWallet();
        });
        return;
      }
    }
  }
  async function updateAccountDetails() {
    const { accounts: accounts2, chains: selectedWalletChains } = selectedWallet;
    const appChains = state$1.get().chains;
    const [connectedWalletChain] = selectedWalletChains;
    const appChain = appChains.find(({ namespace, id }) => namespace === connectedWalletChain.namespace && id === connectedWalletChain.id);
    const { address } = accounts2[0];
    let { balance: balance2, ens: ens2, uns: uns2, secondaryTokens: secondaryTokens2 } = accounts2[0];
    if (balance2 === null) {
      getBalance(address, appChain).then((balance3) => {
        updateAccount(selectedWallet.label, address, { balance: balance3 });
      });
    }
    if (appChain && !secondaryTokens2 && Array.isArray(appChain.secondaryTokens) && appChain.secondaryTokens.length) {
      updateSecondaryTokens(selectedWallet, address, appChain).then((secondaryTokens3) => {
        updateAccount(selectedWallet.label, address, { secondaryTokens: secondaryTokens3 });
      });
    }
    if (ens2 === null && validEnsChain(connectedWalletChain.id)) {
      const ensChain = chains2.find(({ id }) => id === validEnsChain(connectedWalletChain.id));
      getEns(address, ensChain).then((ens3) => {
        updateAccount(selectedWallet.label, address, { ens: ens3 });
      });
    }
    if (uns2 === null && unstoppableResolution) {
      getUns(address, appChain).then((uns3) => {
        updateAccount(selectedWallet.label, address, { uns: uns3 });
      });
    }
    setTimeout(() => connectWallet$.next({ inProgress: false }), 1500);
  }
  modalStep$.pipe(takeUntil$1(onDestroy$)).subscribe((step) => {
    switch (step) {
      case "selectingWallet": {
        if (autoSelect.label) {
          const walletToAutoSelect = walletModules.find(({ label }) => label.toLowerCase() === autoSelect.label.toLowerCase());
          if (walletToAutoSelect) {
            autoSelectWallet(walletToAutoSelect);
          } else if (autoSelect.disableModals) {
            connectWallet$.next({ inProgress: false });
          }
        } else {
          $$invalidate(8, connectingWalletLabel = "");
          loadWalletsForSelection();
        }
        break;
      }
      case "connectingWallet": {
        connectWallet();
        break;
      }
      case "connectedWallet": {
        $$invalidate(8, connectingWalletLabel = "");
        updateAccountDetails();
        break;
      }
    }
  });
  function setStep(update2) {
    cancelPreviousConnect$.next();
    modalStep$.next(update2);
  }
  function scrollToTop() {
    scrollContainer && scrollContainer.scrollTo(0, 0);
  }
  const isSafariMobile = device.type === "mobile" && device.browser.name && device.browser.name === "Safari";
  function onwindowresize() {
    $$invalidate(4, windowWidth = window.innerWidth);
  }
  function agreement_agreed_binding(value) {
    agreed = value;
    $$invalidate(7, agreed);
  }
  function div0_binding($$value) {
    binding_callbacks[$$value ? "unshift" : "push"](() => {
      scrollContainer = $$value;
      $$invalidate(10, scrollContainer);
    });
  }
  $$self.$$set = ($$props2) => {
    if ("autoSelect" in $$props2)
      $$invalidate(0, autoSelect = $$props2.autoSelect);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty[0] & /*wallets*/
    4) {
      $$invalidate(12, availableWallets = wallets2.length - state$1.get().wallets.length);
    }
    if ($$self.$$.dirty[0] & /*$modalStep$, selectedWallet, windowWidth, connectionRejected*/
    58) {
      $$invalidate(11, displayConnectingWallet = $modalStep$ === "connectingWallet" && selectedWallet && windowWidth >= MOBILE_WINDOW_WIDTH || windowWidth <= MOBILE_WINDOW_WIDTH && connectionRejected && $modalStep$ === "connectingWallet" && selectedWallet);
    }
  };
  return [
    autoSelect,
    connectionRejected,
    wallets2,
    selectedWallet,
    windowWidth,
    $modalStep$,
    previousConnectionRequest,
    agreed,
    connectingWalletLabel,
    connectingErrorMessage,
    scrollContainer,
    displayConnectingWallet,
    availableWallets,
    $appMetadata$,
    $_,
    appMetadata$,
    connect2,
    modalStep$,
    selectWallet,
    deselectWallet,
    close,
    connectWallet,
    setStep,
    isSafariMobile,
    onwindowresize,
    agreement_agreed_binding,
    div0_binding
  ];
}
class Index$1 extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(this, options2, instance$4, create_fragment$4, safe_not_equal, { autoSelect: 0 }, add_css$4, [-1, -1]);
  }
}
function add_css$3(target) {
  append_styles(target, "svelte-12yam41", ".container.svelte-12yam41{padding:var(--onboard-spacing-4, var(--spacing-4));font-family:var(--onboard-font-family-normal, var(--font-family-normal));line-height:16px;font-size:var(--onboard-font-size-5, var(--font-size-5))}.close.svelte-12yam41{top:var(--onboard-spacing-5, var(--spacing-5));right:var(--onboard-spacing-5, var(--spacing-5));padding:0.5rem}h4.svelte-12yam41{font-size:var(--onboard-font-size-3, var(--font-size-3));margin:var(--onboard-spacing-4, var(--spacing-4)) 0}p.svelte-12yam41{margin:0 0 var(--onboard-spacing-4, var(--spacing-4)) 0;max-width:488px}");
}
function create_default_slot$1(ctx) {
  let div1;
  let h4;
  let t0_value = (
    /*$_*/
    ctx[0]("modals.switchChain.heading", { default: en.modals.switchChain.heading }) + ""
  );
  let t0;
  let t1;
  let p0;
  let t2_value = (
    /*$_*/
    ctx[0]("modals.switchChain.paragraph1", {
      default: en.modals.switchChain.paragraph1,
      values: {
        app: (
          /*$appMetadata$*/
          ctx[1] && /*$appMetadata$*/
          ctx[1].name || "This app"
        ),
        nextNetworkName: (
          /*nextNetworkName*/
          ctx[2]
        )
      }
    }) + ""
  );
  let t2;
  let t3;
  let p1;
  let t4_value = (
    /*$_*/
    ctx[0]("modals.switchChain.paragraph2", {
      default: en.modals.switchChain.paragraph2
    }) + ""
  );
  let t4;
  let t5;
  let div0;
  let closebutton;
  let current2;
  let mounted;
  let dispose;
  closebutton = new CloseButton({});
  return {
    c() {
      div1 = element("div");
      h4 = element("h4");
      t0 = text(t0_value);
      t1 = space();
      p0 = element("p");
      t2 = text(t2_value);
      t3 = space();
      p1 = element("p");
      t4 = text(t4_value);
      t5 = space();
      div0 = element("div");
      create_component(closebutton.$$.fragment);
      attr(h4, "class", "svelte-12yam41");
      attr(p0, "class", "svelte-12yam41");
      attr(p1, "class", "svelte-12yam41");
      attr(div0, "class", "close absolute svelte-12yam41");
      attr(div1, "class", "container relative svelte-12yam41");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, h4);
      append(h4, t0);
      append(div1, t1);
      append(div1, p0);
      append(p0, t2);
      append(div1, t3);
      append(div1, p1);
      append(p1, t4);
      append(div1, t5);
      append(div1, div0);
      mount_component(closebutton, div0, null);
      current2 = true;
      if (!mounted) {
        dispose = listen(
          div0,
          "click",
          /*close*/
          ctx[3]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if ((!current2 || dirty & /*$_*/
      1) && t0_value !== (t0_value = /*$_*/
      ctx2[0]("modals.switchChain.heading", { default: en.modals.switchChain.heading }) + ""))
        set_data(t0, t0_value);
      if ((!current2 || dirty & /*$_, $appMetadata$*/
      3) && t2_value !== (t2_value = /*$_*/
      ctx2[0]("modals.switchChain.paragraph1", {
        default: en.modals.switchChain.paragraph1,
        values: {
          app: (
            /*$appMetadata$*/
            ctx2[1] && /*$appMetadata$*/
            ctx2[1].name || "This app"
          ),
          nextNetworkName: (
            /*nextNetworkName*/
            ctx2[2]
          )
        }
      }) + ""))
        set_data(t2, t2_value);
      if ((!current2 || dirty & /*$_*/
      1) && t4_value !== (t4_value = /*$_*/
      ctx2[0]("modals.switchChain.paragraph2", {
        default: en.modals.switchChain.paragraph2
      }) + ""))
        set_data(t4, t4_value);
    },
    i(local) {
      if (current2)
        return;
      transition_in(closebutton.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(closebutton.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div1);
      destroy_component(closebutton);
      mounted = false;
      dispose();
    }
  };
}
function create_fragment$3(ctx) {
  let modal;
  let current2;
  modal = new Modal({
    props: {
      close: (
        /*close*/
        ctx[3]
      ),
      $$slots: { default: [create_default_slot$1] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(modal.$$.fragment);
    },
    m(target, anchor) {
      mount_component(modal, target, anchor);
      current2 = true;
    },
    p(ctx2, [dirty]) {
      const modal_changes = {};
      if (dirty & /*$$scope, $_, $appMetadata$*/
      67) {
        modal_changes.$$scope = { dirty, ctx: ctx2 };
      }
      modal.$set(modal_changes);
    },
    i(local) {
      if (current2)
        return;
      transition_in(modal.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(modal.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      destroy_component(modal, detaching);
    }
  };
}
function instance$3($$self, $$props, $$invalidate) {
  let $switchChainModal$;
  let $_;
  let $appMetadata$;
  component_subscribe($$self, switchChainModal$, ($$value) => $$invalidate(5, $switchChainModal$ = $$value));
  component_subscribe($$self, $format, ($$value) => $$invalidate(0, $_ = $$value));
  const nextNetworkName = $switchChainModal$.chain.label;
  function close() {
    switchChainModal$.next(null);
  }
  const appMetadata$ = state.select("appMetadata").pipe(startWith(state.get().appMetadata), shareReplay(1));
  component_subscribe($$self, appMetadata$, (value) => $$invalidate(1, $appMetadata$ = value));
  return [$_, $appMetadata$, nextNetworkName, close, appMetadata$];
}
class SwitchChain extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(this, options2, instance$3, create_fragment$3, safe_not_equal, {}, add_css$3);
  }
}
function add_css$2(target) {
  append_styles(target, "svelte-z54y2j", ".icon.svelte-z54y2j{border-radius:50px;color:var(--onboard-primary-500, var(--primary-500))}");
}
function create_fragment$2(ctx) {
  let div;
  let div_style_value;
  return {
    c() {
      div = element("div");
      attr(div, "class", "icon flex svelte-z54y2j");
      attr(div, "style", div_style_value = `width: ${/*size*/
      ctx[0]}px; height: ${/*size*/
      ctx[0]}px;`);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      div.innerHTML = infoIcon;
    },
    p(ctx2, [dirty]) {
      if (dirty & /*size*/
      1 && div_style_value !== (div_style_value = `width: ${/*size*/
      ctx2[0]}px; height: ${/*size*/
      ctx2[0]}px;`)) {
        attr(div, "style", div_style_value);
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function instance$2($$self, $$props, $$invalidate) {
  let { size = 20 } = $$props;
  $$self.$$set = ($$props2) => {
    if ("size" in $$props2)
      $$invalidate(0, size = $$props2.size);
  };
  return [size];
}
class InfoIcon extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(this, options2, instance$2, create_fragment$2, safe_not_equal, { size: 0 }, add_css$2);
  }
}
function add_css$1(target) {
  append_styles(target, "svelte-20hjq1", ".content.svelte-20hjq1{padding:1rem;width:300px;font-family:var(--onboard-font-family-normal, var(--font-family-normal));font-size:var(--onboard-font-size-5, var(--font-size-5));line-height:24px;background:var(\n      --onboard-action-required-modal-background,\n      var(--onboard-white, var(--white))\n    )}.icon-container.svelte-20hjq1{width:3rem;height:3rem;background:var(--onboard-primary-100, var(--primary-100));border-radius:24px}h4.svelte-20hjq1{margin:1.5rem 0 0.5rem 0;font-weight:600}.action-required-heading.svelte-20hjq1,.action-required-info.svelte-20hjq1{color:var(\n      --onboard-action-required-text-color,\n      var(--onboard-black, inherit)\n    )}.action-required-btn.svelte-20hjq1{color:var(\n      --onboard-action-required-btn-text-color,\n      var(--onboard-black, inherit)\n    )}p.svelte-20hjq1{margin:0;font-weight:400}a.svelte-20hjq1{font-weight:600}button.svelte-20hjq1{margin-top:1.5rem;font-weight:600}");
}
function create_if_block$1(ctx) {
  let a;
  let t_value = (
    /*$_*/
    ctx[1]("modals.actionRequired.linkText", { values: { wallet: (
      /*wallet*/
      ctx[0]
    ) } }) + ""
  );
  let t;
  return {
    c() {
      a = element("a");
      t = text(t_value);
      attr(a, "href", "https://metamask.zendesk.com/hc/en-us/articles/360061346311-Switching-accounts-in-MetaMask");
      attr(a, "target", "_blank");
      attr(a, "rel", "noreferrer noopener");
      attr(a, "class", "svelte-20hjq1");
    },
    m(target, anchor) {
      insert(target, a, anchor);
      append(a, t);
    },
    p(ctx2, dirty) {
      if (dirty & /*$_, wallet*/
      3 && t_value !== (t_value = /*$_*/
      ctx2[1]("modals.actionRequired.linkText", { values: { wallet: (
        /*wallet*/
        ctx2[0]
      ) } }) + ""))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching)
        detach(a);
    }
  };
}
function create_default_slot(ctx) {
  let div1;
  let div0;
  let infoicon;
  let t0;
  let h4;
  let t1_value = (
    /*$_*/
    ctx[1]("modals.actionRequired.heading", { values: { wallet: (
      /*wallet*/
      ctx[0]
    ) } }) + ""
  );
  let t1;
  let t2;
  let p;
  let t3_value = (
    /*$_*/
    ctx[1]("modals.actionRequired.paragraph", { values: { wallet: (
      /*wallet*/
      ctx[0]
    ) } }) + ""
  );
  let t3;
  let t4;
  let t5;
  let button;
  let t6_value = (
    /*$_*/
    ctx[1]("modals.actionRequired.buttonText") + ""
  );
  let t6;
  let current2;
  let mounted;
  let dispose;
  infoicon = new InfoIcon({});
  let if_block = (
    /*wallet*/
    ctx[0] === "MetaMask" && create_if_block$1(ctx)
  );
  return {
    c() {
      div1 = element("div");
      div0 = element("div");
      create_component(infoicon.$$.fragment);
      t0 = space();
      h4 = element("h4");
      t1 = text(t1_value);
      t2 = space();
      p = element("p");
      t3 = text(t3_value);
      t4 = space();
      if (if_block)
        if_block.c();
      t5 = space();
      button = element("button");
      t6 = text(t6_value);
      attr(div0, "class", "icon-container flex justify-center items-center svelte-20hjq1");
      attr(h4, "class", "action-required-heading svelte-20hjq1");
      attr(p, "class", "action-required-info svelte-20hjq1");
      attr(button, "class", "button-neutral-solid rounded action-required-btn svelte-20hjq1");
      attr(div1, "class", "content svelte-20hjq1");
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      mount_component(infoicon, div0, null);
      append(div1, t0);
      append(div1, h4);
      append(h4, t1);
      append(div1, t2);
      append(div1, p);
      append(p, t3);
      append(p, t4);
      if (if_block)
        if_block.m(p, null);
      append(div1, t5);
      append(div1, button);
      append(button, t6);
      current2 = true;
      if (!mounted) {
        dispose = listen(
          button,
          "click",
          /*close*/
          ctx[2]
        );
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if ((!current2 || dirty & /*$_, wallet*/
      3) && t1_value !== (t1_value = /*$_*/
      ctx2[1]("modals.actionRequired.heading", { values: { wallet: (
        /*wallet*/
        ctx2[0]
      ) } }) + ""))
        set_data(t1, t1_value);
      if ((!current2 || dirty & /*$_, wallet*/
      3) && t3_value !== (t3_value = /*$_*/
      ctx2[1]("modals.actionRequired.paragraph", { values: { wallet: (
        /*wallet*/
        ctx2[0]
      ) } }) + ""))
        set_data(t3, t3_value);
      if (
        /*wallet*/
        ctx2[0] === "MetaMask"
      ) {
        if (if_block) {
          if_block.p(ctx2, dirty);
        } else {
          if_block = create_if_block$1(ctx2);
          if_block.c();
          if_block.m(p, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
      if ((!current2 || dirty & /*$_*/
      2) && t6_value !== (t6_value = /*$_*/
      ctx2[1]("modals.actionRequired.buttonText") + ""))
        set_data(t6, t6_value);
    },
    i(local) {
      if (current2)
        return;
      transition_in(infoicon.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(infoicon.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div1);
      destroy_component(infoicon);
      if (if_block)
        if_block.d();
      mounted = false;
      dispose();
    }
  };
}
function create_fragment$1(ctx) {
  let modal;
  let current2;
  modal = new Modal({
    props: {
      close: (
        /*close*/
        ctx[2]
      ),
      $$slots: { default: [create_default_slot] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(modal.$$.fragment);
    },
    m(target, anchor) {
      mount_component(modal, target, anchor);
      current2 = true;
    },
    p(ctx2, [dirty]) {
      const modal_changes = {};
      if (dirty & /*$$scope, $_, wallet*/
      11) {
        modal_changes.$$scope = { dirty, ctx: ctx2 };
      }
      modal.$set(modal_changes);
    },
    i(local) {
      if (current2)
        return;
      transition_in(modal.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(modal.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      destroy_component(modal, detaching);
    }
  };
}
function instance$1($$self, $$props, $$invalidate) {
  let $_;
  component_subscribe($$self, $format, ($$value) => $$invalidate(1, $_ = $$value));
  let { wallet: wallet2 } = $$props;
  function close() {
    connectWallet$.next({ inProgress: false, actionRequired: "" });
  }
  $$self.$$set = ($$props2) => {
    if ("wallet" in $$props2)
      $$invalidate(0, wallet2 = $$props2.wallet);
  };
  return [wallet2, $_, close];
}
class ActionRequired extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(this, options2, instance$1, create_fragment$1, safe_not_equal, { wallet: 0 }, add_css$1);
  }
}
function add_css(target) {
  append_styles(target, "svelte-g9s19b", `.flex{display:flex}.inline-flex{display:inline-flex}.flex-column{flex-direction:column}.items-center{align-items:center}.items-end{align-items:flex-end}.items-start{align-items:flex-start}.justify-center{justify-content:center}.justify-start{justify-content:flex-start}.justify-between{justify-content:space-between}.justify-end{justify-content:flex-end}.justify-around{justify-content:space-around}.relative{position:relative}.absolute{position:absolute}.fixed{position:fixed}.pointer{cursor:pointer}.shadow-1{box-shadow:var(--onboard-shadow-1, var(--shadow-1))}.w-100{width:100%}*{box-sizing:border-box}input{background:var(--onboard-white, var(--white))}input{width:100%;padding:0.5rem 1rem;outline:2px solid var(--onboard-gray-200, var(--gray-200));border:none;border-radius:8px;font-size:1rem;line-height:1.5;color:var(--onboard-gray-600, var(--gray-600));transition:all 200ms ease-in-out}input[type='checkbox']{-webkit-appearance:none;width:auto;background:var(--onboard-white, var(--white));outline:1px solid var(--onboard-gray-300, var(--gray-300));border:none;padding:0.5em;border-radius:3px;display:flex;justify-content:center;align-items:center;position:relative;cursor:pointer}input[type='checkbox']:hover{border-color:var(
      --onboard-checkbox-background,
      var(--onboard-primary-500, var(--primary-500))
    )}input[type='checkbox']:checked{background:var(
      --onboard-checkbox-background,
      var(--onboard-primary-500, var(--primary-500))
    );border-color:var(
      --onboard-checkbox-background,
      var(--onboard-primary-500, var(--primary-500))
    );color:var(--onboard-checkbox-color, var(--onboard-white, var(--white)))}input[type='checkbox']:checked:after{content:url("data:image/svg+xml,%3Csvg width='0.885em' height='0.6em' viewBox='0 0 14 11' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M0 6L5 11L14 2L12.59 0.58L5 8.17L1.41 4.59L0 6Z' fill='white'/%3E%3C/svg%3E");font-size:12px;position:absolute;color:var(--onboard-checkbox-color, var(--onboard-white, var(--white)))}input:hover{border-color:var(
      --onboard-checkbox-color,
      var(--onboard-white, var(--white))
    )}input:focus{border-color:var(--onboard-primary-500, var(--primary-500));box-shadow:0 0 1px 1px
      var(
        --onboard-checkbox-background,
        var(--onboard-primary-500, var(--primary-500))
      );box-shadow:0 0 0 1px -moz-mac-focusring}input:disabled, textarea:disabled, select:disabled{background:var(--gray-100)}input::-moz-focus-inner{outline:0;padding:0;margin-top:-2px;margin-bottom:-2px}a{color:var(
      --onboard-link-color,
      var(--onboard-primary-500, var(--primary-500))
    );text-decoration:none}a:hover{text-decoration:underline}button{display:flex;align-items:center;justify-content:center;padding:calc(var(--onboard-spacing-4, var(--spacing-4)) - 1px);border-radius:24px;cursor:pointer;font:inherit;border:none;transition:background-color 150ms ease-in-out, color 150ms ease-in-out}.onboard-button-primary{background:var(--onboard-white, var(--white));padding:calc(var(--onboard-spacing-5, var(--spacing-5)) - 1px)
      calc(var(--onboard-spacing-4, var(--spacing-4)) - 1px);color:var(--onboard-gray-500, var(--gray-500));font-size:var(--onboard-font-size-6, var(--font-size-6));line-height:var(--onboard-font-line-height-3, var(--font-line-height-3));border:1px solid var(--onboard-gray-500, var(--gray-500));font-weight:600}.button-neutral-solid{width:100%;border-radius:8px;background:var(--onboard-gray-500, var(--gray-500));color:var(--onboard-white, var(--white));line-height:var(--onboard-font-line-height-3, var(--font-line-height-3))}.button-neutral-solid-b{width:100%;background:var(--onboard-gray-100, var(--gray-100));color:var(--onboard-gray-500, var(--gray-500));line-height:var(--onboard-font-line-height-3, var(--font-line-height-3))}button.rounded{border-radius:24px}.button-neutral-solid:hover{background:var(--onboard-gray-700, var(--gray-700))}.button-neutral-solid-b:hover{background:var(--onboard-gray-200, var(--gray-200))}.button-neutral-solid:active{color:var(--onboard-gray-300, var(--gray-300))}.button-neutral-solid-b:active{color:var(--onboard-gray-600, var(--gray-600));background:var(--onboard-gray-300, var(--gray-300))}.container.svelte-g9s19b{padding:16px;font-family:var(--onboard-font-family-normal, var(--font-family-normal));pointer-events:none;touch-action:none;width:100%}.z-indexed.svelte-g9s19b{z-index:var(--account-center-z-index)}@media all and (min-width: 428px){.container.svelte-g9s19b{max-width:348px}}`);
}
function create_if_block_20(ctx) {
  let connect2;
  let current2;
  connect2 = new Index$1({
    props: {
      autoSelect: (
        /*$connectWallet$*/
        ctx[8].autoSelect
      )
    }
  });
  return {
    c() {
      create_component(connect2.$$.fragment);
    },
    m(target, anchor) {
      mount_component(connect2, target, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      const connect_changes = {};
      if (dirty & /*$connectWallet$*/
      256)
        connect_changes.autoSelect = /*$connectWallet$*/
        ctx2[8].autoSelect;
      connect2.$set(connect_changes);
    },
    i(local) {
      if (current2)
        return;
      transition_in(connect2.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(connect2.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      destroy_component(connect2, detaching);
    }
  };
}
function create_if_block_19(ctx) {
  let actionrequired;
  let current2;
  actionrequired = new ActionRequired({
    props: {
      wallet: (
        /*$connectWallet$*/
        ctx[8].actionRequired
      )
    }
  });
  return {
    c() {
      create_component(actionrequired.$$.fragment);
    },
    m(target, anchor) {
      mount_component(actionrequired, target, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      const actionrequired_changes = {};
      if (dirty & /*$connectWallet$*/
      256)
        actionrequired_changes.wallet = /*$connectWallet$*/
        ctx2[8].actionRequired;
      actionrequired.$set(actionrequired_changes);
    },
    i(local) {
      if (current2)
        return;
      transition_in(actionrequired.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(actionrequired.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      destroy_component(actionrequired, detaching);
    }
  };
}
function create_if_block_18(ctx) {
  let switchchain;
  let current2;
  switchchain = new SwitchChain({});
  return {
    c() {
      create_component(switchchain.$$.fragment);
    },
    m(target, anchor) {
      mount_component(switchchain, target, anchor);
      current2 = true;
    },
    i(local) {
      if (current2)
        return;
      transition_in(switchchain.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      transition_out(switchchain.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      destroy_component(switchchain, detaching);
    }
  };
}
function create_if_block_17(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      attr(div, "class", "container flex flex-column fixed z-indexed svelte-g9s19b");
      attr(div, "style", "top: 0; right: 0; " + /*device*/
      (ctx[11].type === "mobile" ? "padding-bottom: 0;" : ""));
      attr(div, "id", "w3o-transaction-preview-container");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_if_block_9(ctx) {
  let div1;
  let show_if_3 = (
    /*$notify$*/
    ctx[3].position.includes("bottom") && /*$accountCenter$*/
    ctx[1].position.includes("bottom") && /*samePositionOrMobile*/
    ctx[7]
  );
  let t0;
  let show_if_2 = (
    /*$accountCenter$*/
    ctx[1].position.includes("bottom")
  );
  let t1;
  let div0;
  let t2;
  let show_if_1 = (
    /*$accountCenter$*/
    ctx[1].position.includes("top")
  );
  let t3;
  let show_if = (
    /*$notify$*/
    ctx[3].position.includes("top") && /*$accountCenter$*/
    ctx[1].position.includes("top") && /*samePositionOrMobile*/
    ctx[7]
  );
  let div1_style_value;
  let current2;
  let if_block0 = show_if_3 && create_if_block_15(ctx);
  let if_block1 = show_if_2 && create_if_block_14();
  let info = {
    ctx,
    current: null,
    token: null,
    hasCatch: false,
    pending: create_pending_block_3,
    then: create_then_block_3,
    catch: create_catch_block_3,
    value: 23,
    blocks: [, , ,]
  };
  handle_promise(
    /*accountCenterComponent*/
    ctx[16],
    info
  );
  let if_block2 = show_if_1 && create_if_block_12();
  let if_block3 = show_if && create_if_block_10(ctx);
  return {
    c() {
      div1 = element("div");
      if (if_block0)
        if_block0.c();
      t0 = space();
      if (if_block1)
        if_block1.c();
      t1 = space();
      div0 = element("div");
      info.block.c();
      t2 = space();
      if (if_block2)
        if_block2.c();
      t3 = space();
      if (if_block3)
        if_block3.c();
      attr(div0, "id", "account-center-with-notify");
      attr(div1, "class", "container flex flex-column fixed z-indexed svelte-g9s19b");
      attr(div1, "style", div1_style_value = /*setPositioningDefaults*/
      ctx[15](accountCenterPositioning)[
        /*$accountCenter$*/
        ctx[1].position
      ] + "; " + /*device*/
      (ctx[11].type === "mobile" && /*$accountCenter$*/
      ctx[1].position.includes("top") ? "padding-bottom: 0;" : (
        /*device*/
        ctx[11].type === "mobile" && /*$accountCenter$*/
        ctx[1].position.includes("bottom") ? "padding-top:0;" : ""
      )));
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      if (if_block0)
        if_block0.m(div1, null);
      append(div1, t0);
      if (if_block1)
        if_block1.m(div1, null);
      append(div1, t1);
      append(div1, div0);
      info.block.m(div0, info.anchor = null);
      info.mount = () => div0;
      info.anchor = null;
      append(div1, t2);
      if (if_block2)
        if_block2.m(div1, null);
      append(div1, t3);
      if (if_block3)
        if_block3.m(div1, null);
      current2 = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty & /*$notify$, $accountCenter$, samePositionOrMobile*/
      138)
        show_if_3 = /*$notify$*/
        ctx[3].position.includes("bottom") && /*$accountCenter$*/
        ctx[1].position.includes("bottom") && /*samePositionOrMobile*/
        ctx[7];
      if (show_if_3) {
        if (if_block0) {
          if_block0.p(ctx, dirty);
          if (dirty & /*$notify$, $accountCenter$, samePositionOrMobile*/
          138) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_15(ctx);
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(div1, t0);
        }
      } else if (if_block0) {
        group_outros();
        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });
        check_outros();
      }
      if (dirty & /*$accountCenter$*/
      2)
        show_if_2 = /*$accountCenter$*/
        ctx[1].position.includes("bottom");
      if (show_if_2) {
        if (if_block1)
          ;
        else {
          if_block1 = create_if_block_14();
          if_block1.c();
          if_block1.m(div1, t1);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      update_await_block_branch(info, ctx, dirty);
      if (dirty & /*$accountCenter$*/
      2)
        show_if_1 = /*$accountCenter$*/
        ctx[1].position.includes("top");
      if (show_if_1) {
        if (if_block2)
          ;
        else {
          if_block2 = create_if_block_12();
          if_block2.c();
          if_block2.m(div1, t3);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
      if (dirty & /*$notify$, $accountCenter$, samePositionOrMobile*/
      138)
        show_if = /*$notify$*/
        ctx[3].position.includes("top") && /*$accountCenter$*/
        ctx[1].position.includes("top") && /*samePositionOrMobile*/
        ctx[7];
      if (show_if) {
        if (if_block3) {
          if_block3.p(ctx, dirty);
          if (dirty & /*$notify$, $accountCenter$, samePositionOrMobile*/
          138) {
            transition_in(if_block3, 1);
          }
        } else {
          if_block3 = create_if_block_10(ctx);
          if_block3.c();
          transition_in(if_block3, 1);
          if_block3.m(div1, null);
        }
      } else if (if_block3) {
        group_outros();
        transition_out(if_block3, 1, 1, () => {
          if_block3 = null;
        });
        check_outros();
      }
      if (!current2 || dirty & /*$accountCenter$*/
      2 && div1_style_value !== (div1_style_value = /*setPositioningDefaults*/
      ctx[15](accountCenterPositioning)[
        /*$accountCenter$*/
        ctx[1].position
      ] + "; " + /*device*/
      (ctx[11].type === "mobile" && /*$accountCenter$*/
      ctx[1].position.includes("top") ? "padding-bottom: 0;" : (
        /*device*/
        ctx[11].type === "mobile" && /*$accountCenter$*/
        ctx[1].position.includes("bottom") ? "padding-top:0;" : ""
      )))) {
        attr(div1, "style", div1_style_value);
      }
    },
    i(local) {
      if (current2)
        return;
      transition_in(if_block0);
      transition_in(info.block);
      transition_in(if_block3);
      current2 = true;
    },
    o(local) {
      transition_out(if_block0);
      for (let i = 0; i < 3; i += 1) {
        const block = info.blocks[i];
        transition_out(block);
      }
      transition_out(if_block3);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div1);
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
      info.block.d();
      info.token = null;
      info = null;
      if (if_block2)
        if_block2.d();
      if (if_block3)
        if_block3.d();
    }
  };
}
function create_if_block_15(ctx) {
  let await_block_anchor;
  let current2;
  let info = {
    ctx,
    current: null,
    token: null,
    hasCatch: false,
    pending: create_pending_block_4,
    then: create_then_block_4,
    catch: create_catch_block_4,
    value: 22,
    blocks: [, , ,]
  };
  handle_promise(
    /*notifyComponent*/
    ctx[17],
    info
  );
  return {
    c() {
      await_block_anchor = empty();
      info.block.c();
    },
    m(target, anchor) {
      insert(target, await_block_anchor, anchor);
      info.block.m(target, info.anchor = anchor);
      info.mount = () => await_block_anchor.parentNode;
      info.anchor = await_block_anchor;
      current2 = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      update_await_block_branch(info, ctx, dirty);
    },
    i(local) {
      if (current2)
        return;
      transition_in(info.block);
      current2 = true;
    },
    o(local) {
      for (let i = 0; i < 3; i += 1) {
        const block = info.blocks[i];
        transition_out(block);
      }
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(await_block_anchor);
      info.block.d(detaching);
      info.token = null;
      info = null;
    }
  };
}
function create_catch_block_4(ctx) {
  return {
    c: noop,
    m: noop,
    p: noop,
    i: noop,
    o: noop,
    d: noop
  };
}
function create_then_block_4(ctx) {
  let if_block_anchor;
  let current2;
  let if_block = (
    /*Notify*/
    ctx[22] && create_if_block_16(ctx)
  );
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      if (
        /*Notify*/
        ctx2[22]
      )
        if_block.p(ctx2, dirty);
    },
    i(local) {
      if (current2)
        return;
      transition_in(if_block);
      current2 = true;
    },
    o(local) {
      transition_out(if_block);
      current2 = false;
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function create_if_block_16(ctx) {
  let switch_instance;
  let switch_instance_anchor;
  let current2;
  var switch_value = (
    /*Notify*/
    ctx[22]
  );
  function switch_props(ctx2) {
    return {
      props: {
        notifications: (
          /*$notifications$*/
          ctx2[10]
        ),
        position: (
          /*$notify$*/
          ctx2[3].position
        ),
        sharedContainer: (
          /*sharedContainer*/
          ctx2[0]
        )
      }
    };
  }
  if (switch_value) {
    switch_instance = construct_svelte_component(switch_value, switch_props(ctx));
  }
  return {
    c() {
      if (switch_instance)
        create_component(switch_instance.$$.fragment);
      switch_instance_anchor = empty();
    },
    m(target, anchor) {
      if (switch_instance)
        mount_component(switch_instance, target, anchor);
      insert(target, switch_instance_anchor, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      const switch_instance_changes = {};
      if (dirty & /*$notifications$*/
      1024)
        switch_instance_changes.notifications = /*$notifications$*/
        ctx2[10];
      if (dirty & /*$notify$*/
      8)
        switch_instance_changes.position = /*$notify$*/
        ctx2[3].position;
      if (dirty & /*sharedContainer*/
      1)
        switch_instance_changes.sharedContainer = /*sharedContainer*/
        ctx2[0];
      if (switch_value !== (switch_value = /*Notify*/
      ctx2[22])) {
        if (switch_instance) {
          group_outros();
          const old_component = switch_instance;
          transition_out(old_component.$$.fragment, 1, 0, () => {
            destroy_component(old_component, 1);
          });
          check_outros();
        }
        if (switch_value) {
          switch_instance = construct_svelte_component(switch_value, switch_props(ctx2));
          create_component(switch_instance.$$.fragment);
          transition_in(switch_instance.$$.fragment, 1);
          mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
        } else {
          switch_instance = null;
        }
      } else if (switch_value) {
        switch_instance.$set(switch_instance_changes);
      }
    },
    i(local) {
      if (current2)
        return;
      if (switch_instance)
        transition_in(switch_instance.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      if (switch_instance)
        transition_out(switch_instance.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(switch_instance_anchor);
      if (switch_instance)
        destroy_component(switch_instance, detaching);
    }
  };
}
function create_pending_block_4(ctx) {
  return {
    c: noop,
    m: noop,
    p: noop,
    i: noop,
    o: noop,
    d: noop
  };
}
function create_if_block_14(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      attr(div, "id", "w3o-transaction-preview-container");
      set_style(div, "margin-bottom", "8px");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_catch_block_3(ctx) {
  return {
    c: noop,
    m: noop,
    p: noop,
    i: noop,
    o: noop,
    d: noop
  };
}
function create_then_block_3(ctx) {
  let if_block_anchor;
  let current2;
  let if_block = (
    /*AccountCenter*/
    ctx[23] && create_if_block_13(ctx)
  );
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      if (
        /*AccountCenter*/
        ctx2[23]
      )
        if_block.p(ctx2, dirty);
    },
    i(local) {
      if (current2)
        return;
      transition_in(if_block);
      current2 = true;
    },
    o(local) {
      transition_out(if_block);
      current2 = false;
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function create_if_block_13(ctx) {
  let switch_instance;
  let switch_instance_anchor;
  let current2;
  var switch_value = (
    /*AccountCenter*/
    ctx[23]
  );
  function switch_props(ctx2) {
    return {};
  }
  if (switch_value) {
    switch_instance = construct_svelte_component(switch_value, switch_props());
  }
  return {
    c() {
      if (switch_instance)
        create_component(switch_instance.$$.fragment);
      switch_instance_anchor = empty();
    },
    m(target, anchor) {
      if (switch_instance)
        mount_component(switch_instance, target, anchor);
      insert(target, switch_instance_anchor, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      if (switch_value !== (switch_value = /*AccountCenter*/
      ctx2[23])) {
        if (switch_instance) {
          group_outros();
          const old_component = switch_instance;
          transition_out(old_component.$$.fragment, 1, 0, () => {
            destroy_component(old_component, 1);
          });
          check_outros();
        }
        if (switch_value) {
          switch_instance = construct_svelte_component(switch_value, switch_props());
          create_component(switch_instance.$$.fragment);
          transition_in(switch_instance.$$.fragment, 1);
          mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
        } else {
          switch_instance = null;
        }
      }
    },
    i(local) {
      if (current2)
        return;
      if (switch_instance)
        transition_in(switch_instance.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      if (switch_instance)
        transition_out(switch_instance.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(switch_instance_anchor);
      if (switch_instance)
        destroy_component(switch_instance, detaching);
    }
  };
}
function create_pending_block_3(ctx) {
  return {
    c: noop,
    m: noop,
    p: noop,
    i: noop,
    o: noop,
    d: noop
  };
}
function create_if_block_12(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      attr(div, "id", "w3o-transaction-preview-container");
      set_style(div, "margin-top", "8px");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_if_block_10(ctx) {
  let await_block_anchor;
  let current2;
  let info = {
    ctx,
    current: null,
    token: null,
    hasCatch: false,
    pending: create_pending_block_2,
    then: create_then_block_2,
    catch: create_catch_block_2,
    value: 22,
    blocks: [, , ,]
  };
  handle_promise(
    /*notifyComponent*/
    ctx[17],
    info
  );
  return {
    c() {
      await_block_anchor = empty();
      info.block.c();
    },
    m(target, anchor) {
      insert(target, await_block_anchor, anchor);
      info.block.m(target, info.anchor = anchor);
      info.mount = () => await_block_anchor.parentNode;
      info.anchor = await_block_anchor;
      current2 = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      update_await_block_branch(info, ctx, dirty);
    },
    i(local) {
      if (current2)
        return;
      transition_in(info.block);
      current2 = true;
    },
    o(local) {
      for (let i = 0; i < 3; i += 1) {
        const block = info.blocks[i];
        transition_out(block);
      }
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(await_block_anchor);
      info.block.d(detaching);
      info.token = null;
      info = null;
    }
  };
}
function create_catch_block_2(ctx) {
  return {
    c: noop,
    m: noop,
    p: noop,
    i: noop,
    o: noop,
    d: noop
  };
}
function create_then_block_2(ctx) {
  let if_block_anchor;
  let current2;
  let if_block = (
    /*Notify*/
    ctx[22] && create_if_block_11(ctx)
  );
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      if (
        /*Notify*/
        ctx2[22]
      )
        if_block.p(ctx2, dirty);
    },
    i(local) {
      if (current2)
        return;
      transition_in(if_block);
      current2 = true;
    },
    o(local) {
      transition_out(if_block);
      current2 = false;
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function create_if_block_11(ctx) {
  let switch_instance;
  let switch_instance_anchor;
  let current2;
  var switch_value = (
    /*Notify*/
    ctx[22]
  );
  function switch_props(ctx2) {
    return {
      props: {
        notifications: (
          /*$notifications$*/
          ctx2[10]
        ),
        position: (
          /*$notify$*/
          ctx2[3].position
        ),
        sharedContainer: (
          /*sharedContainer*/
          ctx2[0]
        )
      }
    };
  }
  if (switch_value) {
    switch_instance = construct_svelte_component(switch_value, switch_props(ctx));
  }
  return {
    c() {
      if (switch_instance)
        create_component(switch_instance.$$.fragment);
      switch_instance_anchor = empty();
    },
    m(target, anchor) {
      if (switch_instance)
        mount_component(switch_instance, target, anchor);
      insert(target, switch_instance_anchor, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      const switch_instance_changes = {};
      if (dirty & /*$notifications$*/
      1024)
        switch_instance_changes.notifications = /*$notifications$*/
        ctx2[10];
      if (dirty & /*$notify$*/
      8)
        switch_instance_changes.position = /*$notify$*/
        ctx2[3].position;
      if (dirty & /*sharedContainer*/
      1)
        switch_instance_changes.sharedContainer = /*sharedContainer*/
        ctx2[0];
      if (switch_value !== (switch_value = /*Notify*/
      ctx2[22])) {
        if (switch_instance) {
          group_outros();
          const old_component = switch_instance;
          transition_out(old_component.$$.fragment, 1, 0, () => {
            destroy_component(old_component, 1);
          });
          check_outros();
        }
        if (switch_value) {
          switch_instance = construct_svelte_component(switch_value, switch_props(ctx2));
          create_component(switch_instance.$$.fragment);
          transition_in(switch_instance.$$.fragment, 1);
          mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
        } else {
          switch_instance = null;
        }
      } else if (switch_value) {
        switch_instance.$set(switch_instance_changes);
      }
    },
    i(local) {
      if (current2)
        return;
      if (switch_instance)
        transition_in(switch_instance.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      if (switch_instance)
        transition_out(switch_instance.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(switch_instance_anchor);
      if (switch_instance)
        destroy_component(switch_instance, detaching);
    }
  };
}
function create_pending_block_2(ctx) {
  return {
    c: noop,
    m: noop,
    p: noop,
    i: noop,
    o: noop,
    d: noop
  };
}
function create_if_block_4(ctx) {
  let div1;
  let show_if_1 = (
    /*$accountCenter$*/
    ctx[1].position.includes("bottom")
  );
  let t0;
  let div0;
  let t1;
  let show_if = (
    /*$accountCenter$*/
    ctx[1].position.includes("top")
  );
  let div1_style_value;
  let current2;
  let if_block0 = show_if_1 && create_if_block_8();
  let if_block1 = (
    /*$accountCenter$*/
    ctx[1].enabled && /*$wallets$*/
    ctx[2].length && create_if_block_6(ctx)
  );
  let if_block2 = show_if && create_if_block_5();
  return {
    c() {
      div1 = element("div");
      if (if_block0)
        if_block0.c();
      t0 = space();
      div0 = element("div");
      if (if_block1)
        if_block1.c();
      t1 = space();
      if (if_block2)
        if_block2.c();
      attr(div1, "class", "container flex flex-column fixed z-indexed svelte-g9s19b");
      attr(div1, "style", div1_style_value = /*setPositioningDefaults*/
      ctx[15](accountCenterPositioning)[
        /*$accountCenter$*/
        ctx[1].position
      ] + "; " + /*device*/
      (ctx[11].type === "mobile" && /*$accountCenter$*/
      ctx[1].position.includes("top") ? "padding-bottom: 0;" : (
        /*device*/
        ctx[11].type === "mobile" && /*$accountCenter$*/
        ctx[1].position.includes("bottom") ? "padding-top:0;" : ""
      )));
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      if (if_block0)
        if_block0.m(div1, null);
      append(div1, t0);
      append(div1, div0);
      if (if_block1)
        if_block1.m(div0, null);
      append(div1, t1);
      if (if_block2)
        if_block2.m(div1, null);
      current2 = true;
    },
    p(ctx2, dirty) {
      if (dirty & /*$accountCenter$*/
      2)
        show_if_1 = /*$accountCenter$*/
        ctx2[1].position.includes("bottom");
      if (show_if_1) {
        if (if_block0)
          ;
        else {
          if_block0 = create_if_block_8();
          if_block0.c();
          if_block0.m(div1, t0);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      if (
        /*$accountCenter$*/
        ctx2[1].enabled && /*$wallets$*/
        ctx2[2].length
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
          if (dirty & /*$accountCenter$, $wallets$*/
          6) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block_6(ctx2);
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(div0, null);
        }
      } else if (if_block1) {
        group_outros();
        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });
        check_outros();
      }
      if (dirty & /*$accountCenter$*/
      2)
        show_if = /*$accountCenter$*/
        ctx2[1].position.includes("top");
      if (show_if) {
        if (if_block2)
          ;
        else {
          if_block2 = create_if_block_5();
          if_block2.c();
          if_block2.m(div1, null);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }
      if (!current2 || dirty & /*$accountCenter$*/
      2 && div1_style_value !== (div1_style_value = /*setPositioningDefaults*/
      ctx2[15](accountCenterPositioning)[
        /*$accountCenter$*/
        ctx2[1].position
      ] + "; " + /*device*/
      (ctx2[11].type === "mobile" && /*$accountCenter$*/
      ctx2[1].position.includes("top") ? "padding-bottom: 0;" : (
        /*device*/
        ctx2[11].type === "mobile" && /*$accountCenter$*/
        ctx2[1].position.includes("bottom") ? "padding-top:0;" : ""
      )))) {
        attr(div1, "style", div1_style_value);
      }
    },
    i(local) {
      if (current2)
        return;
      transition_in(if_block1);
      current2 = true;
    },
    o(local) {
      transition_out(if_block1);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div1);
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
      if (if_block2)
        if_block2.d();
    }
  };
}
function create_if_block_8(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      attr(div, "id", "w3o-transaction-preview-container");
      set_style(div, "margin-bottom", "8px");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_if_block_6(ctx) {
  let await_block_anchor;
  let current2;
  let info = {
    ctx,
    current: null,
    token: null,
    hasCatch: false,
    pending: create_pending_block_1,
    then: create_then_block_1,
    catch: create_catch_block_1,
    value: 23,
    blocks: [, , ,]
  };
  handle_promise(
    /*accountCenterComponent*/
    ctx[16],
    info
  );
  return {
    c() {
      await_block_anchor = empty();
      info.block.c();
    },
    m(target, anchor) {
      insert(target, await_block_anchor, anchor);
      info.block.m(target, info.anchor = anchor);
      info.mount = () => await_block_anchor.parentNode;
      info.anchor = await_block_anchor;
      current2 = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      update_await_block_branch(info, ctx, dirty);
    },
    i(local) {
      if (current2)
        return;
      transition_in(info.block);
      current2 = true;
    },
    o(local) {
      for (let i = 0; i < 3; i += 1) {
        const block = info.blocks[i];
        transition_out(block);
      }
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(await_block_anchor);
      info.block.d(detaching);
      info.token = null;
      info = null;
    }
  };
}
function create_catch_block_1(ctx) {
  return {
    c: noop,
    m: noop,
    p: noop,
    i: noop,
    o: noop,
    d: noop
  };
}
function create_then_block_1(ctx) {
  let if_block_anchor;
  let current2;
  let if_block = (
    /*AccountCenter*/
    ctx[23] && create_if_block_7(ctx)
  );
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      if (
        /*AccountCenter*/
        ctx2[23]
      )
        if_block.p(ctx2, dirty);
    },
    i(local) {
      if (current2)
        return;
      transition_in(if_block);
      current2 = true;
    },
    o(local) {
      transition_out(if_block);
      current2 = false;
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function create_if_block_7(ctx) {
  let switch_instance;
  let switch_instance_anchor;
  let current2;
  var switch_value = (
    /*AccountCenter*/
    ctx[23]
  );
  function switch_props(ctx2) {
    return {};
  }
  if (switch_value) {
    switch_instance = construct_svelte_component(switch_value, switch_props());
  }
  return {
    c() {
      if (switch_instance)
        create_component(switch_instance.$$.fragment);
      switch_instance_anchor = empty();
    },
    m(target, anchor) {
      if (switch_instance)
        mount_component(switch_instance, target, anchor);
      insert(target, switch_instance_anchor, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      if (switch_value !== (switch_value = /*AccountCenter*/
      ctx2[23])) {
        if (switch_instance) {
          group_outros();
          const old_component = switch_instance;
          transition_out(old_component.$$.fragment, 1, 0, () => {
            destroy_component(old_component, 1);
          });
          check_outros();
        }
        if (switch_value) {
          switch_instance = construct_svelte_component(switch_value, switch_props());
          create_component(switch_instance.$$.fragment);
          transition_in(switch_instance.$$.fragment, 1);
          mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
        } else {
          switch_instance = null;
        }
      }
    },
    i(local) {
      if (current2)
        return;
      if (switch_instance)
        transition_in(switch_instance.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      if (switch_instance)
        transition_out(switch_instance.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(switch_instance_anchor);
      if (switch_instance)
        destroy_component(switch_instance, detaching);
    }
  };
}
function create_pending_block_1(ctx) {
  return {
    c: noop,
    m: noop,
    p: noop,
    i: noop,
    o: noop,
    d: noop
  };
}
function create_if_block_5(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      attr(div, "id", "w3o-transaction-preview-container");
      set_style(div, "margin-top", "8px");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_if_block(ctx) {
  let div;
  let show_if_1 = (
    /*$notify$*/
    ctx[3].position.includes("top")
  );
  let t0;
  let t1;
  let show_if = (
    /*$notify$*/
    ctx[3].position.includes("bottom")
  );
  let div_style_value;
  let current2;
  let if_block0 = show_if_1 && create_if_block_3();
  let info = {
    ctx,
    current: null,
    token: null,
    hasCatch: false,
    pending: create_pending_block,
    then: create_then_block,
    catch: create_catch_block,
    value: 22,
    blocks: [, , ,]
  };
  handle_promise(
    /*notifyComponent*/
    ctx[17],
    info
  );
  let if_block1 = show_if && create_if_block_1();
  return {
    c() {
      div = element("div");
      if (if_block0)
        if_block0.c();
      t0 = space();
      info.block.c();
      t1 = space();
      if (if_block1)
        if_block1.c();
      attr(div, "class", "container flex flex-column fixed z-indexed svelte-g9s19b");
      attr(div, "style", div_style_value = /*setPositioningDefaults*/
      ctx[15](notifyPositioning)[
        /*$notify$*/
        ctx[3].position
      ] + "; " + /*device*/
      (ctx[11].type === "mobile" && /*$notify$*/
      ctx[3].position.includes("top") ? "padding-bottom: 0;" : (
        /*device*/
        ctx[11].type === "mobile" && /*$notify$*/
        ctx[3].position.includes("bottom") ? "padding-top:0;" : ""
      )));
    },
    m(target, anchor) {
      insert(target, div, anchor);
      if (if_block0)
        if_block0.m(div, null);
      append(div, t0);
      info.block.m(div, info.anchor = null);
      info.mount = () => div;
      info.anchor = t1;
      append(div, t1);
      if (if_block1)
        if_block1.m(div, null);
      current2 = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (dirty & /*$notify$*/
      8)
        show_if_1 = /*$notify$*/
        ctx[3].position.includes("top");
      if (show_if_1) {
        if (if_block0)
          ;
        else {
          if_block0 = create_if_block_3();
          if_block0.c();
          if_block0.m(div, t0);
        }
      } else if (if_block0) {
        if_block0.d(1);
        if_block0 = null;
      }
      update_await_block_branch(info, ctx, dirty);
      if (dirty & /*$notify$*/
      8)
        show_if = /*$notify$*/
        ctx[3].position.includes("bottom");
      if (show_if) {
        if (if_block1)
          ;
        else {
          if_block1 = create_if_block_1();
          if_block1.c();
          if_block1.m(div, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (!current2 || dirty & /*$notify$*/
      8 && div_style_value !== (div_style_value = /*setPositioningDefaults*/
      ctx[15](notifyPositioning)[
        /*$notify$*/
        ctx[3].position
      ] + "; " + /*device*/
      (ctx[11].type === "mobile" && /*$notify$*/
      ctx[3].position.includes("top") ? "padding-bottom: 0;" : (
        /*device*/
        ctx[11].type === "mobile" && /*$notify$*/
        ctx[3].position.includes("bottom") ? "padding-top:0;" : ""
      )))) {
        attr(div, "style", div_style_value);
      }
    },
    i(local) {
      if (current2)
        return;
      transition_in(info.block);
      current2 = true;
    },
    o(local) {
      for (let i = 0; i < 3; i += 1) {
        const block = info.blocks[i];
        transition_out(block);
      }
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      if (if_block0)
        if_block0.d();
      info.block.d();
      info.token = null;
      info = null;
      if (if_block1)
        if_block1.d();
    }
  };
}
function create_if_block_3(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      attr(div, "id", "w3o-transaction-preview-container");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_catch_block(ctx) {
  return {
    c: noop,
    m: noop,
    p: noop,
    i: noop,
    o: noop,
    d: noop
  };
}
function create_then_block(ctx) {
  let if_block_anchor;
  let current2;
  let if_block = (
    /*Notify*/
    ctx[22] && create_if_block_2(ctx)
  );
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      if (
        /*Notify*/
        ctx2[22]
      )
        if_block.p(ctx2, dirty);
    },
    i(local) {
      if (current2)
        return;
      transition_in(if_block);
      current2 = true;
    },
    o(local) {
      transition_out(if_block);
      current2 = false;
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function create_if_block_2(ctx) {
  let switch_instance;
  let switch_instance_anchor;
  let current2;
  var switch_value = (
    /*Notify*/
    ctx[22]
  );
  function switch_props(ctx2) {
    return {
      props: {
        notifications: (
          /*$notifications$*/
          ctx2[10]
        ),
        position: (
          /*$notify$*/
          ctx2[3].position
        ),
        sharedContainer: (
          /*sharedContainer*/
          ctx2[0]
        )
      }
    };
  }
  if (switch_value) {
    switch_instance = construct_svelte_component(switch_value, switch_props(ctx));
  }
  return {
    c() {
      if (switch_instance)
        create_component(switch_instance.$$.fragment);
      switch_instance_anchor = empty();
    },
    m(target, anchor) {
      if (switch_instance)
        mount_component(switch_instance, target, anchor);
      insert(target, switch_instance_anchor, anchor);
      current2 = true;
    },
    p(ctx2, dirty) {
      const switch_instance_changes = {};
      if (dirty & /*$notifications$*/
      1024)
        switch_instance_changes.notifications = /*$notifications$*/
        ctx2[10];
      if (dirty & /*$notify$*/
      8)
        switch_instance_changes.position = /*$notify$*/
        ctx2[3].position;
      if (dirty & /*sharedContainer*/
      1)
        switch_instance_changes.sharedContainer = /*sharedContainer*/
        ctx2[0];
      if (switch_value !== (switch_value = /*Notify*/
      ctx2[22])) {
        if (switch_instance) {
          group_outros();
          const old_component = switch_instance;
          transition_out(old_component.$$.fragment, 1, 0, () => {
            destroy_component(old_component, 1);
          });
          check_outros();
        }
        if (switch_value) {
          switch_instance = construct_svelte_component(switch_value, switch_props(ctx2));
          create_component(switch_instance.$$.fragment);
          transition_in(switch_instance.$$.fragment, 1);
          mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
        } else {
          switch_instance = null;
        }
      } else if (switch_value) {
        switch_instance.$set(switch_instance_changes);
      }
    },
    i(local) {
      if (current2)
        return;
      if (switch_instance)
        transition_in(switch_instance.$$.fragment, local);
      current2 = true;
    },
    o(local) {
      if (switch_instance)
        transition_out(switch_instance.$$.fragment, local);
      current2 = false;
    },
    d(detaching) {
      if (detaching)
        detach(switch_instance_anchor);
      if (switch_instance)
        destroy_component(switch_instance, detaching);
    }
  };
}
function create_pending_block(ctx) {
  return {
    c: noop,
    m: noop,
    p: noop,
    i: noop,
    o: noop,
    d: noop
  };
}
function create_if_block_1(ctx) {
  let div;
  return {
    c() {
      div = element("div");
      attr(div, "id", "w3o-transaction-preview-container");
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(div);
    }
  };
}
function create_fragment(ctx) {
  let t0;
  let t1;
  let t2;
  let t3;
  let t4;
  let t5;
  let if_block6_anchor;
  let current2;
  let if_block0 = (
    /*$connectWallet$*/
    ctx[8].inProgress && create_if_block_20(ctx)
  );
  let if_block1 = (
    /*$connectWallet$*/
    ctx[8].actionRequired && create_if_block_19(ctx)
  );
  let if_block2 = (
    /*$switchChainModal$*/
    ctx[9] && create_if_block_18()
  );
  let if_block3 = !/*$accountCenter$*/
  ctx[1].enabled && !/*$notify$*/
  ctx[3].enabled && create_if_block_17(ctx);
  let if_block4 = (
    /*displayAccountCenterNotifySameContainer*/
    ctx[4] && create_if_block_9(ctx)
  );
  let if_block5 = (
    /*displayAccountCenterSeparate*/
    ctx[5] && create_if_block_4(ctx)
  );
  let if_block6 = (
    /*displayNotifySeparate*/
    ctx[6] && create_if_block(ctx)
  );
  return {
    c() {
      if (if_block0)
        if_block0.c();
      t0 = space();
      if (if_block1)
        if_block1.c();
      t1 = space();
      if (if_block2)
        if_block2.c();
      t2 = space();
      if (if_block3)
        if_block3.c();
      t3 = space();
      if (if_block4)
        if_block4.c();
      t4 = space();
      if (if_block5)
        if_block5.c();
      t5 = space();
      if (if_block6)
        if_block6.c();
      if_block6_anchor = empty();
    },
    m(target, anchor) {
      if (if_block0)
        if_block0.m(target, anchor);
      insert(target, t0, anchor);
      if (if_block1)
        if_block1.m(target, anchor);
      insert(target, t1, anchor);
      if (if_block2)
        if_block2.m(target, anchor);
      insert(target, t2, anchor);
      if (if_block3)
        if_block3.m(target, anchor);
      insert(target, t3, anchor);
      if (if_block4)
        if_block4.m(target, anchor);
      insert(target, t4, anchor);
      if (if_block5)
        if_block5.m(target, anchor);
      insert(target, t5, anchor);
      if (if_block6)
        if_block6.m(target, anchor);
      insert(target, if_block6_anchor, anchor);
      current2 = true;
    },
    p(ctx2, [dirty]) {
      if (
        /*$connectWallet$*/
        ctx2[8].inProgress
      ) {
        if (if_block0) {
          if_block0.p(ctx2, dirty);
          if (dirty & /*$connectWallet$*/
          256) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_20(ctx2);
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(t0.parentNode, t0);
        }
      } else if (if_block0) {
        group_outros();
        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });
        check_outros();
      }
      if (
        /*$connectWallet$*/
        ctx2[8].actionRequired
      ) {
        if (if_block1) {
          if_block1.p(ctx2, dirty);
          if (dirty & /*$connectWallet$*/
          256) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block_19(ctx2);
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(t1.parentNode, t1);
        }
      } else if (if_block1) {
        group_outros();
        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });
        check_outros();
      }
      if (
        /*$switchChainModal$*/
        ctx2[9]
      ) {
        if (if_block2) {
          if (dirty & /*$switchChainModal$*/
          512) {
            transition_in(if_block2, 1);
          }
        } else {
          if_block2 = create_if_block_18();
          if_block2.c();
          transition_in(if_block2, 1);
          if_block2.m(t2.parentNode, t2);
        }
      } else if (if_block2) {
        group_outros();
        transition_out(if_block2, 1, 1, () => {
          if_block2 = null;
        });
        check_outros();
      }
      if (!/*$accountCenter$*/
      ctx2[1].enabled && !/*$notify$*/
      ctx2[3].enabled) {
        if (if_block3) {
          if_block3.p(ctx2, dirty);
        } else {
          if_block3 = create_if_block_17(ctx2);
          if_block3.c();
          if_block3.m(t3.parentNode, t3);
        }
      } else if (if_block3) {
        if_block3.d(1);
        if_block3 = null;
      }
      if (
        /*displayAccountCenterNotifySameContainer*/
        ctx2[4]
      ) {
        if (if_block4) {
          if_block4.p(ctx2, dirty);
          if (dirty & /*displayAccountCenterNotifySameContainer*/
          16) {
            transition_in(if_block4, 1);
          }
        } else {
          if_block4 = create_if_block_9(ctx2);
          if_block4.c();
          transition_in(if_block4, 1);
          if_block4.m(t4.parentNode, t4);
        }
      } else if (if_block4) {
        group_outros();
        transition_out(if_block4, 1, 1, () => {
          if_block4 = null;
        });
        check_outros();
      }
      if (
        /*displayAccountCenterSeparate*/
        ctx2[5]
      ) {
        if (if_block5) {
          if_block5.p(ctx2, dirty);
          if (dirty & /*displayAccountCenterSeparate*/
          32) {
            transition_in(if_block5, 1);
          }
        } else {
          if_block5 = create_if_block_4(ctx2);
          if_block5.c();
          transition_in(if_block5, 1);
          if_block5.m(t5.parentNode, t5);
        }
      } else if (if_block5) {
        group_outros();
        transition_out(if_block5, 1, 1, () => {
          if_block5 = null;
        });
        check_outros();
      }
      if (
        /*displayNotifySeparate*/
        ctx2[6]
      ) {
        if (if_block6) {
          if_block6.p(ctx2, dirty);
          if (dirty & /*displayNotifySeparate*/
          64) {
            transition_in(if_block6, 1);
          }
        } else {
          if_block6 = create_if_block(ctx2);
          if_block6.c();
          transition_in(if_block6, 1);
          if_block6.m(if_block6_anchor.parentNode, if_block6_anchor);
        }
      } else if (if_block6) {
        group_outros();
        transition_out(if_block6, 1, 1, () => {
          if_block6 = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current2)
        return;
      transition_in(if_block0);
      transition_in(if_block1);
      transition_in(if_block2);
      transition_in(if_block4);
      transition_in(if_block5);
      transition_in(if_block6);
      current2 = true;
    },
    o(local) {
      transition_out(if_block0);
      transition_out(if_block1);
      transition_out(if_block2);
      transition_out(if_block4);
      transition_out(if_block5);
      transition_out(if_block6);
      current2 = false;
    },
    d(detaching) {
      if (if_block0)
        if_block0.d(detaching);
      if (detaching)
        detach(t0);
      if (if_block1)
        if_block1.d(detaching);
      if (detaching)
        detach(t1);
      if (if_block2)
        if_block2.d(detaching);
      if (detaching)
        detach(t2);
      if (if_block3)
        if_block3.d(detaching);
      if (detaching)
        detach(t3);
      if (if_block4)
        if_block4.d(detaching);
      if (detaching)
        detach(t4);
      if (if_block5)
        if_block5.d(detaching);
      if (detaching)
        detach(t5);
      if (if_block6)
        if_block6.d(detaching);
      if (detaching)
        detach(if_block6_anchor);
    }
  };
}
const accountCenterPositioning = "account-center";
const notifyPositioning = "notify-onboard-container";
function instance($$self, $$props, $$invalidate) {
  let sharedContainer;
  let samePositionOrMobile;
  let sharedMobileContainerCheck;
  let displayNotifySeparate;
  let displayAccountCenterSeparate;
  let displayAccountCenterNotifySameContainer;
  let $accountCenter$;
  let $wallets$;
  let $notify$;
  let $connectWallet$;
  let $switchChainModal$;
  let $notifications$;
  component_subscribe($$self, wallets$, ($$value) => $$invalidate(2, $wallets$ = $$value));
  component_subscribe($$self, connectWallet$, ($$value) => $$invalidate(8, $connectWallet$ = $$value));
  component_subscribe($$self, switchChainModal$, ($$value) => $$invalidate(9, $switchChainModal$ = $$value));
  const { device, containerElements: containerElements2 } = configuration;
  const accountCenter$ = state$1.select("accountCenter").pipe(startWith$1(state$1.get().accountCenter), shareReplay$1(1));
  component_subscribe($$self, accountCenter$, (value) => $$invalidate(1, $accountCenter$ = value));
  const notify$ = state$1.select("notify").pipe(startWith$1(state$1.get().notify), shareReplay$1(1));
  component_subscribe($$self, notify$, (value) => $$invalidate(3, $notify$ = value));
  const notifications$ = state$1.select("notifications").pipe(startWith$1(state$1.get().notifications));
  component_subscribe($$self, notifications$, (value) => $$invalidate(10, $notifications$ = value));
  const setPositioningDefaults = (targetComponentVariable) => {
    return {
      topLeft: `
        top: var(--${targetComponentVariable}-position-top, 0); 
        left: var(--${targetComponentVariable}-position-left, 0);`,
      topRight: `
        top: var(--${targetComponentVariable}-position-top, 0); 
        right: var(--${targetComponentVariable}-position-right, 0);`,
      bottomRight: `
        bottom: var(--${targetComponentVariable}-position-bottom, 0); 
        right: var(--${targetComponentVariable}-position-right, 0);`,
      bottomLeft: `
        bottom: var(--${targetComponentVariable}-position-bottom, 0); 
        left: var(--${targetComponentVariable}-position-left, 0);`
    };
  };
  const accountCenterComponent = $accountCenter$.enabled ? import("./Index-a8f5e52f.js").then((mod) => mod.default) : Promise.resolve(null);
  const notifyComponent = $notify$.enabled ? import("./Index-66e3b3f1.js").then((mod) => mod.default) : Promise.resolve(null);
  const accountCenterMountToElement = $accountCenter$.enabled && containerElements2 && containerElements2.accountCenter;
  const attachCompToDom = (domEl, targetEl, component, compSettings) => {
    const target = domEl.attachShadow({ mode: "open" });
    let getW3OEl = document.querySelector("onboard-v2");
    let w3OStyleSheets = getW3OEl.shadowRoot.styleSheets;
    const copiedStyleSheet = new CSSStyleSheet();
    Object.values(w3OStyleSheets).forEach((sheet) => {
      const styleRules = Object.values(sheet.cssRules);
      styleRules.forEach((rule) => copiedStyleSheet.insertRule(rule.cssText));
    });
    target.adoptedStyleSheets = [copiedStyleSheet];
    const containerElement = document.querySelector(targetEl);
    containerElement.appendChild(domEl);
    if (!containerElement) {
      throw new Error(`Element with query ${targetEl} does not exist.`);
    }
    const getACComp = async () => {
      let newComp = await component;
      if (newComp) {
        new newComp({
          target,
          props: {
            settings: compSettings,
            mountInContainer: true
          }
        });
      }
    };
    getACComp();
  };
  if (accountCenterMountToElement) {
    const accountCenter2 = document.createElement("onboard-account-center");
    attachCompToDom(accountCenter2, accountCenterMountToElement, accountCenterComponent, $accountCenter$);
  }
  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*$accountCenter$, $notify$*/
    10) {
      $$invalidate(0, sharedContainer = !accountCenterMountToElement && $accountCenter$.enabled && $notify$.enabled && $notify$.position === $accountCenter$.position);
    }
    if ($$self.$$.dirty & /*$accountCenter$, $notify$*/
    10) {
      $$invalidate(7, samePositionOrMobile = device.type === "mobile" || $accountCenter$.position === $notify$.position);
    }
    if ($$self.$$.dirty & /*$notify$, $accountCenter$*/
    10) {
      $$invalidate(18, sharedMobileContainerCheck = $notify$.position.includes("bottom") && $accountCenter$.position.includes("bottom") || $notify$.position.includes("top") && $accountCenter$.position.includes("top"));
    }
    if ($$self.$$.dirty & /*$notify$, $accountCenter$, sharedMobileContainerCheck, $wallets$*/
    262158) {
      $$invalidate(6, displayNotifySeparate = $notify$.enabled && (!$accountCenter$.enabled || accountCenterMountToElement || $notify$.position !== $accountCenter$.position && device.type !== "mobile" || device.type === "mobile" && !sharedMobileContainerCheck || !$wallets$.length));
    }
    if ($$self.$$.dirty & /*$accountCenter$, $notify$, sharedMobileContainerCheck, $wallets$*/
    262158) {
      $$invalidate(5, displayAccountCenterSeparate = $accountCenter$.enabled && (!$notify$.enabled || $notify$.position !== $accountCenter$.position && device.type !== "mobile" || device.type === "mobile" && !sharedMobileContainerCheck) && $wallets$.length);
    }
    if ($$self.$$.dirty & /*$notify$, $accountCenter$, sharedContainer, sharedMobileContainerCheck, $wallets$*/
    262159) {
      $$invalidate(4, displayAccountCenterNotifySameContainer = $notify$.enabled && $accountCenter$.enabled && (sharedContainer || device.type === "mobile" && sharedMobileContainerCheck) && $wallets$.length);
    }
  };
  return [
    sharedContainer,
    $accountCenter$,
    $wallets$,
    $notify$,
    displayAccountCenterNotifySameContainer,
    displayAccountCenterSeparate,
    displayNotifySeparate,
    samePositionOrMobile,
    $connectWallet$,
    $switchChainModal$,
    $notifications$,
    device,
    accountCenter$,
    notify$,
    notifications$,
    setPositioningDefaults,
    accountCenterComponent,
    notifyComponent,
    sharedMobileContainerCheck
  ];
}
class Index extends SvelteComponent {
  constructor(options2) {
    super();
    init$1(this, options2, instance, create_fragment, safe_not_equal, {}, add_css);
  }
}
let notificationsArr;
state$1.select("notifications").subscribe((notifications) => {
  notificationsArr = notifications;
});
async function preflightNotifications(options2) {
  const invalid = validatePreflightNotifications(options2);
  if (invalid) {
    throw invalid;
  }
  const { sendTransaction, estimateGas, gasPrice, balance: balance2, txDetails, txApproveReminderTimeout } = options2;
  const reminderTimeout = txApproveReminderTimeout && txApproveReminderTimeout > 3e3 ? txApproveReminderTimeout : 15e3;
  const [gas, price] = await gasEstimates(estimateGas, gasPrice);
  const id = createId(nanoid());
  const value = new BigNumber(txDetails && txDetails.value || 0);
  if (balance2 && gas && price) {
    const transactionCost = gas.times(price).plus(value);
    if (transactionCost.gt(new BigNumber(balance2))) {
      const eventCode2 = "nsfFail";
      addNotification(buildNotification(eventCode2, id));
    }
  }
  const txRequested = notificationsArr.find((tx) => tx.eventCode === "txRequest");
  if (txRequested) {
    const eventCode2 = "txAwaitingApproval";
    const newNotification = buildNotification(eventCode2, txRequested.id);
    addNotification(newNotification);
  }
  setTimeout(() => {
    const awaitingApproval = notificationsArr.find((tx) => tx.id === id && tx.eventCode === "txRequest");
    if (awaitingApproval) {
      const eventCode2 = "txConfirmReminder";
      const newNotification = buildNotification(eventCode2, awaitingApproval.id);
      addNotification(newNotification);
    }
  }, reminderTimeout);
  const eventCode = "txRequest";
  addNotification(buildNotification(eventCode, id));
  if (!sendTransaction) {
    return id;
  }
  let hash2;
  try {
    hash2 = await sendTransaction();
  } catch (error) {
    const { eventCode: eventCode2, errorMsg } = extractMessageFromError(error);
    addNotification(buildNotification(eventCode2, id));
    console.error(errorMsg);
    return;
  }
  removeNotification(id);
  if (hash2) {
    return hash2;
  }
  return;
}
const buildNotification = (eventCode, id) => {
  return {
    eventCode,
    type: eventToType(eventCode),
    id,
    key: createKey(id, eventCode),
    message: createMessageText(eventCode),
    startTime: Date.now(),
    network: Object.keys(networkToChainId).find((key) => networkToChainId[key] === state$1.get().chains[0].id),
    autoDismiss: 0
  };
};
const createKey = (id, eventCode) => {
  return `${id}-${eventCode}`;
};
const createId = (id) => {
  return `${id}-preflight`;
};
const createMessageText = (eventCode) => {
  const notificationDefaultMessages = en.notify;
  notificationDefaultMessages.transaction;
  return notificationDefaultMessages.transaction[eventCode];
};
function extractMessageFromError(error) {
  if (!error.stack || !error.message) {
    return {
      eventCode: "txError",
      errorMsg: "An unknown error occured"
    };
  }
  const message = error.stack || error.message;
  if (message.includes("User denied transaction signature")) {
    return {
      eventCode: "txSendFail",
      errorMsg: "User denied transaction signature"
    };
  }
  if (message.includes("transaction underpriced")) {
    return {
      eventCode: "txUnderpriced",
      errorMsg: "Transaction is under priced"
    };
  }
  return {
    eventCode: "txError",
    errorMsg: message
  };
}
const gasEstimates = async (gasFunc, gasPriceFunc) => {
  if (!gasFunc || !gasPriceFunc) {
    return Promise.resolve([]);
  }
  const gasProm = gasFunc();
  if (!gasProm.then) {
    throw new Error("The `estimateGas` function must return a Promise");
  }
  const gasPriceProm = gasPriceFunc();
  if (!gasPriceProm.then) {
    throw new Error("The `gasPrice` function must return a Promise");
  }
  return Promise.all([gasProm, gasPriceProm]).then(([gasResult, gasPriceResult]) => {
    if (typeof gasResult !== "string") {
      throw new Error(`The Promise returned from calling 'estimateGas' must resolve with a value of type 'string'. Received a value of: ${gasResult} with a type: ${typeof gasResult}`);
    }
    if (typeof gasPriceResult !== "string") {
      throw new Error(`The Promise returned from calling 'gasPrice' must resolve with a value of type 'string'. Received a value of: ${gasPriceResult} with a type: ${typeof gasPriceResult}`);
    }
    return [new BigNumber(gasResult), new BigNumber(gasPriceResult)];
  }).catch((error) => {
    throw new Error(`There was an error getting gas estimates: ${error}`);
  });
};
const API = {
  connectWallet: connect$1,
  disconnectWallet: disconnect,
  setChain,
  state: {
    get: state$1.get,
    select: state$1.select,
    actions: {
      setWalletModules,
      setLocale,
      updateNotify,
      customNotification,
      preflightNotifications,
      updateBalances,
      updateAccountCenter,
      setPrimaryWallet,
      updateTheme,
      updateAppMetadata
    }
  }
};
function init(options2) {
  if (typeof window === "undefined")
    return API;
  if (options2) {
    const error = validateInitOptions(options2);
    if (error) {
      throw error;
    }
  }
  const { wallets: wallets2, chains: chains2, appMetadata: appMetadata2, i18n, accountCenter: accountCenter2, apiKey, notify: notify2, gas, connect: connect2, containerElements: containerElements2, transactionPreview, theme: theme2, disableFontDownload, unstoppableResolution } = options2;
  if (containerElements2)
    updateConfiguration({ containerElements: containerElements2 });
  const { device, svelteInstance } = configuration;
  if (svelteInstance) {
    console.warn("Re-initializing Onboard and resetting back to initial state");
    reset$.next();
  }
  initialize(i18n);
  addChains(chainIdToHex(chains2));
  if (typeof connect2 !== void 0) {
    updateConnectModal(connect2);
  }
  if (typeof accountCenter2 !== "undefined") {
    let accountCenterUpdate;
    const { hideTransactionProtectionBtn, transactionProtectionInfoLink } = accountCenter2;
    if (device.type === "mobile") {
      accountCenterUpdate = {
        ...APP_INITIAL_STATE.accountCenter,
        hideTransactionProtectionBtn,
        transactionProtectionInfoLink,
        ...accountCenter2.mobile ? accountCenter2.mobile : {}
      };
    } else if (accountCenter2.desktop) {
      accountCenterUpdate = {
        ...APP_INITIAL_STATE.accountCenter,
        hideTransactionProtectionBtn,
        transactionProtectionInfoLink,
        ...accountCenter2.desktop
      };
    }
    updateAccountCenter(accountCenterUpdate);
  }
  if (typeof notify2 !== "undefined") {
    if ("desktop" in notify2 || "mobile" in notify2) {
      const error = validateNotifyOptions(notify2);
      if (error) {
        throw error;
      }
      if ((!notify2.desktop || notify2.desktop && !notify2.desktop.position) && accountCenter2 && accountCenter2.desktop && accountCenter2.desktop.position) {
        notify2.desktop.position = accountCenter2.desktop.position;
      }
      if ((!notify2.mobile || notify2.mobile && !notify2.mobile.position) && accountCenter2 && accountCenter2.mobile && accountCenter2.mobile.position) {
        notify2.mobile.position = accountCenter2.mobile.position;
      }
      let notifyUpdate;
      if (device.type === "mobile" && notify2.mobile) {
        notifyUpdate = {
          ...APP_INITIAL_STATE.notify,
          ...notify2.mobile
        };
      } else if (notify2.desktop) {
        notifyUpdate = {
          ...APP_INITIAL_STATE.notify,
          ...notify2.desktop
        };
      }
      updateNotify(notifyUpdate);
    } else {
      const error = validateNotify(notify2);
      if (error) {
        throw error;
      }
      const notifyUpdate = {
        ...APP_INITIAL_STATE.notify,
        ...notify2
      };
      updateNotify(notifyUpdate);
    }
  } else {
    const notifyUpdate = APP_INITIAL_STATE.notify;
    updateNotify(notifyUpdate);
  }
  const app = svelteInstance || mountApp(theme2, disableFontDownload);
  updateConfiguration({
    svelteInstance: app,
    apiKey,
    initialWalletInit: wallets2,
    gas,
    transactionPreview,
    unstoppableResolution
  });
  appMetadata2 && updateAppMetadata(appMetadata2);
  if (apiKey && transactionPreview) {
    const getBnSDK = async () => {
      transactionPreview.init({
        containerElement: "#w3o-transaction-preview-container",
        sdk: await getBlocknativeSdk(),
        apiKey
      });
      wallets$.subscribe((wallets3) => {
        wallets3.forEach(({ provider }) => {
          transactionPreview.patchProvider(provider);
        });
      });
    };
    getBnSDK();
  }
  theme2 && updateTheme(theme2);
  if (connect2 && (connect2.autoConnectLastWallet || connect2.autoConnectAllPreviousWallet)) {
    const lastConnectedWallets = getLocalStore(STORAGE_KEYS.LAST_CONNECTED_WALLET);
    try {
      const lastConnectedWalletsParsed = JSON.parse(lastConnectedWallets);
      if (lastConnectedWalletsParsed && Array.isArray(lastConnectedWalletsParsed) && lastConnectedWalletsParsed.length) {
        connectAllPreviousWallets(lastConnectedWalletsParsed, connect2);
      }
    } catch (err) {
      if (err instanceof SyntaxError && lastConnectedWallets) {
        API.connectWallet({
          autoSelect: {
            label: lastConnectedWallets,
            disableModals: true
          }
        });
      }
    }
  }
  return API;
}
const fontFamilyExternallyDefined = (theme2, disableFontDownload) => {
  if (disableFontDownload)
    return true;
  if (document.body && (getComputedStyle(document.body).getPropertyValue("--onboard-font-family-normal") || getComputedStyle(document.body).getPropertyValue("--w3o-font-family")))
    return true;
  if (!theme2)
    return false;
  if (typeof theme2 === "object" && theme2["--w3o-font-family"])
    return true;
  return false;
};
const importInterFont = async () => {
  const { InterVar } = await import("@web3-onboard/common");
  const styleEl = document.createElement("style");
  styleEl.innerHTML = `
    ${InterVar}
  `;
  document.body.appendChild(styleEl);
};
const connectAllPreviousWallets = async (lastConnectedWallets, connect2) => {
  const activeWalletsList = [];
  const parsedWalletList = lastConnectedWallets;
  if (!connect2.autoConnectAllPreviousWallet) {
    API.connectWallet({
      autoSelect: { label: parsedWalletList[0], disableModals: true }
    });
    activeWalletsList.push(parsedWalletList[0]);
  } else {
    for (let i = parsedWalletList.length; i--; ) {
      const walletConnectionPromise = await API.connectWallet({
        autoSelect: { label: parsedWalletList[i], disableModals: true }
      });
      if (walletConnectionPromise.some((r) => r.label === parsedWalletList[i])) {
        activeWalletsList.unshift(parsedWalletList[i]);
      }
    }
  }
  setLocalStore(STORAGE_KEYS.LAST_CONNECTED_WALLET, JSON.stringify(activeWalletsList));
};
function mountApp(theme2, disableFontDownload) {
  class Onboard extends HTMLElement {
    constructor() {
      super();
    }
  }
  if (!customElements.get("onboard-v2")) {
    customElements.define("onboard-v2", Onboard);
  }
  if (!fontFamilyExternallyDefined(theme2, disableFontDownload)) {
    importInterFont();
  }
  const onboard2 = document.createElement("onboard-v2");
  const target = onboard2.attachShadow({ mode: "open" });
  onboard2.style.all = "initial";
  target.innerHTML = `

  <style>
    :host {
          /* COLORS */
          --white: white;
          --black: black;
          --primary-1: #2F80ED;
          --primary-100: #eff1fc;
          --primary-200: #d0d4f7;
          --primary-300: #b1b8f2;
          --primary-400: #929bed;
          --primary-500: #6370e5;
          --primary-600: #454ea0;
          --primary-700: #323873;
          --gray-100: #ebebed;
          --gray-200: #c2c4c9;
          --gray-300: #999ca5;
          --gray-400: #707481;
          --gray-500: #33394b;
          --gray-600: #242835;
          --gray-700: #1a1d26;
          --success-100: #d1fae3;
          --success-200: #baf7d5;
          --success-300: #a4f4c6;
          --success-400: #8df2b8;
          --success-500: #5aec99;
          --success-600: #18ce66;
          --success-700: #129b4d;
          --danger-100: #ffe5e6;
          --danger-200: #ffcccc;
          --danger-300: #ffb3b3;
          --danger-400: #ff8080;
          --danger-500: #ff4f4f;
          --danger-600: #cc0000;
          --danger-700: #660000;
          --warning-100: #ffefcc;
          --warning-200: #ffe7b3;
          --warning-300: #ffd780;
          --warning-400: #ffc74c;
          --warning-500: #ffaf00;
          --warning-600: #cc8c00;
          --warning-700: #664600;

          /* FONTS */
          --font-family-normal: var(--w3o-font-family, Inter, sans-serif);

          --font-size-1: 3rem;
          --font-size-2: 2.25rem;
          --font-size-3: 1.5rem;
          --font-size-4: 1.25rem;
          --font-size-5: 1rem;
          --font-size-6: .875rem;
          --font-size-7: .75rem;

          --font-line-height-1: 24px;
          --font-line-height-2: 20px;
          --font-line-height-3: 16px;
          --font-line-height-4: 12px;

          /* SPACING */
          --spacing-1: 3rem;
          --spacing-2: 2rem;
          --spacing-3: 1.5rem;
          --spacing-4: 1rem;
          --spacing-5: 0.5rem;
          --spacing-6: 0.25rem;
          --spacing-7: 0.125rem;

          /* BORDER RADIUS */
          --border-radius-1: 24px;
          --border-radius-2: 20px;
          --border-radius-3: 16px;
          --border-radius-4: 12px;
          --border-radius-5: 8px;

          /* SHADOWS */
          --shadow-0: none;
          --shadow-1: 0px 4px 12px rgba(0, 0, 0, 0.1);
          --shadow-2: inset 0px -1px 0px rgba(0, 0, 0, 0.1);
          --shadow-3: 0px 4px 16px rgba(0, 0, 0, 0.2);

          /* MODAL POSITIONING */
          --modal-z-index: 10;
          --modal-top: unset;
          --modal-right: unset;
          --modal-bottom: unset;
          --modal-left: unset;

          /* MODAL STYLES */
          --modal-backdrop: rgba(0, 0, 0, 0.6);

        }
      </style>
    `;
  const connectModalContEl = configuration.containerElements.connectModal;
  const containerElementQuery = connectModalContEl || state$1.get().accountCenter.containerElement || "body";
  const containerElement = document.querySelector(containerElementQuery);
  if (!containerElement) {
    throw new Error(`Element with query ${containerElementQuery} does not exist.`);
  }
  containerElement.appendChild(onboard2);
  const app = new Index({
    target
  });
  return app;
}
const injected = injectedModule();
const wallets = [
  injected
];
const chains = [
  {
    id: "0x1",
    token: "ETH",
    label: "Ethereum Mainnet"
    //rpcUrl: `https://mainnet.infura.io/v3/${INFURA_ID}`
  }
];
const appMetadata = {
  name: "Conectar Wallet BFA",
  description: "Conecte su wallet y firme para registrar en BFA",
  recommendedInjectedWallets: [
    { name: "MetaMask", url: "https://metamask.io" }
  ]
};
const onboard = init({
  notify: {
    enabled: false
  },
  wallets,
  connect: {
    autoConnectLastWallet: true,
    showSidebar: true
  },
  chains,
  theme: "system",
  appMetadata
});
const SignMessage = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_wallets;
  let { wallets: wallets2 } = $$props;
  $$unsubscribe_wallets = subscribe$1(wallets2, (value) => value);
  let wallet2;
  if ($$props.wallets === void 0 && $$bindings.wallets && wallets2 !== void 0)
    $$bindings.wallets(wallets2);
  $$unsubscribe_wallets();
  return `<div class="max-w-2xl mx-auto text-center"><div><label for="message" class="block mb-2 text-md font-medium text-gray-900 dark:text-gray-400" data-svelte-h="svelte-1ww8j75">Si desea, ingrese un mensaje a firmar <span class="text-red-400 text-sm">(es opcional)</span></label> <textarea id="message" rows="2" class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="">${escape("")}</textarea></div> ${`<button class="mt-5 text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2 text-center mr-2 mb-2" data-svelte-h="svelte-n4ecn5">Haga click para firmar</button>`} <label class="mt-8 block mb-2 text-md font-medium text-gray-900 dark:text-gray-400">Firma:
    <textarea disabled rows="4" class="mt-2 block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Aquí aparecerá la firma">${escape("")}</textarea></label> <div class="mt-2 text-sm text-gray-300 dark:text-gray-500"><p data-svelte-h="svelte-3rdwhh">Wallet conectada:</p> <p>${escape(wallet2)}</p></div></div>`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let wallets2;
  let $wallets, $$unsubscribe_wallets = noop$1, $$subscribe_wallets = () => ($$unsubscribe_wallets(), $$unsubscribe_wallets = subscribe$1(wallets2, ($$value) => $wallets = $$value), wallets2);
  $$subscribe_wallets(wallets2 = onboard.state.select("wallets"));
  $$unsubscribe_wallets();
  return `<div class="h-screen w-full py-10 px-8 flex flex-col justify-between"><header data-svelte-h="svelte-1vcx3eg"><h1 class="text-center text-4xl text-yellow-200">Herramienta de firma con wallet integrada</h1> <h2 class="text-center text-lg">Conecte su wallet para firmar un mensaje y obtener los datos para registrar su wallet en BFA</h2></header> ${$wallets?.[0]?.provider ? `${validate_component(SignMessage, "SignMessage").$$render($$result, { wallets: wallets2 }, {}, {})}` : `<div class="justify-center text-center"><button class="p-8 text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800 font-medium rounded-lg text-md px-8 py-5 text-center mr-2 mb-2" data-svelte-h="svelte-9njcf5">Conectar wallet</button></div>`} <section class="flex flex-col align-center justify-center mx-auto space-y-6" data-svelte-h="svelte-16liyz3"><h3 class="text-center text-2xl text-yellow-200">Para qué todo esto?</h3> <ul class="space-y-2 justify-center"><li class="flex items-center"><svg class="w-3.5 h-3.5 mr-2 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"></path></svg> <span class="ml-2 italic">Facilita el registro de las personas en la BFA</span></li> <li class="flex items-center"><svg class="w-3.5 h-3.5 mr-2 text-gray-500 dark:text-gray-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"></path></svg> <span class="ml-2 italic">El proceso oficial es menos accesible, requiere instalar herramientas y utilizar scripts.</span></li> <li class="flex items-center"><svg class="w-3.5 h-3.5 mr-2 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"></path></svg> <span class="ml-2 italic">Puede utilizar su wallet de Metamask y registrar los datos en el sitio web oficial de BFA</span></li></ul></section></div>`;
});
export {
  $format as $,
  unrecognizedChainStyle as A,
  BN_BOOST_INFO_URL as B,
  text as C,
  set_style as D,
  toggle_class as E,
  poweredByBlocknative as F,
  stop_propagation as G,
  is_function as H,
  update_keyed_each as I,
  outro_and_destroy_block as J,
  set_data as K,
  add_render_callback as L,
  create_bidirectional_transition as M,
  quartOut as N,
  fly as O,
  run_all as P,
  binding_callbacks as Q,
  bind as R,
  SvelteComponent as S,
  add_flush_callback as T,
  SuccessStatusIcon as U,
  questionIcon as V,
  WalletAppBadge as W,
  disconnect as X,
  configuration as Y,
  updateChainRPC as Z,
  BN_BOOST_RPC_URL as _,
  append_styles as a,
  bubble as a0,
  connect$1 as a1,
  shortenDomain as a2,
  create_in_transition as a3,
  fade as a4,
  create_out_transition as a5,
  shortenAddress as a6,
  destroy_each as a7,
  Modal as a8,
  setChain as a9,
  toHexString as aA,
  defaultNotifyEventStyles as aB,
  $locale as aC,
  Page as aD,
  selectAccounts as aa,
  connectWallet$ as ab,
  setPrimaryWallet as ac,
  copyWalletAddress as ad,
  connectedToValidAppChain as ae,
  null_to_empty as af,
  select_option as ag,
  destroy_block as ah,
  chainIdToLabel as ai,
  handle_promise as aj,
  update_await_block_branch as ak,
  isSVG as al,
  src_url_equal as am,
  HtmlTag as an,
  fix_position as ao,
  add_transform as ap,
  create_animation as aq,
  fix_and_outro_and_destroy_block as ar,
  cubicOut as as,
  chainStyles as at,
  networkToChainId as au,
  transactions$ as av,
  removeNotification as aw,
  removeTransaction as ax,
  addCustomNotification as ay,
  gweiToWeiHex as az,
  space as b,
  attr as c,
  insert as d,
  element as e,
  append as f,
  group_outros as g,
  transition_out as h,
  init$1 as i,
  check_outros as j,
  detach as k,
  listen as l,
  state$1 as m,
  component_subscribe as n,
  onDestroy as o,
  create_component as p,
  mount_component as q,
  destroy_component as r,
  safe_not_equal as s,
  transition_in as t,
  updateAccountCenter as u,
  noop as v,
  empty as w,
  wallets$ as x,
  getDefaultChainStyles as y,
  en as z
};
