
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
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

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
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
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
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
        flushing = false;
        seen_callbacks.clear();
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
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
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
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
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
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
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
                    config = config();
                    wait().then(go);
                }
                else {
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
        let config = fn(node, params);
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
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
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
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
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
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
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
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
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
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
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

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    var SECTOR;
    (function (SECTOR) {
        SECTOR["GOOD"] = "good";
        SECTOR["NEUTRAL"] = "neutral";
        SECTOR["BAD"] = "bad";
    })(SECTOR || (SECTOR = {}));

    var CONTRACT;
    (function (CONTRACT) {
        CONTRACT["FULL_TIME"] = "full_time";
        CONTRACT["PART_TIME"] = "part_time";
        CONTRACT["FREELANCE"] = "freelance";
    })(CONTRACT || (CONTRACT = {}));

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /* @license
    Papa Parse
    v5.3.1
    https://github.com/mholt/PapaParse
    License: MIT
    */

    var papaparse_min = createCommonjsModule(function (module, exports) {
    !function(e,t){module.exports=t();}(commonjsGlobal,function s(){var f="undefined"!=typeof self?self:"undefined"!=typeof window?window:void 0!==f?f:{};var n=!f.document&&!!f.postMessage,o=n&&/blob:/i.test((f.location||{}).protocol),a={},h=0,b={parse:function(e,t){var i=(t=t||{}).dynamicTyping||!1;M(i)&&(t.dynamicTypingFunction=i,i={});if(t.dynamicTyping=i,t.transform=!!M(t.transform)&&t.transform,t.worker&&b.WORKERS_SUPPORTED){var r=function(){if(!b.WORKERS_SUPPORTED)return !1;var e=(i=f.URL||f.webkitURL||null,r=s.toString(),b.BLOB_URL||(b.BLOB_URL=i.createObjectURL(new Blob(["(",r,")();"],{type:"text/javascript"})))),t=new f.Worker(e);var i,r;return t.onmessage=_,t.id=h++,a[t.id]=t}();return r.userStep=t.step,r.userChunk=t.chunk,r.userComplete=t.complete,r.userError=t.error,t.step=M(t.step),t.chunk=M(t.chunk),t.complete=M(t.complete),t.error=M(t.error),delete t.worker,void r.postMessage({input:e,config:t,workerId:r.id})}var n=null;b.NODE_STREAM_INPUT,"string"==typeof e?n=t.download?new l(t):new p(t):!0===e.readable&&M(e.read)&&M(e.on)?n=new g(t):(f.File&&e instanceof File||e instanceof Object)&&(n=new c(t));return n.stream(e)},unparse:function(e,t){var n=!1,_=!0,m=",",y="\r\n",s='"',a=s+s,i=!1,r=null,o=!1;!function(){if("object"!=typeof t)return;"string"!=typeof t.delimiter||b.BAD_DELIMITERS.filter(function(e){return -1!==t.delimiter.indexOf(e)}).length||(m=t.delimiter);("boolean"==typeof t.quotes||"function"==typeof t.quotes||Array.isArray(t.quotes))&&(n=t.quotes);"boolean"!=typeof t.skipEmptyLines&&"string"!=typeof t.skipEmptyLines||(i=t.skipEmptyLines);"string"==typeof t.newline&&(y=t.newline);"string"==typeof t.quoteChar&&(s=t.quoteChar);"boolean"==typeof t.header&&(_=t.header);if(Array.isArray(t.columns)){if(0===t.columns.length)throw new Error("Option columns is empty");r=t.columns;}void 0!==t.escapeChar&&(a=t.escapeChar+s);"boolean"==typeof t.escapeFormulae&&(o=t.escapeFormulae);}();var h=new RegExp(j(s),"g");"string"==typeof e&&(e=JSON.parse(e));if(Array.isArray(e)){if(!e.length||Array.isArray(e[0]))return u(null,e,i);if("object"==typeof e[0])return u(r||Object.keys(e[0]),e,i)}else if("object"==typeof e)return "string"==typeof e.data&&(e.data=JSON.parse(e.data)),Array.isArray(e.data)&&(e.fields||(e.fields=e.meta&&e.meta.fields),e.fields||(e.fields=Array.isArray(e.data[0])?e.fields:"object"==typeof e.data[0]?Object.keys(e.data[0]):[]),Array.isArray(e.data[0])||"object"==typeof e.data[0]||(e.data=[e.data])),u(e.fields||[],e.data||[],i);throw new Error("Unable to serialize unrecognized input");function u(e,t,i){var r="";"string"==typeof e&&(e=JSON.parse(e)),"string"==typeof t&&(t=JSON.parse(t));var n=Array.isArray(e)&&0<e.length,s=!Array.isArray(t[0]);if(n&&_){for(var a=0;a<e.length;a++)0<a&&(r+=m),r+=v(e[a],a);0<t.length&&(r+=y);}for(var o=0;o<t.length;o++){var h=n?e.length:t[o].length,u=!1,f=n?0===Object.keys(t[o]).length:0===t[o].length;if(i&&!n&&(u="greedy"===i?""===t[o].join("").trim():1===t[o].length&&0===t[o][0].length),"greedy"===i&&n){for(var d=[],l=0;l<h;l++){var c=s?e[l]:l;d.push(t[o][c]);}u=""===d.join("").trim();}if(!u){for(var p=0;p<h;p++){0<p&&!f&&(r+=m);var g=n&&s?e[p]:p;r+=v(t[o][g],p);}o<t.length-1&&(!i||0<h&&!f)&&(r+=y);}}return r}function v(e,t){if(null==e)return "";if(e.constructor===Date)return JSON.stringify(e).slice(1,25);!0===o&&"string"==typeof e&&null!==e.match(/^[=+\-@].*$/)&&(e="'"+e);var i=e.toString().replace(h,a),r="boolean"==typeof n&&n||"function"==typeof n&&n(e,t)||Array.isArray(n)&&n[t]||function(e,t){for(var i=0;i<t.length;i++)if(-1<e.indexOf(t[i]))return !0;return !1}(i,b.BAD_DELIMITERS)||-1<i.indexOf(m)||" "===i.charAt(0)||" "===i.charAt(i.length-1);return r?s+i+s:i}}};if(b.RECORD_SEP=String.fromCharCode(30),b.UNIT_SEP=String.fromCharCode(31),b.BYTE_ORDER_MARK="\ufeff",b.BAD_DELIMITERS=["\r","\n",'"',b.BYTE_ORDER_MARK],b.WORKERS_SUPPORTED=!n&&!!f.Worker,b.NODE_STREAM_INPUT=1,b.LocalChunkSize=10485760,b.RemoteChunkSize=5242880,b.DefaultDelimiter=",",b.Parser=E,b.ParserHandle=i,b.NetworkStreamer=l,b.FileStreamer=c,b.StringStreamer=p,b.ReadableStreamStreamer=g,f.jQuery){var d=f.jQuery;d.fn.parse=function(o){var i=o.config||{},h=[];return this.each(function(e){if(!("INPUT"===d(this).prop("tagName").toUpperCase()&&"file"===d(this).attr("type").toLowerCase()&&f.FileReader)||!this.files||0===this.files.length)return !0;for(var t=0;t<this.files.length;t++)h.push({file:this.files[t],inputElem:this,instanceConfig:d.extend({},i)});}),e(),this;function e(){if(0!==h.length){var e,t,i,r,n=h[0];if(M(o.before)){var s=o.before(n.file,n.inputElem);if("object"==typeof s){if("abort"===s.action)return e="AbortError",t=n.file,i=n.inputElem,r=s.reason,void(M(o.error)&&o.error({name:e},t,i,r));if("skip"===s.action)return void u();"object"==typeof s.config&&(n.instanceConfig=d.extend(n.instanceConfig,s.config));}else if("skip"===s)return void u()}var a=n.instanceConfig.complete;n.instanceConfig.complete=function(e){M(a)&&a(e,n.file,n.inputElem),u();},b.parse(n.file,n.instanceConfig);}else M(o.complete)&&o.complete();}function u(){h.splice(0,1),e();}};}function u(e){this._handle=null,this._finished=!1,this._completed=!1,this._halted=!1,this._input=null,this._baseIndex=0,this._partialLine="",this._rowCount=0,this._start=0,this._nextChunk=null,this.isFirstChunk=!0,this._completeResults={data:[],errors:[],meta:{}},function(e){var t=w(e);t.chunkSize=parseInt(t.chunkSize),e.step||e.chunk||(t.chunkSize=null);this._handle=new i(t),(this._handle.streamer=this)._config=t;}.call(this,e),this.parseChunk=function(e,t){if(this.isFirstChunk&&M(this._config.beforeFirstChunk)){var i=this._config.beforeFirstChunk(e);void 0!==i&&(e=i);}this.isFirstChunk=!1,this._halted=!1;var r=this._partialLine+e;this._partialLine="";var n=this._handle.parse(r,this._baseIndex,!this._finished);if(!this._handle.paused()&&!this._handle.aborted()){var s=n.meta.cursor;this._finished||(this._partialLine=r.substring(s-this._baseIndex),this._baseIndex=s),n&&n.data&&(this._rowCount+=n.data.length);var a=this._finished||this._config.preview&&this._rowCount>=this._config.preview;if(o)f.postMessage({results:n,workerId:b.WORKER_ID,finished:a});else if(M(this._config.chunk)&&!t){if(this._config.chunk(n,this._handle),this._handle.paused()||this._handle.aborted())return void(this._halted=!0);n=void 0,this._completeResults=void 0;}return this._config.step||this._config.chunk||(this._completeResults.data=this._completeResults.data.concat(n.data),this._completeResults.errors=this._completeResults.errors.concat(n.errors),this._completeResults.meta=n.meta),this._completed||!a||!M(this._config.complete)||n&&n.meta.aborted||(this._config.complete(this._completeResults,this._input),this._completed=!0),a||n&&n.meta.paused||this._nextChunk(),n}this._halted=!0;},this._sendError=function(e){M(this._config.error)?this._config.error(e):o&&this._config.error&&f.postMessage({workerId:b.WORKER_ID,error:e,finished:!1});};}function l(e){var r;(e=e||{}).chunkSize||(e.chunkSize=b.RemoteChunkSize),u.call(this,e),this._nextChunk=n?function(){this._readChunk(),this._chunkLoaded();}:function(){this._readChunk();},this.stream=function(e){this._input=e,this._nextChunk();},this._readChunk=function(){if(this._finished)this._chunkLoaded();else {if(r=new XMLHttpRequest,this._config.withCredentials&&(r.withCredentials=this._config.withCredentials),n||(r.onload=v(this._chunkLoaded,this),r.onerror=v(this._chunkError,this)),r.open(this._config.downloadRequestBody?"POST":"GET",this._input,!n),this._config.downloadRequestHeaders){var e=this._config.downloadRequestHeaders;for(var t in e)r.setRequestHeader(t,e[t]);}if(this._config.chunkSize){var i=this._start+this._config.chunkSize-1;r.setRequestHeader("Range","bytes="+this._start+"-"+i);}try{r.send(this._config.downloadRequestBody);}catch(e){this._chunkError(e.message);}n&&0===r.status&&this._chunkError();}},this._chunkLoaded=function(){4===r.readyState&&(r.status<200||400<=r.status?this._chunkError():(this._start+=this._config.chunkSize?this._config.chunkSize:r.responseText.length,this._finished=!this._config.chunkSize||this._start>=function(e){var t=e.getResponseHeader("Content-Range");if(null===t)return -1;return parseInt(t.substring(t.lastIndexOf("/")+1))}(r),this.parseChunk(r.responseText)));},this._chunkError=function(e){var t=r.statusText||e;this._sendError(new Error(t));};}function c(e){var r,n;(e=e||{}).chunkSize||(e.chunkSize=b.LocalChunkSize),u.call(this,e);var s="undefined"!=typeof FileReader;this.stream=function(e){this._input=e,n=e.slice||e.webkitSlice||e.mozSlice,s?((r=new FileReader).onload=v(this._chunkLoaded,this),r.onerror=v(this._chunkError,this)):r=new FileReaderSync,this._nextChunk();},this._nextChunk=function(){this._finished||this._config.preview&&!(this._rowCount<this._config.preview)||this._readChunk();},this._readChunk=function(){var e=this._input;if(this._config.chunkSize){var t=Math.min(this._start+this._config.chunkSize,this._input.size);e=n.call(e,this._start,t);}var i=r.readAsText(e,this._config.encoding);s||this._chunkLoaded({target:{result:i}});},this._chunkLoaded=function(e){this._start+=this._config.chunkSize,this._finished=!this._config.chunkSize||this._start>=this._input.size,this.parseChunk(e.target.result);},this._chunkError=function(){this._sendError(r.error);};}function p(e){var i;u.call(this,e=e||{}),this.stream=function(e){return i=e,this._nextChunk()},this._nextChunk=function(){if(!this._finished){var e,t=this._config.chunkSize;return t?(e=i.substring(0,t),i=i.substring(t)):(e=i,i=""),this._finished=!i,this.parseChunk(e)}};}function g(e){u.call(this,e=e||{});var t=[],i=!0,r=!1;this.pause=function(){u.prototype.pause.apply(this,arguments),this._input.pause();},this.resume=function(){u.prototype.resume.apply(this,arguments),this._input.resume();},this.stream=function(e){this._input=e,this._input.on("data",this._streamData),this._input.on("end",this._streamEnd),this._input.on("error",this._streamError);},this._checkIsFinished=function(){r&&1===t.length&&(this._finished=!0);},this._nextChunk=function(){this._checkIsFinished(),t.length?this.parseChunk(t.shift()):i=!0;},this._streamData=v(function(e){try{t.push("string"==typeof e?e:e.toString(this._config.encoding)),i&&(i=!1,this._checkIsFinished(),this.parseChunk(t.shift()));}catch(e){this._streamError(e);}},this),this._streamError=v(function(e){this._streamCleanUp(),this._sendError(e);},this),this._streamEnd=v(function(){this._streamCleanUp(),r=!0,this._streamData("");},this),this._streamCleanUp=v(function(){this._input.removeListener("data",this._streamData),this._input.removeListener("end",this._streamEnd),this._input.removeListener("error",this._streamError);},this);}function i(m){var a,o,h,r=Math.pow(2,53),n=-r,s=/^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/,u=/^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/,t=this,i=0,f=0,d=!1,e=!1,l=[],c={data:[],errors:[],meta:{}};if(M(m.step)){var p=m.step;m.step=function(e){if(c=e,_())g();else {if(g(),0===c.data.length)return;i+=e.data.length,m.preview&&i>m.preview?o.abort():(c.data=c.data[0],p(c,t));}};}function y(e){return "greedy"===m.skipEmptyLines?""===e.join("").trim():1===e.length&&0===e[0].length}function g(){if(c&&h&&(k("Delimiter","UndetectableDelimiter","Unable to auto-detect delimiting character; defaulted to '"+b.DefaultDelimiter+"'"),h=!1),m.skipEmptyLines)for(var e=0;e<c.data.length;e++)y(c.data[e])&&c.data.splice(e--,1);return _()&&function(){if(!c)return;function e(e,t){M(m.transformHeader)&&(e=m.transformHeader(e,t)),l.push(e);}if(Array.isArray(c.data[0])){for(var t=0;_()&&t<c.data.length;t++)c.data[t].forEach(e);c.data.splice(0,1);}else c.data.forEach(e);}(),function(){if(!c||!m.header&&!m.dynamicTyping&&!m.transform)return c;function e(e,t){var i,r=m.header?{}:[];for(i=0;i<e.length;i++){var n=i,s=e[i];m.header&&(n=i>=l.length?"__parsed_extra":l[i]),m.transform&&(s=m.transform(s,n)),s=v(n,s),"__parsed_extra"===n?(r[n]=r[n]||[],r[n].push(s)):r[n]=s;}return m.header&&(i>l.length?k("FieldMismatch","TooManyFields","Too many fields: expected "+l.length+" fields but parsed "+i,f+t):i<l.length&&k("FieldMismatch","TooFewFields","Too few fields: expected "+l.length+" fields but parsed "+i,f+t)),r}var t=1;!c.data.length||Array.isArray(c.data[0])?(c.data=c.data.map(e),t=c.data.length):c.data=e(c.data,0);m.header&&c.meta&&(c.meta.fields=l);return f+=t,c}()}function _(){return m.header&&0===l.length}function v(e,t){return i=e,m.dynamicTypingFunction&&void 0===m.dynamicTyping[i]&&(m.dynamicTyping[i]=m.dynamicTypingFunction(i)),!0===(m.dynamicTyping[i]||m.dynamicTyping)?"true"===t||"TRUE"===t||"false"!==t&&"FALSE"!==t&&(function(e){if(s.test(e)){var t=parseFloat(e);if(n<t&&t<r)return !0}return !1}(t)?parseFloat(t):u.test(t)?new Date(t):""===t?null:t):t;var i;}function k(e,t,i,r){var n={type:e,code:t,message:i};void 0!==r&&(n.row=r),c.errors.push(n);}this.parse=function(e,t,i){var r=m.quoteChar||'"';if(m.newline||(m.newline=function(e,t){e=e.substring(0,1048576);var i=new RegExp(j(t)+"([^]*?)"+j(t),"gm"),r=(e=e.replace(i,"")).split("\r"),n=e.split("\n"),s=1<n.length&&n[0].length<r[0].length;if(1===r.length||s)return "\n";for(var a=0,o=0;o<r.length;o++)"\n"===r[o][0]&&a++;return a>=r.length/2?"\r\n":"\r"}(e,r)),h=!1,m.delimiter)M(m.delimiter)&&(m.delimiter=m.delimiter(e),c.meta.delimiter=m.delimiter);else {var n=function(e,t,i,r,n){var s,a,o,h;n=n||[",","\t","|",";",b.RECORD_SEP,b.UNIT_SEP];for(var u=0;u<n.length;u++){var f=n[u],d=0,l=0,c=0;o=void 0;for(var p=new E({comments:r,delimiter:f,newline:t,preview:10}).parse(e),g=0;g<p.data.length;g++)if(i&&y(p.data[g]))c++;else {var _=p.data[g].length;l+=_,void 0!==o?0<_&&(d+=Math.abs(_-o),o=_):o=_;}0<p.data.length&&(l/=p.data.length-c),(void 0===a||d<=a)&&(void 0===h||h<l)&&1.99<l&&(a=d,s=f,h=l);}return {successful:!!(m.delimiter=s),bestDelimiter:s}}(e,m.newline,m.skipEmptyLines,m.comments,m.delimitersToGuess);n.successful?m.delimiter=n.bestDelimiter:(h=!0,m.delimiter=b.DefaultDelimiter),c.meta.delimiter=m.delimiter;}var s=w(m);return m.preview&&m.header&&s.preview++,a=e,o=new E(s),c=o.parse(a,t,i),g(),d?{meta:{paused:!0}}:c||{meta:{paused:!1}}},this.paused=function(){return d},this.pause=function(){d=!0,o.abort(),a=M(m.chunk)?"":a.substring(o.getCharIndex());},this.resume=function(){t.streamer._halted?(d=!1,t.streamer.parseChunk(a,!0)):setTimeout(t.resume,3);},this.aborted=function(){return e},this.abort=function(){e=!0,o.abort(),c.meta.aborted=!0,M(m.complete)&&m.complete(c),a="";};}function j(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function E(e){var S,O=(e=e||{}).delimiter,x=e.newline,I=e.comments,T=e.step,D=e.preview,A=e.fastMode,L=S=void 0===e.quoteChar?'"':e.quoteChar;if(void 0!==e.escapeChar&&(L=e.escapeChar),("string"!=typeof O||-1<b.BAD_DELIMITERS.indexOf(O))&&(O=","),I===O)throw new Error("Comment character same as delimiter");!0===I?I="#":("string"!=typeof I||-1<b.BAD_DELIMITERS.indexOf(I))&&(I=!1),"\n"!==x&&"\r"!==x&&"\r\n"!==x&&(x="\n");var F=0,z=!1;this.parse=function(r,t,i){if("string"!=typeof r)throw new Error("Input must be a string");var n=r.length,e=O.length,s=x.length,a=I.length,o=M(T),h=[],u=[],f=[],d=F=0;if(!r)return C();if(A||!1!==A&&-1===r.indexOf(S)){for(var l=r.split(x),c=0;c<l.length;c++){if(f=l[c],F+=f.length,c!==l.length-1)F+=x.length;else if(i)return C();if(!I||f.substring(0,a)!==I){if(o){if(h=[],k(f.split(O)),R(),z)return C()}else k(f.split(O));if(D&&D<=c)return h=h.slice(0,D),C(!0)}}return C()}for(var p=r.indexOf(O,F),g=r.indexOf(x,F),_=new RegExp(j(L)+j(S),"g"),m=r.indexOf(S,F);;)if(r[F]!==S)if(I&&0===f.length&&r.substring(F,F+a)===I){if(-1===g)return C();F=g+s,g=r.indexOf(x,F),p=r.indexOf(O,F);}else if(-1!==p&&(p<g||-1===g))f.push(r.substring(F,p)),F=p+e,p=r.indexOf(O,F);else {if(-1===g)break;if(f.push(r.substring(F,g)),w(g+s),o&&(R(),z))return C();if(D&&h.length>=D)return C(!0)}else for(m=F,F++;;){if(-1===(m=r.indexOf(S,m+1)))return i||u.push({type:"Quotes",code:"MissingQuotes",message:"Quoted field unterminated",row:h.length,index:F}),E();if(m===n-1)return E(r.substring(F,m).replace(_,S));if(S!==L||r[m+1]!==L){if(S===L||0===m||r[m-1]!==L){-1!==p&&p<m+1&&(p=r.indexOf(O,m+1)),-1!==g&&g<m+1&&(g=r.indexOf(x,m+1));var y=b(-1===g?p:Math.min(p,g));if(r[m+1+y]===O){f.push(r.substring(F,m).replace(_,S)),r[F=m+1+y+e]!==S&&(m=r.indexOf(S,F)),p=r.indexOf(O,F),g=r.indexOf(x,F);break}var v=b(g);if(r.substring(m+1+v,m+1+v+s)===x){if(f.push(r.substring(F,m).replace(_,S)),w(m+1+v+s),p=r.indexOf(O,F),m=r.indexOf(S,F),o&&(R(),z))return C();if(D&&h.length>=D)return C(!0);break}u.push({type:"Quotes",code:"InvalidQuotes",message:"Trailing quote on quoted field is malformed",row:h.length,index:F}),m++;}}else m++;}return E();function k(e){h.push(e),d=F;}function b(e){var t=0;if(-1!==e){var i=r.substring(m+1,e);i&&""===i.trim()&&(t=i.length);}return t}function E(e){return i||(void 0===e&&(e=r.substring(F)),f.push(e),F=n,k(f),o&&R()),C()}function w(e){F=e,k(f),f=[],g=r.indexOf(x,F);}function C(e){return {data:h,errors:u,meta:{delimiter:O,linebreak:x,aborted:z,truncated:!!e,cursor:d+(t||0)}}}function R(){T(C()),h=[],u=[];}},this.abort=function(){z=!0;},this.getCharIndex=function(){return F};}function _(e){var t=e.data,i=a[t.workerId],r=!1;if(t.error)i.userError(t.error,t.file);else if(t.results&&t.results.data){var n={abort:function(){r=!0,m(t.workerId,{data:[],errors:[],meta:{aborted:!0}});},pause:y,resume:y};if(M(i.userStep)){for(var s=0;s<t.results.data.length&&(i.userStep({data:t.results.data[s],errors:t.results.errors,meta:t.results.meta},n),!r);s++);delete t.results;}else M(i.userChunk)&&(i.userChunk(t.results,n,t.file),delete t.results);}t.finished&&!r&&m(t.workerId,t.results);}function m(e,t){var i=a[e];M(i.userComplete)&&i.userComplete(t),i.terminate(),delete a[e];}function y(){throw new Error("Not implemented.")}function w(e){if("object"!=typeof e||null===e)return e;var t=Array.isArray(e)?[]:{};for(var i in e)t[i]=w(e[i]);return t}function v(e,t){return function(){e.apply(t,arguments);}}function M(e){return "function"==typeof e}return o&&(f.onmessage=function(e){var t=e.data;void 0===b.WORKER_ID&&t&&(b.WORKER_ID=t.workerId);if("string"==typeof t.input)f.postMessage({workerId:b.WORKER_ID,results:b.parse(t.input,t.config),finished:!0});else if(f.File&&t.input instanceof File||t.input instanceof Object){var i=b.parse(t.input,t.config);i&&f.postMessage({workerId:b.WORKER_ID,results:i,finished:!0});}}),(l.prototype=Object.create(u.prototype)).constructor=l,(c.prototype=Object.create(u.prototype)).constructor=c,(p.prototype=Object.create(p.prototype)).constructor=p,(g.prototype=Object.create(u.prototype)).constructor=g,b});
    });

    /* src/CSVDownloader.svelte generated by Svelte v3.44.2 */
    const file$2 = "src/CSVDownloader.svelte";

    function create_fragment$2(ctx) {
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", "btn btn-outline-primary");
    			add_location(button, file$2, 37, 0, 996);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*download*/ ctx[3](/*data*/ ctx[0], /*filename*/ ctx[1], /*bom*/ ctx[2]))) /*download*/ ctx[3](/*data*/ ctx[0], /*filename*/ ctx[1], /*bom*/ ctx[2]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 32)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[5],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[5])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CSVDownloader', slots, ['default']);
    	let { data } = $$props;
    	let { filename = 'filename' } = $$props;
    	let { type = 'link' } = $$props;
    	let { bom = 2 } = $$props;

    	function download(data, filename, bom) {
    		const bomCode = bom ? '\ufeff' : '';
    		let csvContent = null;

    		if (typeof data === 'object') {
    			csvContent = papaparse_min.unparse(data);
    		} else {
    			csvContent = data;
    		}

    		const csvData = new Blob([`${bomCode}${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    		let csvURL = null;

    		if (navigator.msSaveBlob) {
    			csvURL = navigator.msSaveBlob(csvData, `${filename}.csv`);
    		} else {
    			csvURL = window.URL.createObjectURL(csvData);
    		}

    		const link = document.createElement('a');
    		link.href = csvURL;
    		link.setAttribute('download', `${filename}.csv`);
    		link.click();
    		link.remove();
    	}

    	const writable_props = ['data', 'filename', 'type', 'bom'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CSVDownloader> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('filename' in $$props) $$invalidate(1, filename = $$props.filename);
    		if ('type' in $$props) $$invalidate(4, type = $$props.type);
    		if ('bom' in $$props) $$invalidate(2, bom = $$props.bom);
    		if ('$$scope' in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		PapaParse: papaparse_min,
    		data,
    		filename,
    		type,
    		bom,
    		download
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('filename' in $$props) $$invalidate(1, filename = $$props.filename);
    		if ('type' in $$props) $$invalidate(4, type = $$props.type);
    		if ('bom' in $$props) $$invalidate(2, bom = $$props.bom);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, filename, bom, download, type, $$scope, slots];
    }

    class CSVDownloader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { data: 0, filename: 1, type: 4, bom: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CSVDownloader",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !('data' in props)) {
    			console.warn("<CSVDownloader> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<CSVDownloader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<CSVDownloader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get filename() {
    		throw new Error("<CSVDownloader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set filename(value) {
    		throw new Error("<CSVDownloader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<CSVDownloader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<CSVDownloader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bom() {
    		throw new Error("<CSVDownloader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bom(value) {
    		throw new Error("<CSVDownloader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const GAME_OVER_SECTOR = "je crois profondément que pour bien travailler il faut croire en ce que l'on fait.\nMalheureusement, ce secteur d'activités ne correspond pas à mes valeurs.";
    const GAME_OVER_LOCATION = "je ne souhaite pas déménager aujourd'hui.";
    const GAME_OVER_LOCATION_REMOTE = GAME_OVER_LOCATION + "\nle nombre de journées que vous proposez en télétravail m'obligerai à passer beaucoup de temps dans les tra,sports.";
    const GAME_OVER_HL = "je tiens à poursuivre mon engagement dans le milieu associatif ce qui fait que je ne peux accepter un contrat de travail à temps plein.";

    /* src/About.svelte generated by Svelte v3.44.2 */

    const file$1 = "src/About.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t4;
    	let a0;
    	let t6;
    	let t7;
    	let p2;
    	let t8;
    	let a1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "A propos";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Aucune données n'a été récoltés sur vos choix de réponses. Il y a juste un Google Analytics qui me permet d'avoir des data sur le taux de transformation de ce questionnaire";
    			t3 = space();
    			p1 = element("p");
    			t4 = text("Ce questionnaire a été programmé grace à ");
    			a0 = element("a");
    			a0.textContent = "Svelte";
    			t6 = text(".");
    			t7 = space();
    			p2 = element("p");
    			t8 = text("Vous pouvez retrouver le code source sur ");
    			a1 = element("a");
    			a1.textContent = "Github";
    			attr_dev(h3, "class", "pb-3 border-bottom border-primary");
    			add_location(h3, file$1, 1, 4, 27);
    			attr_dev(p0, "class", "lead");
    			add_location(p0, file$1, 2, 4, 91);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "href", "https://svelte.dev/");
    			add_location(a0, file$1, 3, 61, 345);
    			attr_dev(p1, "class", "lead");
    			add_location(p1, file$1, 3, 4, 288);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "href", "https://github.com/giraud-d/job");
    			add_location(a1, file$1, 4, 61, 468);
    			attr_dev(p2, "class", "lead");
    			add_location(p2, file$1, 4, 4, 411);
    			attr_dev(div, "class", "row mt-5");
    			add_location(div, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);
    			append_dev(div, p0);
    			append_dev(div, t3);
    			append_dev(div, p1);
    			append_dev(p1, t4);
    			append_dev(p1, a0);
    			append_dev(p1, t6);
    			append_dev(div, t7);
    			append_dev(div, p2);
    			append_dev(p2, t8);
    			append_dev(p2, a1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.2 */
    const file = "src/App.svelte";

    // (138:8) {#if p1Name}
    function create_if_block_11(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let div0;
    	let p;
    	let t3;
    	let input;
    	let t4;
    	let button;
    	let t6;
    	let div1_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*p1InvalidName*/ ctx[1] && create_if_block_12(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Bonjour";
    			t1 = space();
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "Merci de renseigner votre nom ou celui de votre entreprise";
    			t3 = space();
    			input = element("input");
    			t4 = space();
    			button = element("button");
    			button.textContent = "Valider";
    			t6 = space();
    			if (if_block) if_block.c();
    			attr_dev(h1, "class", "pb-4 mb-5 border-bottom border-primary");
    			add_location(h1, file, 139, 16, 3592);
    			attr_dev(p, "class", "lead");
    			add_location(p, file, 141, 20, 3710);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "placeholder", "Nom");
    			add_location(input, file, 142, 20, 3809);
    			attr_dev(button, "class", "mt-3 btn btn-outline-primary");
    			attr_dev(button, "type", "button");
    			add_location(button, file, 145, 20, 3968);
    			attr_dev(div0, "class", "row");
    			add_location(div0, file, 140, 16, 3672);
    			add_location(div1, file, 138, 12, 3531);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(div0, t3);
    			append_dev(div0, input);
    			set_input_value(input, /*employerName*/ ctx[15]);
    			append_dev(div0, t4);
    			append_dev(div0, button);
    			append_dev(div0, t6);
    			if (if_block) if_block.m(div0, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[29]),
    					listen_dev(button, "click", /*handleP1Name*/ ctx[21], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*employerName*/ 32768 && input.value !== /*employerName*/ ctx[15]) {
    				set_input_value(input, /*employerName*/ ctx[15]);
    			}

    			if (/*p1InvalidName*/ ctx[1]) {
    				if (if_block) ; else {
    					if_block = create_if_block_12(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (div1_outro) div1_outro.end(1);
    			current = true;
    		},
    		o: function outro(local) {
    			div1_outro = create_out_transition(div1, fade, { delay: 0, duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			if (detaching && div1_outro) div1_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(138:8) {#if p1Name}",
    		ctx
    	});

    	return block;
    }

    // (148:20) {#if p1InvalidName}
    function create_if_block_12(ctx) {
    	let div;
    	let t0;
    	let br;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Merci de remplir votre nom");
    			br = element("br");
    			t1 = text("\n                            Aucune donnée n'est conservée sur ce site");
    			add_location(br, file, 149, 54, 4258);
    			attr_dev(div, "class", "mt-3 alert alert-danger");
    			attr_dev(div, "role", "alert");
    			add_location(div, file, 148, 24, 4153);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, br);
    			append_dev(div, t1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(148:20) {#if p1InvalidName}",
    		ctx
    	});

    	return block;
    }

    // (158:8) {#if p1Explication}
    function create_if_block_10(ctx) {
    	let div1;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let div0;
    	let p0;
    	let t5;
    	let p1;
    	let t7;
    	let button;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			t0 = text("Bienvenue ");
    			t1 = text(/*employerName*/ ctx[15]);
    			t2 = text(" !");
    			t3 = space();
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Avant de vous parler un peu plus de moi, je souhaiterais savoir un peu plus ce que\n                        vous me proposez.";
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = "Cela vous fera gagner du temps, car si le type d'emploi que vous me proposez ne me\n                        convient pas nous le saurons très rapidement.";
    			t7 = space();
    			button = element("button");
    			button.textContent = "Commencer (2~5 min)";
    			attr_dev(h1, "class", "pb-4 mb-5 border-bottom border-primary");
    			add_location(h1, file, 159, 16, 4592);
    			attr_dev(p0, "class", "lead");
    			add_location(p0, file, 161, 20, 4729);
    			attr_dev(p1, "class", "lead");
    			add_location(p1, file, 163, 20, 4894);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "mt-3 btn btn-outline-primary");
    			add_location(button, file, 165, 20, 5087);
    			attr_dev(div0, "class", "row");
    			add_location(div0, file, 160, 16, 4691);
    			add_location(div1, file, 158, 12, 4487);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t5);
    			append_dev(div0, p1);
    			append_dev(div0, t7);
    			append_dev(div0, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handleP1Explication*/ ctx[22], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*employerName*/ 32768) set_data_dev(t1, /*employerName*/ ctx[15]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				div1_intro = create_in_transition(div1, fade, { delay: 500, duration: 1000 });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fade, { delay: 0, duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_outro) div1_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(158:8) {#if p1Explication}",
    		ctx
    	});

    	return block;
    }

    // (173:8) {#if p2Sector}
    function create_if_block_9(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let p;
    	let i;
    	let t3;
    	let div0;
    	let button0;
    	let t5;
    	let button1;
    	let t7;
    	let button2;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Quel est votre secteur d'activité ?";
    			t1 = space();
    			p = element("p");
    			i = element("i");
    			i.textContent = "La matrice utilisée ici, pour classer les secteurs d'activités, est totalement\n                    subjective et n'a pas vocation à stigmatiser qui que ce soit.";
    			t3 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Economie\n                        Sociale & Solidaire, Transition Ecologique, Social, Service Publique, ...";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Banque, Finance,\n                        Energie Fossile, Armement, Tourisme de masse, ...";
    			t7 = space();
    			button2 = element("button");
    			button2.textContent = "Autre";
    			attr_dev(h1, "class", "pb-4 mb-5 border-bottom border-primary");
    			add_location(h1, file, 174, 16, 5449);
    			add_location(i, file, 175, 32, 5573);
    			attr_dev(p, "class", "lead");
    			add_location(p, file, 175, 16, 5557);
    			attr_dev(button0, "class", "btn btn-outline-primary");
    			add_location(button0, file, 179, 20, 5843);
    			attr_dev(button1, "class", "btn btn-outline-primary");
    			add_location(button1, file, 182, 20, 6085);
    			attr_dev(button2, "class", "btn btn-outline-primary");
    			add_location(button2, file, 185, 20, 6310);
    			attr_dev(div0, "class", "d-grid gap-lg-4 col-12 mx-auto");
    			add_location(div0, file, 178, 16, 5778);
    			add_location(div1, file, 173, 12, 5344);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, p);
    			append_dev(p, i);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t5);
    			append_dev(div0, button1);
    			append_dev(div0, t7);
    			append_dev(div0, button2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[30], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[31], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[32], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				div1_intro = create_in_transition(div1, fade, { delay: 500, duration: 1000 });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fade, { delay: 0, duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_outro) div1_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(173:8) {#if p2Sector}",
    		ctx
    	});

    	return block;
    }

    // (193:8) {#if p2Contract}
    function create_if_block_8(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let div0;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let button2;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Quel type de contrat ?";
    			t1 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Temps plein";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Temps partiel";
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "Freelance";
    			attr_dev(h1, "class", "pb-4 mb-5 border-bottom border-primary");
    			add_location(h1, file, 194, 16, 6634);
    			attr_dev(button0, "class", "btn btn-outline-primary");
    			add_location(button0, file, 196, 20, 6794);
    			attr_dev(button1, "class", "btn btn-outline-primary");
    			add_location(button1, file, 199, 20, 6975);
    			attr_dev(button2, "class", "btn btn-outline-primary");
    			add_location(button2, file, 202, 20, 7158);
    			attr_dev(div0, "class", "d-grid gap-sm-4 col-12 mx-auto");
    			add_location(div0, file, 195, 16, 6729);
    			add_location(div1, file, 193, 12, 6529);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t3);
    			append_dev(div0, button1);
    			append_dev(div0, t5);
    			append_dev(div0, button2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_3*/ ctx[33], false, false, false),
    					listen_dev(button1, "click", /*click_handler_4*/ ctx[34], false, false, false),
    					listen_dev(button2, "click", /*click_handler_5*/ ctx[35], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				div1_intro = create_in_transition(div1, fade, { delay: 500, duration: 1000 });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fade, { delay: 0, duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_outro) div1_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(193:8) {#if p2Contract}",
    		ctx
    	});

    	return block;
    }

    // (210:8) {#if p2Remote}
    function create_if_block_6(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let div0;
    	let p0;
    	let t2;
    	let b0;
    	let t4;
    	let b1;
    	let t6;
    	let p1;
    	let i;
    	let t8;
    	let t9;
    	let input;
    	let t10;
    	let p2;
    	let b2;
    	let t11;
    	let t12;
    	let t13;
    	let button;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*contract*/ ctx[17] === CONTRACT.PART_TIME && create_if_block_7(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Quelle est votre politique de télétravail ?";
    			t1 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t2 = text("Il s'agit d'une ");
    			b0 = element("b");
    			b0.textContent = "moyenne hebdomadaire";
    			t4 = text(" du nombre de ");
    			b1 = element("b");
    			b1.textContent = "journées\n                        télétravaillées.";
    			t6 = space();
    			p1 = element("p");
    			i = element("i");
    			i.textContent = "Si par exemple vous travaillez avec des sprints de trois semaines et que vous\n                        souhaitez que l'équipe se réunisse deux jours consécutifs pour des cérémonies vous pouvez\n                        sélectionner 4j/5.";
    			t8 = space();
    			if (if_block) if_block.c();
    			t9 = space();
    			input = element("input");
    			t10 = space();
    			p2 = element("p");
    			b2 = element("b");
    			t11 = text(/*p2RemoteVal*/ ctx[6]);
    			t12 = text(" jours de télétravail");
    			t13 = space();
    			button = element("button");
    			button.textContent = "Valider";
    			attr_dev(h1, "class", "pb-4 mb-5 border-bottom border-primary");
    			add_location(h1, file, 211, 16, 7514);
    			add_location(b0, file, 213, 52, 7700);
    			add_location(b1, file, 213, 93, 7741);
    			attr_dev(p0, "class", "lead");
    			add_location(p0, file, 213, 20, 7668);
    			add_location(i, file, 215, 36, 7838);
    			attr_dev(p1, "class", "lead");
    			add_location(p1, file, 215, 20, 7822);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", "0");
    			attr_dev(input, "max", "5");
    			add_location(input, file, 224, 20, 8495);
    			add_location(b2, file, 225, 36, 8587);
    			attr_dev(p2, "class", "lead");
    			add_location(p2, file, 225, 20, 8571);
    			attr_dev(button, "class", "btn btn-outline-primary");
    			add_location(button, file, 226, 20, 8653);
    			attr_dev(div0, "class", "row");
    			add_location(div0, file, 212, 16, 7630);
    			add_location(div1, file, 210, 12, 7409);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t2);
    			append_dev(p0, b0);
    			append_dev(p0, t4);
    			append_dev(p0, b1);
    			append_dev(div0, t6);
    			append_dev(div0, p1);
    			append_dev(p1, i);
    			append_dev(div0, t8);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div0, t9);
    			append_dev(div0, input);
    			set_input_value(input, /*p2RemoteVal*/ ctx[6]);
    			append_dev(div0, t10);
    			append_dev(div0, p2);
    			append_dev(p2, b2);
    			append_dev(b2, t11);
    			append_dev(b2, t12);
    			append_dev(div0, t13);
    			append_dev(div0, button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[36]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[36]),
    					listen_dev(button, "click", /*click_handler_6*/ ctx[37], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*contract*/ ctx[17] === CONTRACT.PART_TIME) {
    				if (if_block) ; else {
    					if_block = create_if_block_7(ctx);
    					if_block.c();
    					if_block.m(div0, t9);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty[0] & /*p2RemoteVal*/ 64) {
    				set_input_value(input, /*p2RemoteVal*/ ctx[6]);
    			}

    			if (!current || dirty[0] & /*p2RemoteVal*/ 64) set_data_dev(t11, /*p2RemoteVal*/ ctx[6]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				div1_intro = create_in_transition(div1, fade, { delay: 500, duration: 1000 });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fade, { delay: 0, duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			if (detaching && div1_outro) div1_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(210:8) {#if p2Remote}",
    		ctx
    	});

    	return block;
    }

    // (219:20) {#if contract === CONTRACT.PART_TIME}
    function create_if_block_7(ctx) {
    	let div;
    	let t0;
    	let i;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Cas particulier du temps partiel : Merci de faire au prorata sur une semaine de 5j\n                            ");
    			i = element("i");
    			i.textContent = "(désolé je n'ai pas codé ce cas particulier #80/20)";
    			t2 = text(".");
    			add_location(i, file, 221, 28, 8357);
    			attr_dev(div, "class", "mt-3 alert alert-warning");
    			attr_dev(div, "role", "alert");
    			add_location(div, file, 219, 24, 8166);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, i);
    			append_dev(div, t2);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(219:20) {#if contract === CONTRACT.PART_TIME}",
    		ctx
    	});

    	return block;
    }

    // (233:8) {#if p2Location}
    function create_if_block_4(ctx) {
    	let div5;
    	let h1;
    	let t1;
    	let div4;
    	let div1;
    	let div0;
    	let button0;
    	let t3;
    	let div3;
    	let div2;
    	let p;
    	let t5;
    	let input;
    	let t6;
    	let button1;
    	let t8;
    	let div5_intro;
    	let div5_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*p2InvalidLocation*/ ctx[8] && create_if_block_5(ctx);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Localisation";
    			t1 = space();
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Département de Loire-Atlantique";
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			p = element("p");
    			p.textContent = "Si vous n'êtes pas dans le département de Loire-Atlantique merci de préciser\n                                l'emplacement des bureaux";
    			t5 = space();
    			input = element("input");
    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "Valider";
    			t8 = space();
    			if (if_block) if_block.c();
    			attr_dev(h1, "class", "pb-4 mb-5 border-bottom border-primary");
    			add_location(h1, file, 234, 16, 8975);
    			attr_dev(button0, "class", "btn btn-outline-primary");
    			add_location(button0, file, 238, 28, 9188);
    			attr_dev(div0, "class", "row");
    			add_location(div0, file, 237, 24, 9142);
    			attr_dev(div1, "class", "col-6");
    			add_location(div1, file, 236, 20, 9098);
    			attr_dev(p, "class", "lead");
    			add_location(p, file, 245, 28, 9539);
    			attr_dev(input, "class", "form-control mt-4");
    			attr_dev(input, "placeholder", "Ville, Pays");
    			attr_dev(input, "type", "text");
    			add_location(input, file, 247, 28, 9722);
    			attr_dev(button1, "class", "mt-3 btn btn-outline-primary");
    			attr_dev(button1, "type", "button");
    			add_location(button1, file, 249, 28, 9879);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file, 244, 24, 9493);
    			attr_dev(div3, "class", "col-6");
    			add_location(div3, file, 243, 20, 9449);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file, 235, 16, 9060);
    			add_location(div5, file, 233, 12, 8870);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, h1);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, p);
    			append_dev(div2, t5);
    			append_dev(div2, input);
    			set_input_value(input, /*location*/ ctx[19]);
    			append_dev(div2, t6);
    			append_dev(div2, button1);
    			append_dev(div2, t8);
    			if (if_block) if_block.m(div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_7*/ ctx[38], false, false, false),
    					listen_dev(input, "input", /*input_input_handler_1*/ ctx[39]),
    					listen_dev(button1, "click", /*click_handler_8*/ ctx[40], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*location*/ 524288 && input.value !== /*location*/ ctx[19]) {
    				set_input_value(input, /*location*/ ctx[19]);
    			}

    			if (/*p2InvalidLocation*/ ctx[8]) {
    				if (if_block) ; else {
    					if_block = create_if_block_5(ctx);
    					if_block.c();
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div5_outro) div5_outro.end(1);
    				div5_intro = create_in_transition(div5, fade, { delay: 500, duration: 1000 });
    				div5_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div5_intro) div5_intro.invalidate();
    			div5_outro = create_out_transition(div5, fade, { delay: 0, duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if (if_block) if_block.d();
    			if (detaching && div5_outro) div5_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(233:8) {#if p2Location}",
    		ctx
    	});

    	return block;
    }

    // (254:28) {#if p2InvalidLocation}
    function create_if_block_5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Merci de renseigner un lieu";
    			attr_dev(div, "class", "mt-3 alert alert-danger");
    			attr_dev(div, "role", "alert");
    			add_location(div, file, 254, 32, 10181);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(254:28) {#if p2InvalidLocation}",
    		ctx
    	});

    	return block;
    }

    // (265:8) {#if p2LocationRemoteDilemma}
    function create_if_block_3(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let div0;
    	let p0;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let p1;
    	let t7;
    	let p2;
    	let t9;
    	let button0;
    	let t11;
    	let button1;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Tension : Localisation/Télétravail";
    			t1 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t2 = text("Votre bureau est en dehors de mon département et vous me proposer en\n                        moyenne ");
    			t3 = text(/*remote*/ ctx[18]);
    			t4 = text(" jours de télétravail par semaines.");
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = "Je ne souhaite pas déménager, ni passer beaucoup de temps dans les transports.";
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "Consentez-vous à passer en moyenne quatre jours de télétravail par semaine ?";
    			t9 = space();
    			button0 = element("button");
    			button0.textContent = "Oui";
    			t11 = space();
    			button1 = element("button");
    			button1.textContent = "Non";
    			attr_dev(h1, "class", "pb-4 mb-5 border-bottom border-primary");
    			add_location(h1, file, 266, 16, 10639);
    			attr_dev(p0, "class", "lead");
    			add_location(p0, file, 268, 20, 10807);
    			attr_dev(p1, "class", "lead");
    			add_location(p1, file, 270, 20, 10992);
    			attr_dev(p2, "class", "lead");
    			add_location(p2, file, 271, 20, 11111);
    			attr_dev(button0, "class", "col-4 m-3 btn btn-outline-primary");
    			add_location(button0, file, 272, 20, 11228);
    			attr_dev(button1, "class", "col-4 m-3 btn btn-outline-primary");
    			add_location(button1, file, 276, 20, 11438);
    			attr_dev(div0, "class", "row justify-content-center");
    			add_location(div0, file, 267, 16, 10746);
    			add_location(div1, file, 265, 12, 10534);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(div0, t5);
    			append_dev(div0, p1);
    			append_dev(div0, t7);
    			append_dev(div0, p2);
    			append_dev(div0, t9);
    			append_dev(div0, button0);
    			append_dev(div0, t11);
    			append_dev(div0, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_9*/ ctx[41], false, false, false),
    					listen_dev(button1, "click", /*click_handler_10*/ ctx[42], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*remote*/ 262144) set_data_dev(t3, /*remote*/ ctx[18]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				div1_intro = create_in_transition(div1, fade, { delay: 500, duration: 1000 });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fade, { delay: 0, duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_outro) div1_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(265:8) {#if p2LocationRemoteDilemma}",
    		ctx
    	});

    	return block;
    }

    // (285:8) {#if p3HL}
    function create_if_block_2(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let div0;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;
    	let t7;
    	let button0;
    	let t9;
    	let button1;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Temps partiel";
    			t1 = space();
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Je suis bénévole dans l'association Hameaux Légers avec un engagement d'un jour par\n                        semaine.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Afin de pouvoir continuer mon engagement dans cette association j'ai besoin d'avoir\n                        un contrat maximum de quatre jours par semaines.";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "Est ce que cela est compatible avec votre offre d'emploi ?";
    			t7 = space();
    			button0 = element("button");
    			button0.textContent = "Oui";
    			t9 = space();
    			button1 = element("button");
    			button1.textContent = "Non";
    			attr_dev(h1, "class", "pb-4 mb-5 border-bottom border-primary");
    			add_location(h1, file, 286, 16, 11822);
    			attr_dev(p0, "class", "lead");
    			add_location(p0, file, 288, 20, 11946);
    			attr_dev(p1, "class", "lead");
    			add_location(p1, file, 290, 20, 12103);
    			attr_dev(p2, "class", "lead");
    			add_location(p2, file, 292, 20, 12300);
    			attr_dev(button0, "class", "col-4 m-3 btn btn-outline-primary");
    			add_location(button0, file, 293, 20, 12399);
    			attr_dev(button1, "class", "col-4 m-3 btn btn-outline-primary");
    			add_location(button1, file, 297, 20, 12590);
    			attr_dev(div0, "class", "row");
    			add_location(div0, file, 287, 16, 11908);
    			add_location(div1, file, 285, 12, 11717);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t3);
    			append_dev(div0, p1);
    			append_dev(div0, t5);
    			append_dev(div0, p2);
    			append_dev(div0, t7);
    			append_dev(div0, button0);
    			append_dev(div0, t9);
    			append_dev(div0, button1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_11*/ ctx[43], false, false, false),
    					listen_dev(button1, "click", /*click_handler_12*/ ctx[44], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				div1_intro = create_in_transition(div1, fade, { delay: 500, duration: 1000 });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fade, { delay: 0, duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_outro) div1_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(285:8) {#if p3HL}",
    		ctx
    	});

    	return block;
    }

    // (306:8) {#if p9Result}
    function create_if_block_1(ctx) {
    	let div5;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let div4;
    	let p0;
    	let t4;
    	let csvdownloader;
    	let t5;
    	let div3;
    	let p1;
    	let t7;
    	let p2;
    	let t9;
    	let div1;
    	let h60;
    	let t11;
    	let div0;
    	let a;
    	let t13;
    	let p3;
    	let kbd0;
    	let t15;
    	let div2;
    	let h61;
    	let t17;
    	let p4;
    	let kbd1;
    	let t19;
    	let kbd2;
    	let t21;
    	let t22;
    	let p5;
    	let t23;
    	let kbd3;
    	let t25;
    	let del;
    	let t27;
    	let div5_intro;
    	let div5_outro;
    	let current;

    	csvdownloader = new CSVDownloader({
    			props: {
    				data: [
    					{
    						"employerName": /*employerName*/ ctx[15],
    						"sector": /*sector*/ ctx[16],
    						"contract": /*contract*/ ctx[17],
    						"remote": /*remote*/ ctx[18],
    						"loaction": /*location*/ ctx[19],
    						"locationRemoteDilemma": /*locationRemoteDilemma*/ ctx[20]
    					}
    				],
    				type: 'button',
    				filename: 'filename',
    				bom: true,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			h1 = element("h1");
    			t0 = text("Merci ");
    			t1 = text(/*employerName*/ ctx[15]);
    			t2 = space();
    			div4 = element("div");
    			p0 = element("p");
    			p0.textContent = "Le questionnaire se clot ici. Pour me contacter merci de télécharger le fichier CSV\n                        ci dessous";
    			t4 = space();
    			create_component(csvdownloader.$$.fragment);
    			t5 = space();
    			div3 = element("div");
    			p1 = element("p");
    			p1.textContent = "J'auto construit en ce moment ma maison la fin de chantier est prévu pour cet\n                            été. Je serai disponible à partir de septembre (sauf mission à temps partielles et\n                            freelance)";
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "Pour prendre contact merci de m'envoyer un courriel à :";
    			t9 = space();
    			div1 = element("div");
    			h60 = element("h6");
    			h60.textContent = "Méthode Semi-Auto";
    			t11 = space();
    			div0 = element("div");
    			a = element("a");
    			a.textContent = "Lien mailto";
    			t13 = space();
    			p3 = element("p");
    			kbd0 = element("kbd");
    			kbd0.textContent = "avec le fichier .csv en pièce jointe";
    			t15 = space();
    			div2 = element("div");
    			h61 = element("h6");
    			h61.textContent = "Méthode Manuelle";
    			t17 = space();
    			p4 = element("p");
    			kbd1 = element("kbd");
    			kbd1.textContent = "damien@giraudet.me";
    			t19 = text(" avec comme préfixe à votre objet\n                                ");
    			kbd2 = element("kbd");
    			kbd2.textContent = "[job-success-v1.1]";
    			t21 = text(".");
    			t22 = space();
    			p5 = element("p");
    			t23 = text("C'est important de bien mettre ce préfixe à votre objet et\n                                ");
    			kbd3 = element("kbd");
    			kbd3.textContent = "avec le fichier .csv en pièce jointe";
    			t25 = text(" sinon\n                                ");
    			del = element("del");
    			del.textContent = "je";
    			t27 = text("\n                                mon automatisation ne traitera pas le courriel.");
    			attr_dev(h1, "class", "pb-4 mb-5 border-bottom border-primary");
    			add_location(h1, file, 307, 16, 12959);
    			attr_dev(p0, "class", "lead");
    			add_location(p0, file, 309, 20, 13090);
    			attr_dev(p1, "class", "lead");
    			add_location(p1, file, 326, 24, 13939);
    			attr_dev(p2, "class", "lead");
    			add_location(p2, file, 329, 24, 14211);
    			attr_dev(h60, "class", "pb-2 my-3 border-bottom border-primary");
    			add_location(h60, file, 331, 28, 14359);
    			attr_dev(a, "class", "btn btn-outline-primary");
    			attr_dev(a, "href", "mailto:damien@giraudet.me?subject=[job-success-v1.1]");
    			add_location(a, file, 333, 32, 14511);
    			add_location(kbd0, file, 335, 62, 14719);
    			attr_dev(p3, "class", "text-sm-start mt-3");
    			add_location(p3, file, 335, 32, 14689);
    			attr_dev(div0, "class", "row");
    			add_location(div0, file, 332, 28, 14461);
    			attr_dev(div1, "class", "col-5");
    			add_location(div1, file, 330, 24, 14311);
    			attr_dev(h61, "class", "pb-2 my-3 border-bottom border-primary");
    			add_location(h61, file, 339, 28, 14909);
    			add_location(kbd1, file, 340, 52, 15034);
    			add_location(kbd2, file, 341, 32, 15129);
    			attr_dev(p4, "class", "text-justify");
    			add_location(p4, file, 340, 28, 15010);
    			add_location(kbd3, file, 343, 32, 15308);
    			add_location(del, file, 344, 32, 15394);
    			attr_dev(p5, "class", "text-justify");
    			add_location(p5, file, 342, 28, 15192);
    			attr_dev(div2, "class", "col-7");
    			add_location(div2, file, 338, 24, 14861);
    			attr_dev(div3, "class", "row mt-5");
    			add_location(div3, file, 325, 20, 13892);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file, 308, 16, 13052);
    			add_location(div5, file, 306, 12, 12854);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(div5, t2);
    			append_dev(div5, div4);
    			append_dev(div4, p0);
    			append_dev(div4, t4);
    			mount_component(csvdownloader, div4, null);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, p1);
    			append_dev(div3, t7);
    			append_dev(div3, p2);
    			append_dev(div3, t9);
    			append_dev(div3, div1);
    			append_dev(div1, h60);
    			append_dev(div1, t11);
    			append_dev(div1, div0);
    			append_dev(div0, a);
    			append_dev(div0, t13);
    			append_dev(div0, p3);
    			append_dev(p3, kbd0);
    			append_dev(div3, t15);
    			append_dev(div3, div2);
    			append_dev(div2, h61);
    			append_dev(div2, t17);
    			append_dev(div2, p4);
    			append_dev(p4, kbd1);
    			append_dev(p4, t19);
    			append_dev(p4, kbd2);
    			append_dev(p4, t21);
    			append_dev(div2, t22);
    			append_dev(div2, p5);
    			append_dev(p5, t23);
    			append_dev(p5, kbd3);
    			append_dev(p5, t25);
    			append_dev(p5, del);
    			append_dev(p5, t27);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*employerName*/ 32768) set_data_dev(t1, /*employerName*/ ctx[15]);
    			const csvdownloader_changes = {};

    			if (dirty[0] & /*employerName, sector, contract, remote, location, locationRemoteDilemma*/ 2064384) csvdownloader_changes.data = [
    				{
    					"employerName": /*employerName*/ ctx[15],
    					"sector": /*sector*/ ctx[16],
    					"contract": /*contract*/ ctx[17],
    					"remote": /*remote*/ ctx[18],
    					"loaction": /*location*/ ctx[19],
    					"locationRemoteDilemma": /*locationRemoteDilemma*/ ctx[20]
    				}
    			];

    			if (dirty[1] & /*$$scope*/ 262144) {
    				csvdownloader_changes.$$scope = { dirty, ctx };
    			}

    			csvdownloader.$set(csvdownloader_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(csvdownloader.$$.fragment, local);

    			add_render_callback(() => {
    				if (div5_outro) div5_outro.end(1);
    				div5_intro = create_in_transition(div5, fade, { delay: 500, duration: 1000 });
    				div5_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(csvdownloader.$$.fragment, local);
    			if (div5_intro) div5_intro.invalidate();
    			div5_outro = create_out_transition(div5, fade, { delay: 0, duration: 500 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_component(csvdownloader);
    			if (detaching && div5_outro) div5_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(306:8) {#if p9Result}",
    		ctx
    	});

    	return block;
    }

    // (312:20) <CSVDownloader                             data={[{                             "employerName": employerName,                             "sector": sector,                             "contract": contract,                             "remote": remote,                             "loaction": location,                             "locationRemoteDilemma": locationRemoteDilemma                         }]}                             type={'button'}                             filename={'filename'}                             bom={true}>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Télécharger le fichier");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(312:20) <CSVDownloader                             data={[{                             \\\"employerName\\\": employerName,                             \\\"sector\\\": sector,                             \\\"contract\\\": contract,                             \\\"remote\\\": remote,                             \\\"loaction\\\": location,                             \\\"locationRemoteDilemma\\\": locationRemoteDilemma                         }]}                             type={'button'}                             filename={'filename'}                             bom={true}>",
    		ctx
    	});

    	return block;
    }

    // (353:8) {#if p9GameOver}
    function create_if_block(ctx) {
    	let div5;
    	let h1;
    	let t1;
    	let div4;
    	let p0;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let p1;
    	let t6;
    	let t7;
    	let t8;
    	let div3;
    	let p2;
    	let t10;
    	let div1;
    	let h60;
    	let t12;
    	let div0;
    	let a;
    	let t14;
    	let div2;
    	let h61;
    	let t16;
    	let p3;
    	let kbd0;
    	let t18;
    	let kbd1;
    	let t20;
    	let t21;
    	let p4;
    	let t22;
    	let del;
    	let t24;
    	let t25;
    	let about;
    	let div5_intro;
    	let current;
    	about = new About({ $$inline: true });

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Fin du voyage";
    			t1 = space();
    			div4 = element("div");
    			p0 = element("p");
    			t2 = text("Merci ");
    			t3 = text(/*employerName*/ ctx[15]);
    			t4 = text(" d'avoir répondu à ces question.");
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Nous ne pourrons pas travailler ensemble car ");
    			t7 = text(/*p9GameOverExplanation*/ ctx[12]);
    			t8 = space();
    			div3 = element("div");
    			p2 = element("p");
    			p2.textContent = "Si malgré tout vous pensez que nous pourrions tout de même travailler\n                            ensemble vous pouvez m'envoyer un courriel à :";
    			t10 = space();
    			div1 = element("div");
    			h60 = element("h6");
    			h60.textContent = "Méthode Auto";
    			t12 = space();
    			div0 = element("div");
    			a = element("a");
    			a.textContent = "Lien mailto";
    			t14 = space();
    			div2 = element("div");
    			h61 = element("h6");
    			h61.textContent = "Méthode Manuelle";
    			t16 = space();
    			p3 = element("p");
    			kbd0 = element("kbd");
    			kbd0.textContent = "damien@giraudet.me";
    			t18 = text(" avec comme préfixe de votre objet\n                                ");
    			kbd1 = element("kbd");
    			kbd1.textContent = "[job-retry-v1.1]";
    			t20 = text(".");
    			t21 = space();
    			p4 = element("p");
    			t22 = text("C'est important de bien mettre ce préfixe à votre objet sinon\n                                ");
    			del = element("del");
    			del.textContent = "je";
    			t24 = text("\n                                mon automatisation ne traitera pas le courriel.");
    			t25 = space();
    			create_component(about.$$.fragment);
    			attr_dev(h1, "class", "pb-4 mb-5 border-bottom border-primary");
    			add_location(h1, file, 354, 16, 15706);
    			attr_dev(p0, "class", "lead");
    			add_location(p0, file, 356, 20, 15830);
    			attr_dev(p1, "class", "lead");
    			add_location(p1, file, 357, 20, 15923);
    			attr_dev(p2, "class", "text-sm-start");
    			add_location(p2, file, 359, 24, 16074);
    			attr_dev(h60, "class", "pb-2 my-3 border-bottom border-primary");
    			add_location(h60, file, 362, 28, 16320);
    			attr_dev(a, "class", "btn btn-outline-primary");
    			attr_dev(a, "href", "mailto:damien@giraudet.me?subject=[job-retry-v1.1]");
    			add_location(a, file, 364, 32, 16467);
    			attr_dev(div0, "class", "row");
    			add_location(div0, file, 363, 28, 16417);
    			attr_dev(div1, "class", "col-4");
    			add_location(div1, file, 361, 24, 16272);
    			attr_dev(h61, "class", "pb-2 my-3 border-bottom border-primary");
    			add_location(h61, file, 370, 28, 16786);
    			add_location(kbd0, file, 371, 52, 16911);
    			add_location(kbd1, file, 372, 32, 17007);
    			attr_dev(p3, "class", "text-justify");
    			add_location(p3, file, 371, 28, 16887);
    			add_location(del, file, 374, 32, 17187);
    			attr_dev(p4, "class", "text-justify");
    			add_location(p4, file, 373, 28, 17068);
    			attr_dev(div2, "class", "col-8");
    			add_location(div2, file, 369, 24, 16738);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file, 358, 20, 16032);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file, 355, 16, 15792);
    			add_location(div5, file, 353, 12, 15640);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, h1);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, p0);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(div4, t5);
    			append_dev(div4, p1);
    			append_dev(p1, t6);
    			append_dev(p1, t7);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, p2);
    			append_dev(div3, t10);
    			append_dev(div3, div1);
    			append_dev(div1, h60);
    			append_dev(div1, t12);
    			append_dev(div1, div0);
    			append_dev(div0, a);
    			append_dev(div3, t14);
    			append_dev(div3, div2);
    			append_dev(div2, h61);
    			append_dev(div2, t16);
    			append_dev(div2, p3);
    			append_dev(p3, kbd0);
    			append_dev(p3, t18);
    			append_dev(p3, kbd1);
    			append_dev(p3, t20);
    			append_dev(div2, t21);
    			append_dev(div2, p4);
    			append_dev(p4, t22);
    			append_dev(p4, del);
    			append_dev(p4, t24);
    			append_dev(div5, t25);
    			mount_component(about, div5, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*employerName*/ 32768) set_data_dev(t3, /*employerName*/ ctx[15]);
    			if (!current || dirty[0] & /*p9GameOverExplanation*/ 4096) set_data_dev(t7, /*p9GameOverExplanation*/ ctx[12]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(about.$$.fragment, local);

    			if (!div5_intro) {
    				add_render_callback(() => {
    					div5_intro = create_in_transition(div5, fade, { delay: 500, duration: 1000 });
    					div5_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(about.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_component(about);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(353:8) {#if p9GameOver}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div2;
    	let main;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let footer;
    	let div1;
    	let div0;
    	let current;
    	let if_block0 = /*p1Name*/ ctx[0] && create_if_block_11(ctx);
    	let if_block1 = /*p1Explication*/ ctx[2] && create_if_block_10(ctx);
    	let if_block2 = /*p2Sector*/ ctx[3] && create_if_block_9(ctx);
    	let if_block3 = /*p2Contract*/ ctx[4] && create_if_block_8(ctx);
    	let if_block4 = /*p2Remote*/ ctx[5] && create_if_block_6(ctx);
    	let if_block5 = /*p2Location*/ ctx[7] && create_if_block_4(ctx);
    	let if_block6 = /*p2LocationRemoteDilemma*/ ctx[9] && create_if_block_3(ctx);
    	let if_block7 = /*p3HL*/ ctx[10] && create_if_block_2(ctx);
    	let if_block8 = /*p9Result*/ ctx[13] && create_if_block_1(ctx);
    	let if_block9 = /*p9GameOver*/ ctx[11] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			if (if_block4) if_block4.c();
    			t4 = space();
    			if (if_block5) if_block5.c();
    			t5 = space();
    			if (if_block6) if_block6.c();
    			t6 = space();
    			if (if_block7) if_block7.c();
    			t7 = space();
    			if (if_block8) if_block8.c();
    			t8 = space();
    			if (if_block9) if_block9.c();
    			t9 = space();
    			footer = element("footer");
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(main, "class", "3px");
    			add_location(main, file, 136, 4, 3479);
    			attr_dev(div0, "class", "progress-bar progress-bar-striped");
    			attr_dev(div0, "role", "progressbar");
    			set_style(div0, "width", /*progressBar*/ ctx[14] + "%");
    			attr_dev(div0, "aria-valuenow", /*progressBar*/ ctx[14]);
    			attr_dev(div0, "aria-valuemin", "0");
    			attr_dev(div0, "aria-valuemax", "100");
    			add_location(div0, file, 387, 12, 17520);
    			attr_dev(div1, "class", "progress");
    			add_location(div1, file, 386, 8, 17485);
    			attr_dev(footer, "class", "mt-auto text-white-50");
    			add_location(footer, file, 385, 4, 17438);
    			attr_dev(div2, "class", "cover-container d-flex w-100 h-100 p-3 mx-auto flex-column");
    			add_location(div2, file, 135, 0, 3402);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, main);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t0);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t1);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(main, t2);
    			if (if_block3) if_block3.m(main, null);
    			append_dev(main, t3);
    			if (if_block4) if_block4.m(main, null);
    			append_dev(main, t4);
    			if (if_block5) if_block5.m(main, null);
    			append_dev(main, t5);
    			if (if_block6) if_block6.m(main, null);
    			append_dev(main, t6);
    			if (if_block7) if_block7.m(main, null);
    			append_dev(main, t7);
    			if (if_block8) if_block8.m(main, null);
    			append_dev(main, t8);
    			if (if_block9) if_block9.m(main, null);
    			append_dev(div2, t9);
    			append_dev(div2, footer);
    			append_dev(footer, div1);
    			append_dev(div1, div0);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*p1Name*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*p1Name*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_11(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*p1Explication*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*p1Explication*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_10(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*p2Sector*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*p2Sector*/ 8) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_9(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(main, t2);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*p2Contract*/ ctx[4]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*p2Contract*/ 16) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_8(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(main, t3);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*p2Remote*/ ctx[5]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*p2Remote*/ 32) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_6(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(main, t4);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*p2Location*/ ctx[7]) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);

    					if (dirty[0] & /*p2Location*/ 128) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block_4(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(main, t5);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
    				});

    				check_outros();
    			}

    			if (/*p2LocationRemoteDilemma*/ ctx[9]) {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);

    					if (dirty[0] & /*p2LocationRemoteDilemma*/ 512) {
    						transition_in(if_block6, 1);
    					}
    				} else {
    					if_block6 = create_if_block_3(ctx);
    					if_block6.c();
    					transition_in(if_block6, 1);
    					if_block6.m(main, t6);
    				}
    			} else if (if_block6) {
    				group_outros();

    				transition_out(if_block6, 1, 1, () => {
    					if_block6 = null;
    				});

    				check_outros();
    			}

    			if (/*p3HL*/ ctx[10]) {
    				if (if_block7) {
    					if_block7.p(ctx, dirty);

    					if (dirty[0] & /*p3HL*/ 1024) {
    						transition_in(if_block7, 1);
    					}
    				} else {
    					if_block7 = create_if_block_2(ctx);
    					if_block7.c();
    					transition_in(if_block7, 1);
    					if_block7.m(main, t7);
    				}
    			} else if (if_block7) {
    				group_outros();

    				transition_out(if_block7, 1, 1, () => {
    					if_block7 = null;
    				});

    				check_outros();
    			}

    			if (/*p9Result*/ ctx[13]) {
    				if (if_block8) {
    					if_block8.p(ctx, dirty);

    					if (dirty[0] & /*p9Result*/ 8192) {
    						transition_in(if_block8, 1);
    					}
    				} else {
    					if_block8 = create_if_block_1(ctx);
    					if_block8.c();
    					transition_in(if_block8, 1);
    					if_block8.m(main, t8);
    				}
    			} else if (if_block8) {
    				group_outros();

    				transition_out(if_block8, 1, 1, () => {
    					if_block8 = null;
    				});

    				check_outros();
    			}

    			if (/*p9GameOver*/ ctx[11]) {
    				if (if_block9) {
    					if_block9.p(ctx, dirty);

    					if (dirty[0] & /*p9GameOver*/ 2048) {
    						transition_in(if_block9, 1);
    					}
    				} else {
    					if_block9 = create_if_block(ctx);
    					if_block9.c();
    					transition_in(if_block9, 1);
    					if_block9.m(main, null);
    				}
    			} else if (if_block9) {
    				group_outros();

    				transition_out(if_block9, 1, 1, () => {
    					if_block9 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*progressBar*/ 16384) {
    				set_style(div0, "width", /*progressBar*/ ctx[14] + "%");
    			}

    			if (!current || dirty[0] & /*progressBar*/ 16384) {
    				attr_dev(div0, "aria-valuenow", /*progressBar*/ ctx[14]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			transition_in(if_block5);
    			transition_in(if_block6);
    			transition_in(if_block7);
    			transition_in(if_block8);
    			transition_in(if_block9);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			transition_out(if_block6);
    			transition_out(if_block7);
    			transition_out(if_block8);
    			transition_out(if_block9);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			if (if_block7) if_block7.d();
    			if (if_block8) if_block8.d();
    			if (if_block9) if_block9.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const progressBarTotalSteps = 8;

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let p1Name = true;
    	let p1InvalidName = false;
    	let p1Explication = false;
    	let p2Sector = false;
    	let p2Contract = false;
    	let p2Remote = false;
    	let p2RemoteVal = 3;
    	let p2Location = false;
    	let p2InvalidLocation = false;
    	let p2LocationRemoteDilemma = false;
    	let p3HL = false;
    	let p9GameOver = false;
    	let p9GameOverExplanation = "";
    	let p9Result = false;
    	let progressBar = 0;

    	// Job infos
    	let employerName;

    	let sector;
    	let contract;
    	let remote;
    	let location;
    	let locationRemoteDilemma;
    	let HLTimeDilemma = false;

    	function incrementProgressBar() {
    		$$invalidate(14, progressBar += 100 / progressBarTotalSteps);
    	}

    	function finishProgressBar() {
    		$$invalidate(14, progressBar = 100);
    	}

    	function initGameOver(reason) {
    		$$invalidate(12, p9GameOverExplanation = reason);
    		$$invalidate(11, p9GameOver = true);
    		$$invalidate(14, progressBar = 100);
    	}

    	function handleP1Name() {
    		if (!employerName || employerName.length < 3) {
    			$$invalidate(1, p1InvalidName = true);
    		} else {
    			$$invalidate(0, p1Name = false);
    			$$invalidate(2, p1Explication = true);
    			incrementProgressBar();
    		}
    	}

    	function handleP1Explication() {
    		$$invalidate(2, p1Explication = false);
    		$$invalidate(3, p2Sector = true);
    		incrementProgressBar();
    	}

    	function handleP2Sector(val) {
    		$$invalidate(16, sector = val);
    		$$invalidate(3, p2Sector = false);

    		if (val === SECTOR.GOOD || val === SECTOR.NEUTRAL) {
    			$$invalidate(3, p2Sector = false);
    			$$invalidate(4, p2Contract = true);
    			incrementProgressBar();
    		} else initGameOver(GAME_OVER_SECTOR);
    	}

    	function handleP2Contract(val) {
    		$$invalidate(17, contract = val);
    		$$invalidate(4, p2Contract = false);
    		$$invalidate(5, p2Remote = true);
    		incrementProgressBar();
    	}

    	function handleP2Remote(val) {
    		$$invalidate(18, remote = val);
    		$$invalidate(5, p2Remote = false);
    		$$invalidate(7, p2Location = true);
    		incrementProgressBar();
    	}

    	function handleP2Location(val) {
    		if (!val || val !== "44" && val.length < 3) {
    			$$invalidate(8, p2InvalidLocation = true);
    		} else {
    			$$invalidate(19, location = val);
    			$$invalidate(7, p2Location = false);

    			if (val !== "44" && remote < 2) initGameOver(GAME_OVER_LOCATION); else if (val !== "44" && remote < 4) {
    				$$invalidate(20, locationRemoteDilemma = true);
    				$$invalidate(9, p2LocationRemoteDilemma = true);
    			} else {
    				if (contract === CONTRACT.FULL_TIME) {
    					$$invalidate(10, p3HL = true);
    				} else {
    					$$invalidate(13, p9Result = true);
    				}

    				finishProgressBar();
    			}
    		}
    	}

    	function handleP2locationRemoteDilemma(answer) {
    		$$invalidate(9, p2LocationRemoteDilemma = false);

    		if (answer) {
    			$$invalidate(18, remote = 4);

    			if (contract === CONTRACT.FULL_TIME) {
    				$$invalidate(10, p3HL = true);
    			} else {
    				$$invalidate(13, p9Result = true);
    			}

    			finishProgressBar();
    		} else initGameOver(GAME_OVER_LOCATION_REMOTE);
    	}

    	function handleP3HL(val) {
    		$$invalidate(10, p3HL = false);

    		if (!val) {
    			initGameOver(GAME_OVER_HL);
    		} else {
    			HLTimeDilemma = true;
    			finishProgressBar();
    			$$invalidate(13, p9Result = true);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		employerName = this.value;
    		$$invalidate(15, employerName);
    	}

    	const click_handler = () => handleP2Sector(SECTOR.GOOD);
    	const click_handler_1 = () => handleP2Sector(SECTOR.BAD);
    	const click_handler_2 = () => handleP2Sector(SECTOR.NEUTRAL);
    	const click_handler_3 = () => handleP2Contract(CONTRACT.FULL_TIME);
    	const click_handler_4 = () => handleP2Contract(CONTRACT.PART_TIME);
    	const click_handler_5 = () => handleP2Contract(CONTRACT.FREELANCE);

    	function input_change_input_handler() {
    		p2RemoteVal = to_number(this.value);
    		$$invalidate(6, p2RemoteVal);
    	}

    	const click_handler_6 = () => handleP2Remote(p2RemoteVal);
    	const click_handler_7 = () => handleP2Location("44");

    	function input_input_handler_1() {
    		location = this.value;
    		$$invalidate(19, location);
    	}

    	const click_handler_8 = () => handleP2Location(location);
    	const click_handler_9 = () => handleP2locationRemoteDilemma(true);
    	const click_handler_10 = () => handleP2locationRemoteDilemma(false);
    	const click_handler_11 = () => handleP3HL(true);
    	const click_handler_12 = () => handleP3HL(false);

    	$$self.$capture_state = () => ({
    		fade,
    		SECTOR,
    		CONTRACT,
    		CSVDownloader,
    		GAME_OVER_HL,
    		GAME_OVER_LOCATION,
    		GAME_OVER_LOCATION_REMOTE,
    		GAME_OVER_SECTOR,
    		About,
    		p1Name,
    		p1InvalidName,
    		p1Explication,
    		p2Sector,
    		p2Contract,
    		p2Remote,
    		p2RemoteVal,
    		p2Location,
    		p2InvalidLocation,
    		p2LocationRemoteDilemma,
    		p3HL,
    		p9GameOver,
    		p9GameOverExplanation,
    		p9Result,
    		progressBar,
    		progressBarTotalSteps,
    		employerName,
    		sector,
    		contract,
    		remote,
    		location,
    		locationRemoteDilemma,
    		HLTimeDilemma,
    		incrementProgressBar,
    		finishProgressBar,
    		initGameOver,
    		handleP1Name,
    		handleP1Explication,
    		handleP2Sector,
    		handleP2Contract,
    		handleP2Remote,
    		handleP2Location,
    		handleP2locationRemoteDilemma,
    		handleP3HL
    	});

    	$$self.$inject_state = $$props => {
    		if ('p1Name' in $$props) $$invalidate(0, p1Name = $$props.p1Name);
    		if ('p1InvalidName' in $$props) $$invalidate(1, p1InvalidName = $$props.p1InvalidName);
    		if ('p1Explication' in $$props) $$invalidate(2, p1Explication = $$props.p1Explication);
    		if ('p2Sector' in $$props) $$invalidate(3, p2Sector = $$props.p2Sector);
    		if ('p2Contract' in $$props) $$invalidate(4, p2Contract = $$props.p2Contract);
    		if ('p2Remote' in $$props) $$invalidate(5, p2Remote = $$props.p2Remote);
    		if ('p2RemoteVal' in $$props) $$invalidate(6, p2RemoteVal = $$props.p2RemoteVal);
    		if ('p2Location' in $$props) $$invalidate(7, p2Location = $$props.p2Location);
    		if ('p2InvalidLocation' in $$props) $$invalidate(8, p2InvalidLocation = $$props.p2InvalidLocation);
    		if ('p2LocationRemoteDilemma' in $$props) $$invalidate(9, p2LocationRemoteDilemma = $$props.p2LocationRemoteDilemma);
    		if ('p3HL' in $$props) $$invalidate(10, p3HL = $$props.p3HL);
    		if ('p9GameOver' in $$props) $$invalidate(11, p9GameOver = $$props.p9GameOver);
    		if ('p9GameOverExplanation' in $$props) $$invalidate(12, p9GameOverExplanation = $$props.p9GameOverExplanation);
    		if ('p9Result' in $$props) $$invalidate(13, p9Result = $$props.p9Result);
    		if ('progressBar' in $$props) $$invalidate(14, progressBar = $$props.progressBar);
    		if ('employerName' in $$props) $$invalidate(15, employerName = $$props.employerName);
    		if ('sector' in $$props) $$invalidate(16, sector = $$props.sector);
    		if ('contract' in $$props) $$invalidate(17, contract = $$props.contract);
    		if ('remote' in $$props) $$invalidate(18, remote = $$props.remote);
    		if ('location' in $$props) $$invalidate(19, location = $$props.location);
    		if ('locationRemoteDilemma' in $$props) $$invalidate(20, locationRemoteDilemma = $$props.locationRemoteDilemma);
    		if ('HLTimeDilemma' in $$props) HLTimeDilemma = $$props.HLTimeDilemma;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		p1Name,
    		p1InvalidName,
    		p1Explication,
    		p2Sector,
    		p2Contract,
    		p2Remote,
    		p2RemoteVal,
    		p2Location,
    		p2InvalidLocation,
    		p2LocationRemoteDilemma,
    		p3HL,
    		p9GameOver,
    		p9GameOverExplanation,
    		p9Result,
    		progressBar,
    		employerName,
    		sector,
    		contract,
    		remote,
    		location,
    		locationRemoteDilemma,
    		handleP1Name,
    		handleP1Explication,
    		handleP2Sector,
    		handleP2Contract,
    		handleP2Remote,
    		handleP2Location,
    		handleP2locationRemoteDilemma,
    		handleP3HL,
    		input_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		input_change_input_handler,
    		click_handler_6,
    		click_handler_7,
    		input_input_handler_1,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11,
    		click_handler_12
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    let app = new App({
        target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
