/*!
 * Pot.js - JavaScript utility library (lite)
 *
 * Pot.js implements practical tendency as a substitution utility library.
 * That includes asynchronous methods as "Deferred"
 *  for solution to heavy process.
 * That is fully ECMAScript compliant.
 *
 * Version 1.01, 2011-10-07
 * Copyright (c) 2011 polygon planet <polygon.planet@gmail.com>
 * Dual licensed under the MIT and GPL v2 licenses.
 */
/**
 * Project Pot.js
 *
 * @description
 *  <p>
 *  Pot.js implements practical tendency as a substitution utility library.
 *  That includes asynchronous methods as "Deferred"
 *   for solution to heavy process.
 *  That is fully ECMAScript compliant.
 *  </p>
 *
 * @description
 *  <p>
 *  主に非同期/同期/非ブロックでのループ処理を扱うJavaScriptライブラリ
 *  </p>
 *
 *
 * @fileoverview   Pot.js utility library (lite)
 * @author         polygon planet
 * @version        1.01
 * @date           2011-10-07
 * @copyright      Copyright (c) 2011 polygon planet <polygon.planet*gmail.com>
 * @license        Dual licensed under the MIT and GPL v2 licenses.
 *
 * Based:
 *   - JSDeferred
 *       http://github.com/cho45/jsdeferred
 *   - MochiKit.Async
 *       http://mochikit.com/
 *   - jQuery.Deferred
 *       http://jquery.com/
 *   - Tombloo library (Firefox Add-On)
 *       https://github.com/to/tombloo/wiki
 */
/*
 * JSDoc Comment
 * http://code.google.com/intl/ja/closure/compiler/docs/js-for-compiler.html
 */
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
/**
 * @namespace Pot.js
 */
(function(globals, undefined) {

/**
 * Define the object Pot.
 *
 * @name    Pot
 * @type    Object
 * @class
 * @static
 * @public
 */
var Pot = {VERSION : '1.01', TYPE : 'lite'},

// A shortcut of prototype methods.
slice = Array.prototype.slice,
concat = Array.prototype.concat,
toString = Object.prototype.toString,

// Regular expression patterns.
RE_ARRAYLIKE = /List|Collection/i,
RE_TRIM      = /^[\s\u00A0\u3000]+|[\s\u00A0\u3000]+$/g,
RE_RESCAPE   = /([-.*+?^${}()|[\]\/\\])/g,

// Mozilla XPCOM Components.
Ci, Cc, Cr, Cu;

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
(function(nv) {

// Define environment properties.
update(Pot, {
  /**
   * @lends Pot
   */
  /**
   * Name of the Pot.
   *
   * @const
   * @ignore
   */
  NAME : 'Pot',
  /**
   * Execution environment.
   *
   *
   * @example
   *   if (Pot.System.isWebBrowser) {
   *     document.write('on Web Browser');
   *   }
   *
   *
   * @type  Object
   * @class
   * @static
   * @const
   * @public
   *
   * @property {Boolean} isWebBrowser
   *           Whether the environment is running on web browser.
   * @property {Boolean} isNonBrowser
   *           Whether the environment is running on non-browser.
   * @property {Boolean} isNodeJS
   *           Whether the environment is running on Node.js.
   * @property {Boolean} isWaitable
   *           Whether the user agent can to wait as synchronously.
   * @property {Boolean} hasActiveXObject
   *           Whether the environment has ActiveXObject.
   * @property {Boolean} isYieldable
   *            Whether the environment can use "yield" operator.
   */
  System : (function(o) {
    if (typeof window === 'undefined') {
      o.isNonBrowser = true;
    } else {
      o.isWebBrowser = true;
    }
    if (o.isNonBrowser &&
        typeof process !== 'undefined' && process && process.version &&
        typeof require === 'function' &&
        (typeof exports === 'object' ||
        (typeof module === 'object' && typeof module.exports === 'object'))
    ) {
      o.isNodeJS = true;
    }
    if (this && this.ActiveXObject || typeof ActiveXObject !== 'undefined') {
      o.hasActiveXObject = true;
    }
    try {
      if (typeof ((function() { yield; })()).next === 'function') {
        o.isYieldable = true;
      }
    } catch (e) {}
    o.isWaitable = false;
    return o;
  })({}),
  /**
   * toString.
   *
   * @return  Return formatted string of object.
   * @type Function
   * @function
   * @static
   */
  toString : function() {
    return buildObjectString(this.NAME || this.name || typeof this);
  },
  /**
   * Detect the browser running.
   *
   * @example
   *   if (Pot.Browser.firefox) {
   *     debug('Firefox version:' + Pot.Browser.firefox.version);
   *   }
   *
   * @type  Object
   * @static
   * @const
   */
  Browser : (function(n) {
    // Expression from: jquery.browser (based)
    var r = {}, u, m, ua, ver, re, rs, i, len;
    re = {
      webkit  : /(webkit)(?:.*version|)[\s\/]+([\w.]+)/,
      opera   : /(opera)(?:.*version|)[\s\/]+([\w.]+)/,
      msie    : /(msie)[\s\/]+([\w.]+)/,
      mozilla : /(?!^.*compatible.*$).*(mozilla)(?:.*?\s+rv[:\s\/]+([\w.]+)|)/
    };
    rs = [
      /webkit.*(chrome)[\s\/]+([\w.]+)/,
      /webkit.*version[\s\/]+([\w.]+).*(safari)/,
      /webkit.*(safari)[\s\/]+([\w.]+)/,
      /(iphone).*version[\s\/]+([\w.]+)/,
      /(ipod).*version[\s\/]+([\w.]+)/,
      /(ipad).*version[\s\/]+([\w.]+)/,
      /(android).*version[\s\/]+([\w.]+)/,
      /(blackberry)(?:[\s\d]*|.*version)[\s\/]+([\w.]+)/,
      re.webkit,
      re.opera,
      re.msie,
      /(?!^.*compatible.*$).*mozilla.*?(firefox)(?:[\s\/]+([\w.]+)|)/,
      re.mozilla
    ];
    u = String(n && n.userAgent).toLowerCase();
    if (u) {
      for (i = 0, len = rs.length; i < len; i++) {
        if ((m = rs[i].exec(u))) {
          break;
        }
      }
      if (m) {
        if (/[^a-z]/.test(m[1])) {
          ua  = m[2];
          ver = m[1];
        } else {
          ua  = m[1];
          ver = m[2];
        }
        if (ua) {
          r[ua] = {version : String(ver || 0)};
        }
      }
      m = re.webkit.exec(u) || re.opera.exec(u)   ||
          re.msie.exec(u)   || re.mozilla.exec(u) || [];
      if (m && m[1]) {
        r[m[1]] = {version : String(m[2] || 0)};
      }
    }
    return r;
  })(nv),
  /**
   * Detect the browser/user language.
   *
   * @example
   *   if (Pot.LANG == 'ja') {
   *     debug('ハローワールド');
   *   }
   *
   * @type  String
   * @static
   * @const
   */
  LANG : (function(n) {
    return ((n && (n.language || n.userLanguage     ||
            n.browserLanguage || n.systemLanguage)) ||
            'en').split(/[^a-zA-Z0-9]+/).shift().toLowerCase();
  })(nv),
  /**
   * Detect the user operating system.
   *
   * @example
   *   if (Pot.OS.win) {
   *     debug('OS : ' + Pot.OS.toString());
   *   }
   *
   * @type Object
   * @static
   * @const
   */
  OS : (function(nv) {
    var r = {}, n = nv || {}, pf, ua, av, maps, i, len, o;
    pf = String(n.platform).toLowerCase();
    ua = String(n.userAgent).toLowerCase();
    av = String(n.appVersion).toLowerCase();
    maps = [
      {s: 'iphone',     p: pf},
      {s: 'ipod',       p: pf},
      {s: 'ipad',       p: ua},
      {s: 'blackberry', p: ua},
      {s: 'android',    p: ua},
      {s: 'mac',        p: pf},
      {s: 'win',        p: pf},
      {s: 'linux',      p: pf},
      {s: 'x11',        p: av}
    ];
    for (i = 0, len = maps.length; i < len; i++) {
      o = maps[i];
      if (~o.p.indexOf(o.s)) {
        r[o.s] = true;
      }
    }
    if (r.android && !~ua.indexOf('mobile')) {
      r.androidtablet = true;
    }
    if (r.ipad || r.androidtablet) {
      r.tablet = true;
    }
    /**
     * @lends Pot.OS
     *
     * @return {String}  Return the platform as a string.
     */
    r.toString = function() {
      var s = [], p;
      for (p in r) {
        if (r[p] === true) {
          s.push(p);
        }
      }
      return s.join('/');
    };
    return r;
  })(nv),
  /**
   * Global object. (e.g. window)
   *
   * @type Object
   * @static
   * @public
   */
  Global : (function() {
    if (!globals ||
        typeof globals !== 'object' || !('setTimeout' in globals)) {
      globals = this;
    }
    return this;
  })(),
  /**
   * Noop function.
   *
   * @type  Function
   * @function
   * @const
   */
  noop : function() {},
  /**
   * Temporary storage place.
   *
   * @type  Object
   * @private
   * @ignore
   */
  tmp : {},
  /**
   * Treats the internal properties/methods.
   *
   * @internal
   * @type Object
   * @class
   * @private
   * @ignore
   */
  Internal : {
    /**
     * @lends Pot.Internal
     */
    /**
     * Numbering the magic numbers for the constructor.
     *
     * @private
     * @ignore
     */
    getMagicNumber : update(function() {
      var me = arguments.callee;
      return me.INITIAL_NUMBER + (me.count++);
    }, {
      count : 0,
      INITIAL_NUMBER : Number('0xC26BEB642C0A') || (16 ^ 6)
    }),
    /**
     * Get the export object.
     *
     * @private
     * @ignore
     */
    getExportObject : function() {
      var outputs;
      if (Pot.System.isNodeJS) {
        if (typeof module === 'object' &&
            typeof module.exports === 'object') {
          outputs = module.exports;
        } else if (typeof exports === 'object') {
          outputs = exports;
        } else {
          outputs = globals;
        }
      } else {
        outputs = globals;
      }
      return outputs;
    }
  },
  /**
   * Extend target object from arguments.
   *
   *
   * @example
   *   var obj = {foo: 'v1', bar: 'v2'};
   *   var src = {baz: 'v3'};
   *   update(obj, src);
   *   debug(obj);
   *   // @results  obj = {foo: 'v1', bar: 'v2', baz: 'v3'}
   *
   *
   * @param  {Object}     target   Target object.
   * @param  {...Object}  (...)    Subject objects.
   * @return {Object}              Updated object. (first argument).
   * @static
   * @function
   * @public
   */
  update : update
});
})(typeof navigator !== 'undefined' && navigator || {});

/**
 * Creates methods to detect the type definition.
 *
 * <pre>
 * Pot.is*
 *
 *   * ::= Boolean | Number | String | Function |
 *         Array | Date | RegExp | Object | Error
 * </pre>
 *
 *
 * @example
 *   Pot.isString(100);      // false
 *   Pot.isObject('hoge');   // false
 *   Pot.isArray([1, 2, 3]); // true
 *
 *
 * @param  {*}         A target object
 * @return {Boolean}   Returns whether the proper object
 * @lends  Pot
 * @static
 * @public
 *
 * @property {Function} isBoolean  Detect the Boolean type. (static)
 * @property {Function} isNumber   Detect the Number type. (static)
 * @property {Function} isString   Detect the String type. (static)
 * @property {Function} isFunction Detect the Function type. (static)
 * @property {Function} isArray    Detect the Array type. (static)
 * @property {Function} isDate     Detect the Date type. (static)
 * @property {Function} isRegExp   Detect the RegExp type. (static)
 * @property {Function} isObject   Detect the Object type. (static)
 * @property {Function} isError    Detect the Error type. (static)
 */
(function(types) {
  var i, len, typeMaps = {};
  for (i = 0, len = types.length; i < len; i++) {
    (function() {
      var type = types[i], low = type.toLowerCase();
      typeMaps[buildObjectString(type)] = low;
      Pot['is' + type] = (function() {
        switch (low) {
          case 'error':
              return function(o) {
                return (o && (o instanceof Error ||
                        Pot.typeOf(o) === low))  || false;
              };
          case 'date':
              return function(o) {
                return (o && (o instanceof Date ||
                        Pot.typeOf(o) === low)) || false;
              };
          default:
              return function(o) {
                return Pot.typeOf(o) === low;
              };
        }
      })();
    })();
  }
  Pot.update({
    /**
     * @lends Pot
     */
    /**
     * Get the object type as string.
     *
     * <pre>
     * The return types:
     *   'boolean', 'number', 'string',   'function',
     *   'array',   'date',   'regexp',   'object',
     *   'error',   'null',   'undefined'
     * </pre>
     *
     *
     * @example
     *   debug( Pot.typeOf([1, 2, 3]) );
     *   // @results 'array'
     *
     *
     * @param  {*}       o  A target object.
     * @return {String}     Return the type of object.
     * @static
     * @function
     * @public
     */
    typeOf : function(o) {
      return o == null ? String(o) : (typeMaps[toString.call(o)] || 'object');
    },
    /**
     * Get the object type like of array or any types.
     *
     * <pre>
     * The return types:
     *   'boolean', 'number', 'string',   'function',
     *   'array',   'date',   'regexp',   'object',
     *   'error',   'null',   'undefined'
     * </pre>
     *
     *
     * @example
     *   (function() {
     *     debug( Pot.typeLikeOf(arguments) );
     *     // @results 'array'
     *   })();
     *
     *
     * @param  {*}       o  A target object.
     * @return {String}     Return the type of object.
     * @static
     * @function
     * @public
     */
    typeLikeOf : function(o) {
      var type = Pot.typeOf(o);
      if (type !== 'array' && Pot.isArrayLike(o)) {
        type = 'array';
      }
      return type;
    }
  });
})('Boolean Number String Function Array Date RegExp Object Error'.split(' '));
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
(function(SI) {
// Aggregate in this obejct for global functions. (HTML5 Task)
update(Pot.Internal, {
  /**
   * @lends Pot.Internal
   */
  /**
   * Alias for window.setTimeout function. (for non-window-environment)
   *
   * @type  Function
   * @function
   * @static
   * @private
   * @ignore
   */
  setTimeout : function(func, msec) {
    try {
      return setTimeout(func, msec || 0);
    } catch (e) {}
  },
  /**
   * Alias for window.clearTimeout function. (for non-window-environment)
   *
   * @type  Function
   * @function
   * @static
   * @private
   * @ignore
   */
  clearTimeout : function(id) {
    try {
      return clearTimeout(id);
    } catch (e) {}
  },
  /**
   * Alias for window.setInterval function. (for non-window-environment)
   *
   * @type  Function
   * @function
   * @static
   * @private
   * @ignore
   */
  setInterval : function(func, msec) {
    try {
      return setInterval(func, msec || 0);
    } catch (e) {}
  },
  /**
   * Alias for window.clearInterval function. (for non-window-environment)
   *
   * @type  Function
   * @function
   * @static
   * @private
   * @ignore
   */
  clearInterval : function(id) {
    try {
      return clearInterval(id);
    } catch (e) {}
  }
});

// Define distinction of types.
Pot.update({
  /**
   * @lends Pot
   */
  /**
   * Emulate StopIteration.
   *
   *
   * @example
   *   Pot.forEach([1, 2, 3, 4, 5], function(v) {
   *     if (v > 2) {
   *       throw Pot.StopIteration;
   *     }
   *     debug(v);
   *   });
   *
   *
   * @type  Object
   * @static
   * @const
   * @public
   */
  StopIteration : (function() {
    var StopIteration = function() {
      return StopIteration;
    };
    (function(s) {
      s.NAME = SI;
      s.toString = Pot.toString;
      s.prototype = {
        constructor : s,
        NAME        : s.NAME,
        toString    : s.toString
      };
      s.prototype.constructor.prototype = s.constructor.prototype;
    })(StopIteration);
    return new StopIteration();
  })(),
  /**
   * Return whether the argument is StopIteration or not.
   *
   *
   * @example
   *   try {
   *     for (var i = 0; i < 10; i++) {
   *       if (i > 5) {
   *         throw Pot.StopIteration;
   *       }
   *       debug(i);
   *     }
   *   } catch (e) {
   *     if (Pot.isStopIter(e)) {
   *       debug('StopIteration was thrown!');
   *     } else {
   *       throw e;
   *     }
   *   }
   *
   *
   * @param  {*}         o   Target object.
   * @return {Boolean}       Return true if argument is StopIteration.
   * @type Function
   * @function
   * @static
   * @public
   */
  isStopIter : function(o) {
    var result = false;
    try {
      if (Pot.StopIteration !== undefined &&
          (o == Pot.StopIteration || o instanceof Pot.StopIteration)) {
        result = true;
      } else if (typeof StopIteration !== 'undefined' &&
                 (o == StopIteration || o instanceof StopIteration)) {
        result = true;
      } else if (this && this.StopIteration !== undefined &&
                (o == this.StopIteration || o instanceof this.StopIteration)) {
        result = true;
      } else if (~toString.call(o).indexOf(SI) ||
                 ~String(o && o.toString && o.toString() || o).indexOf(SI)) {
        result = true;
      }
    } catch (e) {
      result = false;
    }
    return result;
  },
  /**
   * Return whether the argument object like Array (i.e. iterable)
   *
   *
   * @example
   *   (function() {
   *     debug(Pot.isArray(arguments));
   *     // @results false
   *     debug(Pot.isArrayLike(arguments));
   *     // @results true
   *   })();
   *
   *
   * @param   {*}         o     A target object
   * @return  {Boolean}         ture or false (iterable or false)
   * @type Function
   * @function
   * @static
   * @public
   */
  isArrayLike : function(o) {
    var len;
    if (!o) {
      return false;
    }
    len = o.length;
    if (Pot.isArray(o) || o instanceof Array || o.constructor === Array) {
      return true;
    }
    if (!Pot.isNumber(len) || (!Pot.isObject(o) && !Pot.isArray(o)) ||
        o === Pot || o === Pot.Global || o === globals ||
        Pot.isWindow(o) || Pot.isDocument(o) || Pot.isElement(o)
    ) {
      return false;
    }
    if (o.isArray || Pot.isFunction(o.callee) || Pot.isNodeList(o) ||
        ((typeof o.item === 'function' ||
          typeof o.nextNode === 'function') &&
           o.nodeType != 3 && o.nodeType != 4) ||
        (0 in o && ((len - 1) in o)) ||
        RE_ARRAYLIKE.test(toString.call(o))
    ) {
      return true;
    } else {
      return false;
    }
  },
  /**
   * Check whether the argument object is an instance of Pot.Deferred.
   *
   *
   * @example
   *   var o = {hoge: 1};
   *   var d = new Pot.Deferred();
   *   debug(isDeferred(o)); // false
   *   debug(isDeferred(d)); // true
   *
   *
   * @param  {Object|*}  x  The target object to test.
   * @return {Boolean}      Return true if the argument object is an
   *                          instance of Pot.Deferred,
   *                          otherwise return false.
   * @type Function
   * @function
   * @static
   * @public
   */
  isDeferred : function(x) {
    return x != null && ((x instanceof Pot.Deferred) ||
     (x.id   != null && x.id   === Pot.Deferred.prototype.id &&
      x.NAME != null && x.NAME === Pot.Deferred.prototype.NAME));
  },
  /**
   * Check whether the argument object is an instance of Pot.Iter.
   *
   *
   * @example
   *   var obj = {hoge: 1};
   *   var iter = new Pot.Iter();
   *   debug(isIter(obj));  // false
   *   debug(isIter(iter)); // true
   *
   *
   * @param  {Object|*}  x  The target object to test.
   * @return {Boolean}      Return true if the argument object is an
   *                          instance of Pot.Iter, otherwise return false.
   * @type Function
   * @function
   * @static
   * @public
   */
  isIter : function(x) {
    return x != null && ((x instanceof Pot.Iter) ||
     (x.id   != null && x.id   === Pot.Iter.prototype.id &&
      x.NAME != null && x.NAME === Pot.Iter.prototype.NAME &&
                typeof x.next  === 'function'));
  },
  /**
   * Check whether the value can be numeric value.
   *
   *
   * @example
   *   debug(isNumeric(0));               // true
   *   debug(isNumeric(1234567890));      // true
   *   debug(isNumeric(new Number(25)));  // true
   *   debug(isNumeric(null));            // false
   *   debug(isNumeric((void 0)));        // false
   *   debug(isNumeric('abc'));           // false
   *   debug(isNumeric('0xFF'));          // true
   *   debug(isNumeric('1e8'));           // true
   *   debug(isNumeric('10px'));          // false
   *   debug(isNumeric('-512 +1'));       // false
   *   debug(isNumeric([]));              // false
   *   debug(isNumeric([100]));           // false
   *   debug(isNumeric(new Date()));      // false
   *   debug(isNumeric({}));              // false
   *   debug(isNumeric((function() {}))); // false
   *
   *
   * @param  {Number|*}   n   The target value to test.
   * @return {Boolean}        Return true if the value is numeric,
   *                            otherwise return false.
   * @type Function
   * @function
   * @static
   * @public
   */
  isNumeric : function(n) {
    return  (n == null || n === '' ||
      (typeof n === 'object' &&
       n.constructor !== Number)) ? false : !isNaN(n - 0);
  },
  /**
   * Returns whether the supplied number represents an integer,
   *   i.e. that is has no fractional component.
   *
   *
   * @example
   *   debug(isInt(0));                       // true
   *   debug(isInt(-524560620));              // true
   *   debug(isInt(0.1205562));               // false
   *   debug(isInt(1.5));                     // false
   *   debug(isInt(12345));                   // true
   *   debug(isInt(Number.MAX_VALUE));        // true
   *   debug(isInt(Number.MAX_VALUE * 1000)); // false
   *   debug(isInt(null));                    // false
   *   debug(isInt((void 0)));                // false
   *   debug(isInt('hoge'));                  // false
   *   debug(isInt(''));                      // false
   *   debug(isInt([100]));                   // false
   *
   *
   * @param  {Number}   n  The number to test.
   * @return {boolean}     Whether `n` is an integer.
   * @type Function
   * @function
   * @static
   * @public
   */
  isInt : function(n) {
    return Pot.isNumber(n) && isFinite(n) && n % 1 == 0;
  },
  /**
   * Check whether the argument is the native code.
   *
   *
   * @example
   *   debug(isNativeCode(null));                     // false
   *   debug(isNativeCode((void 0)));                 // false
   *   debug(isNativeCode({foo: 1, bar: 2, baz: 3})); // false
   *   debug(isNativeCode('hoge'));                   // false
   *   debug(isNativeCode(window));                   // false
   *   debug(isNativeCode(document));                 // false
   *   debug(isNativeCode(document.body));            // false
   *   debug(isNativeCode(document.getElementById));  // true
   *   debug(isNativeCode(encodeURIComponent));       // true
   *   debug(isNativeCode(Array.prototype.slice));    // true
   *   debug(isNativeCode((function() {})));          // false
   *   debug(isNativeCode(Math.max.toString()));      // true
   *
   *
   * @param  {String|Function}  method   The target method.
   * @return {Boolean}                   Return true if the `method` is
   *                                       native code,
   *                                       otherwise return false.
   * @type Function
   * @function
   * @static
   * @public
   */
  isNativeCode : function(method) {
    var code;
    if (!method) {
      return false;
    }
    code = method.toString();
    return !!(~code.indexOf('[native code]') && code.length <= 92);
  },
  /**
   * Check whether the argument function is the built-in method.
   *
   *
   * @example
   *   debug(isBuiltinMethod(null));                     // false
   *   debug(isBuiltinMethod((void 0)));                 // false
   *   debug(isBuiltinMethod({foo: 1, bar: 2, baz: 3})); // false
   *   debug(isBuiltinMethod('hoge'));                   // false
   *   debug(isBuiltinMethod(window));                   // false
   *   debug(isBuiltinMethod(document));                 // false
   *   debug(isBuiltinMethod(document.body));            // false
   *   debug(isBuiltinMethod(document.getElementById));  // true
   *   debug(isBuiltinMethod(encodeURIComponent));       // true
   *   debug(isBuiltinMethod(Array.prototype.slice));    // true
   *   debug(isBuiltinMethod((function() {})));          // false
   *
   *
   * @param  {Function}  method   The target method.
   * @return {Boolean}            Return true if the argument function
   *                                is built-in, otherwise return false.
   * @type Function
   * @function
   * @static
   * @public
   */
  isBuiltinMethod : function(method) {
    return method != null && (typeof method === 'function' ||
           method.constructor === Function) && Pot.isNativeCode(method);
  },
  /**
   * Check whether the argument object is Window.
   *
   *
   * @example
   *   debug(isWindow(null));                                 // false
   *   debug(isWindow((void 0)));                             // false
   *   debug(isWindow({foo: 1, bar: 2, baz: 3}));             // false
   *   debug(isWindow('hoge'));                               // false
   *   debug(isWindow(window));                               // true
   *   debug(isWindow(document));                             // false
   *   debug(isWindow(document.body));                        // false
   *   debug(isWindow(document.getElementById('container'))); // false
   *   debug(isWindow(document.getElementsByTagName('div'))); // false
   *
   *
   * @param  {Document|Element|Node|*}  x  The target object.
   * @return {Boolean}                     Return true if the argument object
   *                                         is Window, otherwise return false.
   * @type Function
   * @function
   * @static
   * @public
   */
  isWindow : function(x) {
    return x != null && typeof x === 'object' && 'setInterval' in x &&
           x.window == x && !!(x.location || x.screen || x.navigator ||
           x.document);
  },
  /**
   * Check whether the argument object is Document.
   *
   *
   * @example
   *   debug(isDocument(null));                                 // false
   *   debug(isDocument((void 0)));                             // false
   *   debug(isDocument({foo: 1, bar: 2, baz: 3}));             // false
   *   debug(isDocument('hoge'));                               // false
   *   debug(isDocument(window));                               // false
   *   debug(isDocument(document));                             // true
   *   debug(isDocument(document.body));                        // false
   *   debug(isDocument(document.getElementById('container'))); // false
   *   debug(isDocument(document.getElementsByTagName('div'))); // false
   *
   *
   * @param  {Window|Element|Node|*}  x  The target object.
   * @return {Boolean}                   Return true if the argument object
   *                                       is Document, otherwise return false.
   * @type Function
   * @function
   * @static
   * @public
   */
  isDocument : function(x) {
    return x != null && typeof x === 'object' && 'getElementById' in x &&
      x.nodeType > 0 && typeof x.documentElement === 'object';
  },
  /**
   * Check whether the argument object is Element.
   *
   *
   * @example
   *   debug(isElement(null));                                 // false
   *   debug(isElement((void 0)));                             // false
   *   debug(isElement({foo: 1, bar: 2, baz: 3}));             // false
   *   debug(isElement('hoge'));                               // false
   *   debug(isElement(window));                               // false
   *   debug(isElement(document));                             // false
   *   debug(isElement(document.body));                        // true
   *   debug(isElement(document.getElementById('container'))); // true
   *   debug(isElement(document.getElementsByTagName('div'))); // false
   *
   *
   * @param  {Element|Node|*}  x  The target object.
   * @return {Boolean}            Return true if the argument object
   *                                is Element, otherwise return false.
   * @type Function
   * @function
   * @static
   * @public
   */
  isElement : function(x) {
    return x != null && typeof x === 'object' && x.nodeType == 1;
  },
  /**
   * Check whether the object looks like a DOM node.
   *
   *
   * @example
   *   debug(isNodeLike({foo: 1, bar: 2, baz: 3}));             // false
   *   debug(isNodeLike('hoge'));                               // false
   *   debug(isNodeLike(window));                               // false
   *   debug(isNodeLike(document));                             // true
   *   debug(isNodeLike(document.body));                        // true
   *   debug(isNodeLike(document.getElementById('container'))); // true
   *   debug(isNodeLike(document.getElementsByTagName('div'))); // false
   *
   *
   * @param  {*}        x   The target object.
   * @return {Boolean}      Whether the object looks like a DOM node.
   * @type Function
   * @function
   * @static
   * @public
   */
  isNodeLike : function(x) {
    return x != null && typeof x === 'object' && x.nodeType > 0;
  },
  /**
   * Returns true if the object is a NodeList.
   *
   *
   * @example
   *   var obj = new Array({foo: 1, bar: 2, baz: 3});
   *   var nodes = document.getElementsByTagName('div');
   *   debug(isNodeList(obj));
   *   // @results  false
   *   debug(isNodeList(nodes));
   *   // @results  true
   *   //
   *   // Make dummy method for test.
   *   obj.item = function() {};
   *   debug(isNodeList(obj));
   *   // @results  false
   *
   *
   * @param  {*}        x   The target object to test.
   * @return {Boolean}      Whether the object is a NodeList.
   * @type Function
   * @function
   * @static
   * @public
   */
  isNodeList : function(x) {
    var type;
    if (x && Pot.isNumber(x.length)) {
      type = typeof x.item;
      if (Pot.isObject(x)) {
        return type === 'function' || type === 'string';
      } else if (Pot.isFunction(x)) {
        return type === 'function';
      }
    }
    return false;
  }
});
})('StopIteration');

// Define StopIteration (this scope only)
if (typeof StopIteration === 'undefined') {
  var StopIteration = Pot.StopIteration;
}

// Definition of builtin method states.
update(Pot.System, {
  /**
   * @lends Pot.System
   */
  /**
   * Whether the environment supports the built-in "Object.keys".
   *
   * @type  Boolean
   * @const
   */
  isBuiltinObjectKeys : Pot.isBuiltinMethod(Object.keys),
  /**
   * Whether the environment supports the built-in "Array.prototype.forEach".
   *
   * @type  Boolean
   * @const
   */
  isBuiltinArrayForEach : Pot.isBuiltinMethod(Array.prototype.forEach),
  /**
   * Whether the environment supports the built-in "Array.prototype.indexOf".
   *
   * @type  Boolean
   * @const
   */
  isBuiltinArrayIndexOf : Pot.isBuiltinMethod(Array.prototype.indexOf),
  /**
   * Whether the environment supports
   *   the built-in "Array.prototype.lastIndexOf".
   *
   * @type  Boolean
   * @const
   */
  isBuiltinArrayLastIndexOf : Pot.isBuiltinMethod(Array.prototype.lastIndexOf)
});

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Shortcut functions.

/**
 * @ignore
 */
function update() {
  var args = arguments, len = args.length, i = 1, o, p, x;
  if (len === i) {
    o = this || {};
    i--;
  } else {
    o = args[i - 1];
  }
  if (o) {
    do {
      x = args[i];
      if (x) {
        for (p in x) {
          try {
            o[p] = x[p];
          } catch (e) {}
        }
      }
    } while (++i < len);
  }
  return o;
}

/**
 * @ignore
 */
function arrayize(object, index) {
  var array, i, len, me = arguments.callee;
  if (me.canNodeList == null) {
    // NodeList cannot convert to the Array in the Blackberry, IE browsers.
    if (globals) {
      try {
        slice.call(globals.documentElement.childNodes)[0].nodeType;
        me.canNodeList = true;
      } catch (e) {
        me.canNodeList = false;
      }
    }
  }
  if (object == null) {
    array = [object];
  } else {
    switch (Pot.typeOf(object)) {
      case 'array':
          array = object.slice();
          break;
      case 'object':
          if (Pot.isArrayLike(object)) {
            if (!me.canNodeList && Pot.isNodeList(object)) {
              array = [];
              i = 0;
              len = object.length;
              do {
                array[i] = object[i];
              } while (++i < len);
            } else {
              array = slice.call(object);
            }
            break;
          }
          // FALL THROUGH
      default:
          array = slice.call(concat.call([], object));
          break;
    }
  }
  if (index > 0) {
    array = array.slice(index);
  }
  return array;
}

/**
 * @ignore
 */
function now() {
  return (new Date()).getTime();
}

/**
 * @ignore
 */
function stringify(x, ignoreBoolean) {
  var result = '', c, len = arguments.length;
  if (x !== null) {
    switch (typeof x) {
      case 'string':
      case 'number':
      case 'xml':
          result = x;
          break;
      case 'boolean':
          if (len >= 2 && !ignoreBoolean) {
            result = x;
          } else if (!ignoreBoolean) {
            result = x ? 1 : '';
          }
          break;
      case 'object':
          if (x) {
            // Fixed object valueOf. e.g. new String('hoge');
            c = x.constructor;
            if (c === String || c === Number ||
                (typeof XML !== 'undefined' && c === XML)) {
              result = x;
            } else if (c === Boolean) {
              if (len >= 2 && !ignoreBoolean) {
                result = x;
              } else if (!ignoreBoolean) {
                result = (x == true) ? 1 : '';
              }
            }
          }
          break;
      default:
          break;
    }
  }
  return result.toString();
}

/**
 * @ignore
 */
function trim(s, chars, ignoreCase) {
  var re;
  if (chars) {
    re = new RegExp(
      ['^[', ']+|[', ']+$'].join(rescape(chars)),
      'g' + (ignoreCase ? 'i' : '')
    );
  } else {
    re = RE_TRIM;
  }
  return stringify(s, true).replace(re, '');
}

/**
 * @ignore
 */
function rescape(s) {
  return stringify(s, true).replace(RE_RESCAPE, '\\$1');
}

/**
 * @ignore
 */
function invoke(/*object[, method[, ...args]]*/) {
  var args = arrayize(arguments), argn = args.length;
  var object, method, params, emit, p, t, i, len, err;
  try {
    switch (argn) {
      case 0:
          throw false;
      case 1:
          method = args[0];
          break;
      case 2:
          object = args[0];
          method = args[1];
          break;
      case 3:
          object = args[0];
          method = args[1];
          params = arrayize(args[2]);
          break;
      default:
          object = args[0];
          method = args[1];
          params = arrayize(args, 2);
          break;
    }
    if (!method) {
      throw method;
    }
    if (!object && Pot.isString(method)) {
      object = (object && object[method] && object)  ||
             (globals && globals[method] && globals) ||
          (Pot.Global && Pot.Global[method] && Pot.Global);
    }
    if (Pot.isString(method)) {
      emit = true;
      if (!object) {
        object = (globals || Pot.Global);
      }
    }
  } catch (e) {
    err = e;
    throw Pot.isError(err) ? err : new Error(err);
  }
  if (Pot.isFunction(method.apply) && Pot.isFunction(method.call)) {
    if (params == null || !params.length) {
      return method.call(object);
    } else {
      return method.apply(object, params);
    }
  } else {
    p = params || [];
    len = p.length || 0;
    if (emit) {
      // faster way.
      switch (len) {
        case 0: return object[method]();
        case 1: return object[method](p[0]);
        case 2: return object[method](p[0], p[1]);
        case 3: return object[method](p[0], p[1], p[2]);
        default: break;
      }
    } else {
      switch (len) {
        case 0: return method();
        case 1: return method(p[0]);
        case 2: return method(p[0], p[1]);
        case 3: return method(p[0], p[1], p[2]);
        default: break;
      }
    }
    t = [];
    for (i = 0; i < len; i++) {
      t[t.length] = 'p[' + i + ']';
    }
    return (new Function(
      'e,o,m,p',
      ['return e ? o[m](', ') : m(', ');'].join(t.join(','))
    ))(emit, object, method, p);
  }
}

/**
 * @ignore
 */
function debug(msg) {
  var func, firebug, consoleService;
  /**@ignore*/
  firebug = function(method, args) {
    var result = false, win, fbConsole;
    try {
      if (!Pot.XPCOM.isEnabled) {
        throw false;
      }
      win = Pot.XPCOM.getMostRecentWindow();
      if (!win) {
        throw win;
      }
      if (win.FirebugConsole && win.FirebugContext) {
        fbConsole = new win.FirebugConsole(win.FirebugContext, win.content);
        fbConsole[method].apply(fbConsole, args);
        result = true;
      } else if (win.Firebug && win.Firebug.Console) {
        try {
          win.Firebug.Console.logFormatted.call(
            win.Firebug.Console,
            arrayize(args),
            win.FirebugContext,
            method
          );
          result = true;
        } catch (er) {}
      }
    } catch (e) {}
    return result;
  };
  try {
    if (!firebug('log', arguments)) {
      if (!Pot.XPCOM.isEnabled) {
        throw false;
      }
      consoleService = Cc['@mozilla.org/consoleservice;1']
                      .getService(Ci.nsIConsoleService);
      consoleService.logStringMessage(String(msg));
    }
  } catch (e) {
    if (typeof GM_log !== 'undefined') {
      /**@ignore*/
      func = GM_log;
    } else if (typeof console !== 'undefined') {
      /**@ignore*/
      func = console.debug || console.dir || console.log;
    } else if (typeof opera !== 'undefined' && opera.postError) {
      /**@ignore*/
      func = opera.postError;
    } else {
      /**@ignore*/
      func = function(x) { throw x; };
    }
    try {
      if (func.apply) {
        func.apply(func, arguments);
      } else {
        throw func;
      }
    } catch (e) {
      try {
        func(msg);
      } catch (e) {
        try {
          console.log(msg);
        } catch (e) {
          throw msg;
        }
      }
    }
  }
  return msg;
}

// Update Pot object.
Pot.update({
  /**
   * @lends Pot
   */
  /**
   * Treated as an array of arguments given then
   *  return it as an array.
   *
   *
   * @example
   *   debug(arrayize(null));               // [null]
   *   debug(arrayize((void 0)));           // [undefined]
   *   debug(arrayize(true));               // [true]
   *   debug(arrayize(false));              // [false]
   *   debug(arrayize(new Boolean(true)));  // [Boolean(false)]
   *   debug(arrayize(Boolean));            // [Boolean]
   *   debug(arrayize(''));                 // ['']
   *   debug(arrayize('hoge'));             // ['hoge']
   *   debug(arrayize(new String('hoge'))); // [String {'hoge'}]
   *   debug(arrayize(String));             // [String]
   *   debug(arrayize(100));                // [100]
   *   debug(arrayize(-100));               // [-100]
   *   debug(arrayize(NaN));                // [NaN]
   *   debug(arrayize(12410.505932095032)); // [12410.505932095032]
   *   debug(arrayize(new Number(100)));    // [Number {100}]
   *   debug(arrayize(Number));             // [Number]
   *   debug(arrayize(Error('error')));     // [Error {'error'}]
   *   debug(arrayize(new Error('error'))); // [Error {'error'}]
   *   debug(arrayize(Error));              // [Error]
   *   debug(arrayize(/(foo|bar)/i));       // [/(foo|bar)/i]
   *   debug(arrayize(new RegExp('hoge'))); // [/hoge/]
   *   debug(arrayize(new RegExp()));       // [/(?:)/]
   *   debug(arrayize(RegExp));             // [RegExp]
   *   debug(arrayize(TypeError));          // [TypeError]
   *   debug(arrayize(encodeURI));          // [encodeURI]
   *   debug(arrayize(window));             // [window]
   *   debug(arrayize(document));           // [document]
   *   debug(arrayize(document.body));      // [body]
   *   debug(arrayize([]));                 // []
   *   debug(arrayize(new Array(1, 2, 3))); // [1, 2, 3]
   *   debug(arrayize([1, 2, 3]));          // [1, 2, 3]
   *   debug(arrayize(Array));              // [Array]
   *   debug(arrayize(Array.prototype));    // [Array.prototype]
   *   debug(arrayize([[]]));               // [[]]
   *   debug(arrayize([[100]]));            // [[100]]
   *   debug(arrayize({}));                 // [{}]
   *   debug(arrayize({foo: 'bar'}));       // [{foo: 'bar'}]
   *   debug(arrayize(new Object()));       // [Object {}]
   *   debug(arrayize(new Object('foo')));  // [Object {'foo'}]
   *   debug(arrayize(Object));             // [Object]
   *   debug(arrayize(document.getElementsByTagName('div')));
   *   // @results  [<div/>, <div/>, <div/> ...]
   *   (function(a, b, c) {
   *     debug(arrayize(arguments));
   *     // @results  [1, 2, 3]
   *   })(1, 2, 3);
   *   (function(a, b, c) {
   *     debug(arrayize(arguments, 2));
   *     // @results  [3]
   *   })(1, 2, 3);
   *
   *
   * @param  {*}       object   A target object.
   * @param  {Number}  (index)  Optional, The first index to
   *                              slice the array.
   * @return {Array}            Return an array of result.
   * @type Function
   * @function
   * @public
   * @static
   */
  arrayize : arrayize,
  /**
   * Evaluate a string can be a scalar value only.
   * Return "1" when argument was passed as true.
   * This function can treat XML object that
   *  will be string by toString method.
   *
   *
   * @example
   *   debug(stringify({}));
   *   // @results ''
   *   debug(stringify([]));
   *   // @results ''
   *   debug(stringify(0));
   *   // @results '0'
   *   debug(stringify(-100.02));
   *   // @results '-100.02'
   *   debug(stringify(new Date()));
   *   // @results ''
   *   debug(stringify(null));
   *   // @results ''
   *   debug(stringify(void 0));
   *   // @results ''
   *   debug(stringify(false));
   *   // @results ''
   *   debug(stringify(true));
   *   // @results '1'
   *   debug(stringify(''));
   *   // @results ''
   *   debug(stringify('hoge'));
   *   // @results 'hoge'
   *   debug(stringify(new String('hoge')));
   *   // @results 'hoge'
   *   debug(stringify(new Boolean(false)));
   *   // @results ''
   *   debug(stringify(new Boolean(true)));
   *   // @results '1'
   *   debug(stringify([100]));
   *   // @results ''
   *
   *
   * @param  {*}        x              Any value.
   * @param  {Boolean} (ignoreBoolean) Optional, Ignores Boolean value.
   * @return {String}                  Value as a string.
   * @type Function
   * @function
   * @public
   * @static
   */
  stringify : stringify,
  /**
   * Trim the white spaces including em (U+3000).
   *
   * White spaces will not removed when specified the second argument.
   *
   * @example
   *   debug( trim(' hoge  ') );
   *   // @results 'hoge'
   *
   *
   * @example
   *   //
   *   // White spaces will not removed when 
   *   //  specified the second argument.
   *   //
   *   debug( trim('abbbcc cc ', 'ab') );
   *   // @results 'cc cc '
   *
   *
   * @param  {String}   s            A target string.
   * @param  {String}  (chars)       (Optional) Removing characters.
   * @param  {Boolean} (ignoreCase)  (Optional) Whether ignore case on RegExp.
   * @return {String}                A result string.
   * @type Function
   * @function
   * @public
   * @static
   */
  trim : trim,
  /**
   * Escape RegExp patterns.
   *
   *
   * @example
   *   var pattern = '*[hoge]*';
   *   var regex = new RegExp('^(' + rescape(pattern) + ')$', 'g');
   *   debug(regex.toString());
   *   // @results /^(\*\[hoge\]\*)$/g
   *
   *
   * @param  {String}  s  A target string.
   * @return {String}     The escaped string.
   * @type Function
   * @function
   * @public
   * @static
   */
  rescape : rescape,
  /**
   * Call the function with unknown number arguments.
   * That is for cases where JavaScript sucks
   *   built-in function like alert() on IE or other-browser when
   *   calls the Function.apply.
   *
   *
   * @example
   *   debug(invoke(window, 'alert', 100));
   *   debug(invoke(document, 'getElementById', 'container'));
   *   debug(invoke(window, 'setTimeout', function() { debug(1); }, 2000));
   *
   *
   * @param  {Object}      object  The context object (e.g. window)
   * @param  {String}      method  The callable function name.
   * @param  {Array|...*}  (args)  The function arguments.
   * @return {*}                   The result of the called function.
   * @type Function
   * @function
   * @public
   * @static
   */
  invoke : invoke,
  /**
   * Output to the console using log function for debug.
   *
   *
   * @example
   *   debug('hoge'); // hoge
   *
   *
   * @param  {*}  msg  A log message, or variable
   * @type Function
   * @function
   * @public
   * @static
   */
  debug : debug
});

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Private functions.

/**
 * Iterate "forEach".
 *
 * @private
 * @ignore
 * @internal
 */
function each(object, callback, context) {
  var i, len, val, err;
  if (object) {
    len = object.length;
    try {
      if (Pot.isArrayLike(object)) {
        for (i = 0; i < len; i++) {
          if (i in object) {
            try {
              val = object[i];
            } catch (e) {
              continue;
            }
            callback.call(context, val, i, object);
          }
        }
      } else {
        for (i in object) {
          try {
            val = object[i];
          } catch (e) {
            continue;
          }
          callback.call(context, val, i, object);
        }
      }
    } catch (ex) {
      err = ex;
      if (!Pot.isStopIter(err)) {
        throw err;
      }
    }
  }
  return object;
}

/**
 * Build the serial number.
 *
 * @private
 * @ignore
 */
function buildSerial(o, sep) {
  return [
    String((o && (o.NAME || o.name)) || (void 0)),
    Math.random().toString(36).substring(2),
    now()
  ].join(arguments.length >= 2 ? sep : '-');
}

/**
 * @private
 * @ignore
 */
function buildObjectString(name) {
  return '[object ' + name + ']';
}

/**
 * Method for Deferred.
 *
 * @private
 * @ignore
 */
function extendDeferredOptions(o, x) {
  var a, b;
  if (o && x) {
    if (Pot.isObject(o.options)) {
      a = o.options;
    } else if (Pot.isObject(o)) {
      a = o;
    }
    if (Pot.isObject(x.options)) {
      b = x.options;
    } else if (Pot.isObject(x)) {
      b = x;
    }
    if ('async' in b) {
      a.async = !!b.async;
    }
    if ('speed' in b && Pot.isNumeric(b.speed)) {
      a.speed = b.speed;
    }
    if ('cancellers' in b) {
      if (!b.cancellers || !b.cancellers.length) {
        b.cancellers = [];
      } else {
        if (a.cancellers && a.cancellers.length) {
          a.cancellers = concat.call([],
            arrayize(a.cancellers), arrayize(b.cancellers));
        } else {
          a.cancellers = arrayize(b.cancellers);
        }
      }
    }
    if ('stoppers' in b) {
      if (!b.stoppers || !b.stoppers.length) {
        b.stoppers = [];
      } else {
        if (a.stoppers && a.stoppers.length) {
          a.stoppers = concat.call([],
            arrayize(a.stoppers), arrayize(b.stoppers));
        } else {
          a.stoppers = arrayize(b.stoppers);
        }
      }
    }
    if ('storage' in b) {
      a.storage = b.storage || {};
    }
    if (!a.storage) {
      a.storage = {};
    }
  }
}

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Definition of Deferred.
(function() {

Pot.update({
  /**
   * @lends Pot
   */
  /**
   * Deferred.
   *
   * Ability to establish a chain method asynchronously.
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   d.then(function() {
   *     return 100;
   *   }).then(function(res) {
   *     debug(res);
   *     // @results  res = 100
   *   }).begin();
   *
   *
   * @example
   *   var n = 1;
   *   var d = new Pot.Deferred({
   *     async : true,
   *     speed : 'slow'
   *   });
   *   d.then(function() {
   *     debug('Begin');
   *     debug(n);
   *     return n + 1;
   *   }).then(function(res) {
   *     debug(res);
   *     return res + 1;
   *   }).then(function(res) {
   *     debug(res);
   *     // raise an error
   *     undefinedFunction.call();
   *   }).rescue(function(err) {
   *     // catch the error
   *     debug('my error : ' + err);
   *   }).then(function() {
   *     debug('End.');
   *   }).begin();
   *
   *
   * @param  {Object|*}  Options.
   * @return {Deferred}  Returns an instance of Deferred.
   *
   * @name  Pot.Deferred
   * @class
   * @constructor
   * @public
   */
  Deferred : function() {
    return Pot.isDeferred(this) ? this.init(arguments) :
            new Pot.Deferred.fn.init(arguments);
  }
});

// Definition of the prototype and static properties.
update(Pot.Deferred, {
  /**
   * @lends Pot.Deferred
   */
  /**
   * StopIteration.
   *
   * @type Object
   * @static
   * @const
   * @public
   */
  StopIteration : Pot.StopIteration,
  /**
   * Speeds.
   *
   * @type Object
   * @static
   * @const
   * @private
   * @ignore
   */
  speeds : {
    limp   : 2400,
    doze   : 1000,
    slow   :  100,
    normal :   36,
    fast   :   20,
    rapid  :   12,
    ninja  :    0
  },
  /**
   * States.
   *
   * @type Object
   * @static
   * @const
   * @private
   * @ignore
   */
  states : {
    success : 0x01,
    failure : 0x02,
    fired   : 0x03,
    unfired : 0x04
  }
});

each(Pot.Deferred.states, function(n, name) {
  Pot.Deferred.states[n] = name;
});

update(Pot.Deferred, {
  /**
   * @lends Pot.Deferred
   */
  /**
   * Defaults.
   *
   * @type Object
   * @static
   * @const
   * @private
   * @ignore
   */
  defaults : {
    speed     : Pot.Deferred.speeds.ninja,
    canceller : null,
    stopper   : null,
    async     : true
  }
});

// Definition of the prototype.
Pot.Deferred.fn = Pot.Deferred.prototype = update(Pot.Deferred.prototype, {
  /**
   * @lends Pot.Deferred.prototype
   */
  /**
   * @ignore
   */
  constructor : Pot.Deferred,
  /**
   * @private
   * @ignore
   */
  id : Pot.Internal.getMagicNumber(),
  /**
   * A unique strings.
   *
   * @type  String
   * @const
   */
  serial : null,
  /**
   * @private
   * @ignore
   */
  chains : [],
  /**
   * @private
   * @ignore
   */
  chained : false,
  /**
   * @private
   * @ignore
   */
  cancelled : false,
  /**
   * @private
   * @ignore
   */
  freezing : false,
  /**
   * @private
   * @ignore
   */
  tilling : false,
  /**
   * @private
   * @ignore
   */
  waiting : false,
  /**
   * @private
   * @ignore
   */
  nested : 0,
  /**
   * @private
   * @ignore
   */
  state : null,
  /**
   * @private
   * @ignore
   */
  results : null,
  /**
   * @private
   * @ignore
   */
  options : {},
  /**
   * @private
   * @ignore
   */
  plugins : {},
  /**
   * @private
   * @ignore
   * @const
   */
  NAME : 'Deferred',
  /**
   * toString.
   *
   * @return  Return formatted string of object.
   * @type Function
   * @function
   * @static
   * @public
   */
  toString : Pot.toString,
  /**
   * isDeferred.
   *
   * @type Function
   * @function
   * @static
   * @public
   */
  isDeferred : Pot.isDeferred,
  /**
   * Initialize properties
   *
   * @private
   * @ignore
   */
  init : function(args) {
    if (!this.serial) {
      this.serial = buildSerial(this);
    }
    this.options = {};
    this.plugins = {};
    initOptions.call(this, arrayize(args), Pot.Deferred.defaults);
    update(this, {
      state     : Pot.Deferred.states.unfired,
      results   : {
        success : null,
        failure : null
      },
      chains    : [],
      nested    : 0,
      chained   : false,
      cancelled : false,
      freezing  : false,
      tilling   : false,
      waiting   : false
    });
    Pot.Internal.referSpeeds.call(this, Pot.Deferred.speeds);
    return this;
  },
  /**
   * @lends Pot.Deferred.prototype
   */
  /**
   * Set the speed for processing.
   *
   * @desc
   * <pre>
   * The available constant speed names are below.
   * ------------------------------------
   *   speed name    |  speed
   * ------------------------------------
   *      limp       :  slowest
   *      doze       :  slower
   *      slow       :  slow
   *      normal     :  normal
   *      fast       :  fast
   *      rapid      :  faster
   *      ninja      :  fastest
   * ------------------------------------
   * </pre>
   *
   *
   * @example
   *   var n = 0;
   *   var testFunc = function() { debug(++n); };
   *   var d = new Pot.Deferred();
   *   d.then(testFunc).then(testFunc).then(testFunc)
   *    .then(function() { debug('Change to slowest speed. (limp)'); })
   *    .speed('limp')
   *    .then(testFunc).then(testFunc).then(testFunc)
   *    .then(function() { debug('Change to speed for 50 ms.'); })
   *    .speed(50)
   *    .then(testFunc).then(testFunc).then(testFunc)
   *    .then(function() { debug('End'); })
   *    .begin();
   *
   *
   * @param  {Number|String} sp Speed as Number or keyword as String.
   * @return {Deferred}         Returns the Deferred.
   *                            Deferred callback argument value will be
   *                              current speed value if no argument was
   *                              given, otherwise argument will succeed
   *                              the previous value.
   * @type Function
   * @function
   * @public
   */
  speed : function(sp) {
    var that = this, args = arguments, value;
    if (Pot.isNumeric(sp)) {
      value = sp - 0;
    } else if (Pot.isNumeric(Pot.Deferred.speeds[sp])) {
      value = Pot.Deferred.speeds[sp] - 0;
    } else {
      value = this.options.speed;
    }
    if (this.state === Pot.Deferred.states.unfired && !this.chains.length) {
      if (args.length === 0) {
        return this.options.speed;
      }
      this.options.speed = value;
    } else {
      this.then(function(reply) {
        if (args.length === 0) {
          return that.options.speed;
        }
        that.options.speed = value;
        return reply;
      });
    }
    return this;
  },
  /**
   * Set the asynchronous for processing.
   *
   *
   * @example
   *   // Run the callback chains while switching between
   *   //  asynchronous and synchronous.
   *   var d = new Pot.Deferred({ async : false });
   *   d.then(function(res) {
   *     debug(res);
   *     return res + 1;
   *   }).speed('slow').async(true).then(function(res) {
   *     debug(res);
   *     return res + 1;
   *   }).speed(1500).then(function(res) {
   *     debug(res);
   *     return res + 1;
   *   }).async(false).then(function(res) {
   *     debug(res);
   *     return res + 1;
   *   }).then(function(res) {
   *     debug(res);
   *   }).async().then(function(async) {
   *     // Get the current async value
   *     debug('async = ' + async);
   *     debug('End.');
   *   }).begin(1);
   *
   *
   * @param  {Boolean}    sync  Value to asynchronous if given true.
   * @return {Deferred}         Returns the Deferred.
   *                            Deferred callback argument value will be
   *                              current async value if no argument was
   *                              given, otherwise argument will succeed
   *                              the previous value.
   * @type Function
   * @function
   * @public
   */
  async : function(sync) {
    var that = this, args = arguments;
    if (this.state === Pot.Deferred.states.unfired && !this.chains.length) {
      if (args.length === 0) {
        return this.options.async;
      }
      this.options.async = !!sync;
    } else {
      this.then(function(reply) {
        if (args.length === 0) {
          return that.options.async;
        }
        that.options.async = !!sync;
        return reply;
      });
    }
    return this;
  },
  /**
   * Set the canceller that will call on canceled callback sequences.
   *
   *
   * @example
   *   var msg = 'none';
   *   var d = new Pot.Deferred();
   *   d.canceller(function() {
   *     msg = 'cancelled';
   *   }).then(function() {
   *     msg = 'hoge';
   *   }).then(function() {
   *     msg = 'fuga';
   *   });
   *   d.cancel();
   *   d.begin(); // no sense
   *   debug(msg);
   *   // @results  msg = 'cancelled'
   *
   *
   * @param  {Function}   func  A canceller function.
   * @return {Deferred|*}       Returns the Deferred if set canceller value.
   *                            Returns current value if no argument was given.
   * @type Function
   * @function
   * @public
   */
  canceller : function(func) {
    var args = arguments;
    if (this.state === Pot.Deferred.states.unfired && !this.chains.length) {
      if (args.length === 0) {
        return this.options.cancellers;
      }
      if (!this.cancelled && Pot.isFunction(func)) {
        this.options.cancellers.push(func);
      }
    } else {
      this.stopper.apply(this, args);
    }
    return this;
  },
  /**
   * Set the stopper that will call on canceled callback sequences.
   *
   * @param  {Function}   func  A stopper function.
   * @return {Deferred}         Returns the Deferred.
   *                            Deferred callback argument value will be
   *                              current stoppers if no argument was
   *                              given, otherwise argument will succeed
   *                              the previous value.
   * @type Function
   * @function
   * @public
   */
  stopper : function(func) {
    var that = this, args = arguments;
    if (this.state === Pot.Deferred.states.unfired && !this.chains.length) {
      this.canceller.apply(this, args);
    } else {
      this.then(function(reply) {
        if (args.length === 0) {
          return that.options.stoppers;
        }
        if (!that.cancelled && Pot.isFunction(func)) {
          that.options.stoppers.push(func);
        }
        return reply;
      });
    }
    return this;
  },
  /**
   * Add a callback to the end of the chains.
   *
   * @desc
   * callback/errback:
   *   If callback returns a Deferred, then it will be chained.
   *   Returned value will be passed to the next callback as argument.
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   d.then(function() {
   *     debug('Hello World!');
   *   }).begin();
   *
   *
   * @param  {Function}  callback   A callback function.
   * @param  {Function}  (errback)  Optionally, an errorback function.
   * @return {Deferred}             Returns the Deferred.
   * @type Function
   * @function
   * @public
   */
  then : function(callback, errback) {
    if (!this.chained && !this.cancelled) {
      this.chains.push({
        success : callback,
        failure : errback
      });
      if (this.state & Pot.Deferred.states.fired) {
        if (!this.freezing && !this.tilling && !this.waiting) {
          fire.call(this);
        }
      }
    }
    Pot.Internal.referSpeeds.call(this, Pot.Deferred.speeds);
    return this;
  },
  /**
   * Add an errorback function to the end of the chains.
   * Errorback will be catch the error which occurs on chains.
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   d.then(function() {
   *     // Occur an error.
   *     unknownFunc.call();
   *   }).rescue(function(err) {
   *     // catch the error
   *     debug('err = ' + err);
   *     //
   *     // Handling the error.
   *     //
   *   }).then(function() {
   *     debug('next(do something)');
   *   });
   *   d.begin();
   *
   *
   * @param  {Function}  errback  An errorback function.
   * @return {Deferred}           Returns the Deferred.
   * @type Function
   * @function
   * @public
   */
  rescue : function(errback) {
    return this.then(null, errback);
  },
  /**
   * Add the same function as both a callback and an errorback on the chains.
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   d.then(function() {
   *     // Occur an error, or succeed.
   *     return maybeCallableFunc.call();
   *   }).ensure(function(res) {
   *     if (Pot.isError(res)) {
   *       debug('Error = ' + res);
   *       // Handling the error.
   *     } else {
   *       debug('Result = ' + res);
   *       // something to do
   *     }
   *     return 'anything';
   *   }).then(function(res) {
   *     debug('next(do something) or ' + res);
   *   });
   *   d.begin();
   *
   *
   * @param  {Function}  callback  A callback/errorback function.
   * @return {Deferred}            Returns the Deferred.
   * @type Function
   * @function
   * @public
   */
  ensure : function(callback) {
    return this.then(callback, callback);
  },
  /**
   * Cancels the chains that has not yet received a value.
   *
   *
   * @example
   *   function exampleFunc(checkFunc) {
   *     var d = new Pot.Deferred();
   *     d.canceller(function() {
   *       debug('Cancelled');
   *     });
   *     d.then(function(res) {
   *       debug(res);
   *       return res + 1;
   *     }).then(function(res) {
   *       debug(res);
   *       return res + 1;
   *     }).then(function(res) {
   *       debug(res);
   *       return res + 1;
   *     }).then(function(res) {
   *       debug(res);
   *       return res + 1;
   *     });
   *     return checkFunc().then(function(res) {
   *       debug('res = ' + res);
   *       if (res) {
   *         d.begin(1);
   *       } else {
   *         d.cancel();
   *       }
   *       return d;
   *     }).begin();
   *   }
   *   var checkFunc = function() {
   *     var dd = new Pot.Deferred();
   *     return dd.then(function() {
   *       debug('Begin example');
   *     }).async(true).speed(1000).then(function() {
   *       return Math.random() * 10 <= 5; // true or false
   *     });
   *   };
   *   exampleFunc(checkFunc).then(function(res) {
   *     debug('exampleFunc : res = ' + res);
   *   });
   *
   *
   * @return  {Deferred}        Returns the Deferred.
   * @type Function
   * @function
   * @public
   */
  cancel : function() {
    if (!this.cancelled) {
      this.cancelled = true;
      switch (this.state) {
        case Pot.Deferred.states.unfired:
            cancelize.call(this, 'cancellers');
            if (this.state === Pot.Deferred.states.unfired) {
              this.raise(new Error(this));
            }
            break;
        case Pot.Deferred.states.success:
            cancelize.call(this, 'stoppers');
            if (Pot.isDeferred(this.results.success)) {
              this.results.success.cancel();
            }
            break;
        case Pot.Deferred.states.failure:
            cancelize.call(this, 'stoppers');
            break;
        default:
            break;
      }
    }
    return this;
  },
  /**
   * Begin the callback chains without Error.
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   d.then(function() {
   *     debug('Hello Deferred!');
   *   });
   *   d.begin();
   *
   *
   * @param  {...*}      (...)  Some value to pass next callback sequence.
   * @return {Deferred}         Returns the Deferred.
   * @type Function
   * @function
   * @public
   */
  begin : function(/*[ ...args]*/) {
    var that = this, arg, args = arrayize(arguments), value;
    arg = args[0];
    if (args.length > 1) {
      value = args;
    } else {
      value = args[0];
    }
    if (!this.cancelled && this.state === Pot.Deferred.states.unfired) {
      if (Pot.isDeferred(arg) && !arg.cancelled) {
        arg.ensure(function() {
          that.begin.apply(this, arguments);
        });
      } else {
        this.options.cancellers = [];
        post.call(this, value);
      }
    }
    Pot.Internal.referSpeeds.call(this, Pot.Deferred.speeds);
    return this;
  },
  /**
   * Begin the callback chains with Error.
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   d.then(function() {
   *     debug('Hello Deferred!?');
   *   }).rescue(function() {
   *     debug('Error Deferred!');
   *   });
   *   d.raise();
   *   // This will be output 'Error Deferred!'
   *
   *
   * @param  {...*}      (...)  Some value to pass next callback sequence.
   * @return {Deferred}         Returns the Deferred.
   * @type Function
   * @function
   * @public
   */
  raise : function(/*[ ...args]*/) {
    var args = arrayize(arguments), arg, value;
    arg = args[0];
    if (!Pot.isError(arg)) {
      args[0] = new Error(arg);
    }
    if (args.length > 1) {
      value = args;
    } else {
      value = args[0];
    }
    return this.begin.apply(this, arrayize(value));
  },
  /**
   * Ending the callback chains.
   *
   *
   * @example
   *   var n = 1;
   *   var d = Pot.Deferred.begin(function() {
   *     n += 1;
   *   });
   *   d.then(function() {
   *     n *= 10;
   *   }).then(function() {
   *     n += 5;
   *     debug('n = ' + n);
   *   }).end(); // End the chains.
   *   d.then(function() {
   *     // This chain will not be called.
   *     n += 10000;
   *     debug('n = ' + n);
   *   });
   *   // @results  n = 25
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   var result;
   *   d.then(function() {
   *     return 1;
   *   }).then(function(res) {
   *     return res + 1;
   *   }).then(function(res) {
   *     var dd = new Pot.Deferred();
   *     dd.then(function(res) {
   *       return res + 1;
   *     }).then(function(res) {
   *       return res + 1;
   *     }).begin(res + 1);
   *     return dd;
   *   }).then(function(res) {
   *     result = res;
   *     debug(result);
   *   }).begin().end().then(function() {
   *     result = 100;
   *     debug('This chain will not be called.');
   *   });
   *   // @results  result = 5
   *
   *
   * @return {Deferred}      Returns the Deferred.
   * @type Function
   * @function
   * @public
   */
  end : function() {
    this.chained = true;
    return this;
  },
  /**
   * Wait specified seconds and then the callback sequence will restart.
   *
   *
   * @example
   *   var n = 0;
   *   var f = function() { debug(++n); };
   *   var d = new Pot.Deferred();
   *   d.then(f).then(f).then(f)
   *    .wait(1) // Wait 1 second.
   *    .then(f).wait(1).then(f).wait(1).then(f)
   *    .wait(2) // Wait 2 seconds.
   *    .then(f).wait(2).then(f).wait(2).then(f)
   *    .wait(0.5) // Wait 0.5 second.
   *    .then(function() {
   *      f();
   *      return 'hoge';
   *    }).wait(1).then(function(res) {
   *      f();
   *      // Inherit previous value.
   *      // This will be 'hoge'.
   *      debug('res = ' + res);
   *      return Pot.Deferred.begin(function() {
   *        return '[End]';
   *      });
   *    }).wait(2.5).then(function(res) {
   *      f();
   *      debug(res); // '[End]'
   *    });
   *    d.begin();
   *
   *
   * @param  {Number}  seconds  Number of seconds.
   * @param  {*}       (value)  (optional) The value passed to the next chain.
   * @return {Deferred}         Return the Deferred.
   * @type Function
   * @function
   * @public
   */
  wait : function(seconds, value) {
    var d, that = this, args = arguments;
    d = new Pot.Deferred();
    return this.then(function(reply) {
      if (Pot.isError(reply)) {
        throw reply;
      }
      that.waiting = true;
      Pot.Deferred.wait(seconds).ensure(function(result) {
        that.waiting = false;
        if (Pot.isError(result)) {
          d.raise(result);
        } else {
          d.begin(args.length >= 2 ? value : reply);
        }
      });
      return d;
    });
  },
  /**
   * Wait until the condition completed.
   * If true returned, waiting state will end.
   *
   *
   * @example
   *   debug('Begin till');
   *   var d = new Pot.Deferred();
   *   d.till(function() {
   *     // wait until the DOM body element is loaded
   *     if (!document.body) {
   *       return false;
   *     } else {
   *       return true;
   *     }
   *   }).then(function() {
   *     debug('End till');
   *     document.body.innerHTML += 'hoge';
   *   }).begin();
   *
   *
   * @param  {Function|*}  cond  A function or value as condition.
   * @return {Deferred}          Return the Deferred.
   * @type Function
   * @function
   * @public
   */
  till : function(cond) {
    var that = this, d = new Pot.Deferred();
    return this.then(function(reply) {
      if (Pot.isError(reply)) {
        throw reply;
      }
      that.tilling = true;
      Pot.Deferred.till(cond, reply).ensure(function(result) {
        that.tilling = false;
        if (Pot.isError(result)) {
          d.raise(result);
        } else {
          d.begin(reply);
        }
      });
      return d;
    });
  },
  /**
   * Set the arguments into the callback chain.
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   d.then(function(res) {
   *     debug(res); // undefined
   *     // Set the argument into callback chain result.
   *   }).args('hoge').then(function(res) {
   *     debug(res);
   *     // @results  res = 'hoge'
   *   });
   *   d.begin();
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   d.then(function(res) {
   *     debug(res); // undefined
   *     // Set the argument into callback chain result.
   *   }).args({
   *     foo : 1,
   *     bar : 2,
   *     baz : 3
   *   }).then(function(res) {
   *     debug(res);
   *     // @results  res = {foo: 1, bar: 2, baz: 3}
   *   });
   *   d.begin();
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   d.then(function() {
   *     return 'hoge';
   *   }).then(function() {
   *     debug( d.args() ); // @results 'hoge'
   *   });
   *   d.begin();
   *
   *
   * @param  {...*}         (args)  The specific arguments.
   * @return {Deferred|*}           Return the Pot.Deferred.
   *                                  Return the last callback chain result
   *                                  if passed no arguments.
   * @type   Function
   * @function
   * @public
   */
  args : function(/*[... args]*/) {
    var a = arrayize(arguments), len = a.length;
    if (len === 0) {
      return Pot.Deferred.lastResult(this);
    } else {
      return this.then(function() {
        var reply, reps = arrayize(arguments);
        if (reps.length > 1) {
          reply = reps;
        } else {
          reply = reps[0];
        }
        if (len > 1) {
          return a;
        } else {
          if (Pot.isFunction(a[0])) {
            return a[0].apply(this, arrayize(reply));
          } else {
            return a[0];
          }
        }
      });
    }
  },
  /**
   * Handle the data storage in the current callback chain.
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   d.data({
   *     // Set the data to callback chain.
   *     count : 0,
   *     begin : 'BEGIN',
   *     end   : 'END'
   *   }).then(function() {
   *     debug( this.data('begin') );
   *     return this.data('count') + 1;
   *   }).then(function(res) {
   *     debug(res);
   *     this.data('count', res + 1);
   *     return this.data('count');
   *   }).then(function(res) {
   *     debug(res);
   *     debug( this.data('end') );
   *   });
   *   d.begin();
   *   // output:
   *   //
   *   //   BEGIN
   *   //   1
   *   //   2
   *   //   END
   *   //
   *
   *
   * @param  {String|Object|*}  (key/obj)  The key name to get the data.
   *                                         Or, an key-value object for
   *                                         set the data.
   * @param  {*}                (value)    The value to set.
   * @return {Deferred|*}                  Return the current instance of
   *                                         Pot.Deferred if set the data.
   *                                       Return the value if specify key
   *                                         to get.
   * @type   Function
   * @function
   * @public
   */
  data : function(/*[key/obj [, value [, ...args]]]*/) {
    var that = this, result = this, args = arrayize(arguments);
    var i, len = args.length, prefix = '.';
    if (this.options) {
      if (!this.options.storage) {
        this.options.storage = {};
      }
      switch (len) {
        case 0:
            result = {};
            each(this.options.storage, function(val, key) {
              try {
                if (key && key.charAt(0) === prefix) {
                  result[key.substring(1)] = val;
                }
              } catch (e) {}
            });
            break;
        case 1:
            if (args[0] == null) {
              this.options.storage = {};
            } else if (Pot.isObject(args[0])) {
              each(args[0], function(val, key) {
                that.options.storage[prefix + stringify(key)] = val;
              });
            } else {
              result = this.options.storage[prefix + stringify(args[0])];
            }
            break;
        case 2:
            this.options.storage[prefix + stringify(args[0])] = args[1];
            break;
        default:
            i = 0;
            do {
              this.options.storage[prefix + stringify(args[i++])] = args[i++];
            } while (i < len);
            break;
      }
    }
    return result;
  },
  /**
   * Update the Pot.Deferred.prototype.
   *
   *
   * @example
   *   // Update Pot.Deferred.prototype.
   *   Pot.Deferred.fn.update({
   *     addHoge : function() {
   *       return this.then(function(res) {
   *         return res + 'hoge';
   *       });
   *     }
   *   });
   *   var d = new Pot.Deferred();
   *   d.then(function() {
   *     return 'fuga';
   *   }).addHoge().then(function(res) {
   *     debug(res);
   *     // @results  res = 'fugahoge';
   *   });
   *   d.begin();
   *
   *
   * @param  {Object}    (...)  The object to update.
   * @return {Deferred}         Return the current instance.
   * @type   Function
   * @function
   * @public
   * @static
   */
  update : function() {
    var that = Pot.Deferred.fn, args = arrayize(arguments);
    args.unshift(that);
    update.apply(that, args);
    return this;
  }
});

Pot.Deferred.prototype.init.prototype = Pot.Deferred.prototype;
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Private methods for Deferred
/**
 * @lends Pot.Deferred
 */
/**
 * Set the current state.
 *
 * @private
 * @ignore
 */
function setState(value) {
  if (Pot.isError(value)) {
    this.state = Pot.Deferred.states.failure;
  } else {
    this.state = Pot.Deferred.states.success;
  }
  return this.state;
}

/**
 * Post the state and fire the chains.
 *
 * @private
 * @ignore
 */
function post(value) {
  setState.call(this, value);
  this.results[Pot.Deferred.states[this.state]] = value;
  if (!this.freezing && !this.tilling && !this.waiting) {
    fire.call(this);
  }
}

/**
 * Fire the callback sequence chains.
 *
 * @private
 * @ignore
 */
function fire(force) {
  if (force || (!this.freezing && !this.tilling && !this.waiting)) {
    if (this.options && this.options.async) {
      fireAsync.call(this);
    } else {
      fireSync.call(this);
    }
  }
}

/**
 * Fire the callback sequence chains by asynchronous.
 *
 * @private
 * @ignore
 */
function fireAsync() {
  var that = this, speed;
  if (this.options && Pot.isNumeric(this.options.speed)) {
    speed = this.options.speed;
  } else {
    speed = Pot.Deferred.defaults.speed;
  }
  this.freezing = true;
  Pot.Internal.setTimeout(function() {
    try {
      fireProcedure.call(that);
    } catch (e) {
      that.freezing = false;
      throw e;
    }
    if (chainsEnabled.call(that)) {
      Pot.Internal.setTimeout(function() {
        fire.call(that, true);
      }, 0);
    } else {
      that.freezing = false;
    }
  }, speed);
}

/**
 * Fire the callback sequence chains by synchronous.
 *
 * @private
 * @ignore
 */
function fireSync() {
  fireProcedure.call(this);
  if (this.options && this.options.async) {
    fire.call(this);
  }
}

/**
 * Fire the callback sequence chains.
 *
 * @private
 * @ignore
 */
function fireProcedure() {
  var that = this, result, callbacks, callback, nesting;
  result  = this.results[Pot.Deferred.states[this.state]];
  nesting = null;
  while (chainsEnabled.call(this)) {
    callbacks = this.chains.shift();
    callback = callbacks && callbacks[Pot.Deferred.states[this.state]];
    if (!Pot.isFunction(callback)) {
      continue;
    }
    try {
      if (Pot.isNumber(callback.length) && callback.length > 1 &&
          Pot.isArray(result) && result.length === callback.length) {
        result = callback.apply(this, result);
      } else {
        result = callback.call(this, result);
      }
      this.state = setState.call({}, result);
      if (Pot.isDeferred(result)) {
        /**@ignore*/
        nesting = function(result) {
          return bush.call(that, result);
        };
        this.nested++;
      }
    } catch (e) {
      this.state = Pot.Deferred.states.failure;
      result = e;
      if (!Pot.isError(result)) {
        result = new Error(result);
      }
    }
    if (this.options && this.options.async) {
      break;
    }
  }
  this.results[Pot.Deferred.states[this.state]] = result;
  if (nesting && this.nested) {
    result.ensure(nesting).end();
  }
}

/**
 * Valid chains.
 *
 * @private
 * @ignore
 */
function chainsEnabled() {
  return this.chains  && this.chains.length &&
    this.nested === 0 && !this.cancelled;
}

/**
 * Processing the child Deferred objects.
 *
 * @private
 * @ignore
 */
function bush(result) {
  post.call(this, result);
  this.nested--;
  if (this.nested === 0 && !this.cancelled &&
      (this.state & Pot.Deferred.states.fired)) {
    fire.call(this);
  }
}

/**
 * Parse the arguments of initialization method.
 *
 * @private
 * @ignore
 */
function initOptions(args, defaults) {
  var opts, speed, canceller, stopper, async, nop;
  if (args) {
    if (args.length === 1 && args[0] && Pot.isObject(args[0])) {
      opts = args[0];
      if (opts.speed !== nop || opts.canceller !== nop ||
          opts.async !== nop || opts.stopper   !== nop
      ) {
        speed     = opts.speed;
        canceller = opts.canceller;
        stopper   = opts.stopper;
        async     = opts.async;
      } else {
        speed     = opts.options && opts.options.speed;
        canceller = opts.options && opts.options.canceller;
        stopper   = opts.options && opts.options.stopper;
        async     = opts.options && opts.options.async;
      }
    } else {
      if (args.length === 1 && args[0] && Pot.isArray(args[0])) {
        opts = args[0];
      } else {
        opts = args;
      }
      each(opts || [], function(opt) {
        if (speed === nop && Pot.isNumeric(opt)) {
          speed = opt;
        } else if (speed === nop &&
                   Pot.isNumeric(Pot.Deferred.speeds[opt])) {
          speed = Pot.Deferred.speeds[opt];
        } else if (canceller === nop && Pot.isFunction(opt)) {
          canceller = opt;
        } else if (async === nop && Pot.isBoolean(opt)) {
          async = opt;
        } else if (stopper === nop &&
                 canceller === nop && Pot.isFunction(opt)) {
          stopper = opt;
        }
      });
    }
  }
  this.options = this.options || {};
  this.options.storage = this.options.storage || {};
  if (!Pot.isArray(this.options.cancellers)) {
    this.options.cancellers = [];
  }
  if (!Pot.isArray(this.options.stoppers)) {
    this.options.stoppers = [];
  }
  if (!Pot.isNumeric(speed)) {
    if (this.options.speed !== nop && Pot.isNumeric(this.options.speed)) {
      speed = this.options.speed - 0;
    } else {
      speed = defaults.speed;
    }
  }
  if (!Pot.isFunction(canceller)) {
    canceller = defaults.canceller;
  }
  if (!Pot.isFunction(stopper)) {
    stopper = defaults.stopper;
  }
  if (!Pot.isBoolean(async)) {
    if (this.options.async !== nop && Pot.isBoolean(this.options.async)) {
      async = this.options.async;
    } else {
      async = defaults.async;
    }
  }
  update(this.options, {
    speed : speed - 0,
    async : async
  });
  if (Pot.isFunction(canceller)) {
    this.options.cancellers.push(canceller);
  }
  if (Pot.isFunction(stopper)) {
    this.options.stoppers.push(stopper);
  }
  return this;
}

/**
 * Cancel the chains.
 *
 * @private
 * @ignore
 */
function cancelize(type) {
  var func;
  while (this.options[type] && this.options[type].length) {
    func = this.options[type].shift();
    if (Pot.isFunction(func)) {
      func.call(this);
    }
  }
}

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Create each speeds constructors (optional)

update(Pot.Deferred, {
  /**
   * @lends Pot.Deferred
   */
  /**
   * Extends object with speeds.
   *
   * @type Function
   * @function
   * @private
   * @ignore
   */
  extendSpeeds : function(target, name, construct, speeds) {
    var refers = {}, methods = {};
    /**@ignore*/
    var create = function(speedName, speed) {
      return function() {
        var opts = {}, args = arguments, me = args.callee;
        args = arrayize(args);
        initOptions.call(opts, args, {
          speed     : speed,
          canceller : Pot.Deferred.defaults.canceller,
          stopper   : Pot.Deferred.defaults.stopper,
          async     : Pot.Deferred.defaults.async
        });
        opts.speedName = speedName;
        args.unshift(opts);
        return construct.apply(me.instance, args);
      };
    };
    each(speeds, function(val, key) {
      methods[key] = create(key, val);
    });
    return update(target[name], methods);
  }
});

update(Pot.Internal, {
  /**
   * Reference to instance of object.
   *
   * @private
   * @ignore
   */
  referSpeeds : update(function(speeds) {
    var me = arguments.callee, prop, speed;
    if (speeds && this.forEach.fast.instance !== this) {
      for (prop in me.props) {
        if (prop in this && this[prop]) {
          for (speed in me.speeds) {
            if (speed in speeds && speed in this[prop] && this[prop][speed]) {
              this[prop][speed].instance = this;
            }
          }
        }
      }
    }
  }, {
    /**@ignore*/
    props : {
      forEach : true,
      repeat  : true,
      forEver : true,
      iterate : true,
      map     : true,
      filter  : true,
      reduce  : true,
      every   : true,
      some    : true
    },
    /**@ignore*/
    speeds : {
      limp   : 0,
      doze   : 1,
      slow   : 2,
      normal : 3,
      fast   : 4,
      rapid  : 5,
      ninja  : 6
    }
  })
});

/**
 * Pot.Deferred.*speed*
 * 
 * Ability to establish a chain method asynchronously with specified speed.
 *
 * @example
 *   // This chain will run slower than normal.
 *   var d = new Pot.Deferred.slow(); // or limp (comprehensible)
 *   d.then(function() {
 *     debug(1);
 *   }).then(function() {
 *     debug(2);
 *   }).then(function() {
 *     debug(3);
 *   }).begin();
 *
 *
 * @param  {Object|*}  Options.
 * @return {Deferred}  Returns new instance of Deferred.
 *
 * @static
 * @lends Pot.Deferred
 * @property {Function} limp
 *           Create new Deferred with slowest speed. (static)
 * @property {Function} doze
 *           Create new Deferred with slower speed. (static)
 * @property {Function} slow
 *           Create new Deferred with slow speed. (static)
 * @property {Function} normal
 *           Create new Deferred with normal speed. (static)
 * @property {Function} fast
 *           Create new Deferred with fast speed. (static)
 * @property {Function} rapid
 *           Create new Deferred with faster speed. (static)
 * @property {Function} ninja
 *           Create new Deferred with fastest speed. (static)
 */
Pot.Deferred.extendSpeeds(Pot, 'Deferred', function(options) {
  return Pot.Deferred(options);
}, Pot.Deferred.speeds);

})();
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Definition of Deferred utilities.
(function() {

update(Pot.Deferred, {
  /**
   * @lends Pot.Deferred
   */
  /**
   * Check whether the argument object is an instance of Pot.Deferred.
   *
   *
   * @example
   *   var o = {hoge: 1};
   *   var d = new Pot.Deferred();
   *   debug(isDeferred(o)); // false
   *   debug(isDeferred(d)); // true
   *
   *
   * @param  {Object|*}  x  The target object to test.
   * @return {Boolean}      Return true if the argument object is an
   *                          instance of Pot.Deferred,
   *                          otherwise return false.
   * @type Function
   * @function
   * @public
   * @static
   */
  isDeferred : Pot.isDeferred,
  /**
   * Return a Deferred that has already had .begin(result) called.
   *
   * This method useful when you execute synchronous code to
   *   an asynchronous interface.
   * i.e., some code is calling you expecting a Deferred result,
   *   but you don't actually need to do anything asynchronous.
   * Just return succeed(theResult).
   *
   *
   * @example
   *   function testFunc(value) {
   *     var result;
   *     if (value) {
   *       result = Pot.Deferred.succeed(value);
   *     } else {
   *       result = Pot.Deferred.begin(function() {
   *         return 'anything';
   *       });
   *     }
   *     return result;
   *   }
   *   testFunc( Math.random() * 10 >= 5 ? 'OK' : false ).then(function(res) {
   *     debug(res);
   *     // @results  res = 'OK' or 'anything'
   *   });
   *
   *
   * @param  {*}        (...)  The result to give to
   *                             Deferred.prototype.begin(result).
   * @return {Deferred}        Return a new Deferred.
   * @type Function
   * @function
   * @public
   * @static
   */
  succeed : function() {
    var d = new Pot.Deferred();
    d.begin.apply(d, arguments);
    return d;
  },
  /**
   * Return a Deferred that has already had .raise(result) called.
   *
   *
   * @example
   *   function testFunc(value) {
   *     var result;
   *     if (!value) {
   *       result = Pot.Deferred.failure('error');
   *     } else {
   *       result = Pot.Deferred.begin(function() {
   *         return 'success';
   *       });
   *     }
   *     return result;
   *   }
   *   testFunc(Math.random() * 10 >= 5 ? false : true).ensure(function(res) {
   *     debug(res);
   *     // @results  res = Error('error') or 'success'
   *   });
   *
   *
   * @param  {*}        (...)   The result to give to
   *                              Deferred.prototype.raise(result).
   * @return {Deferred}         Return a new Deferred.
   * @type Function
   * @function
   * @public
   * @static
   */
  failure : function() {
    var d = new Pot.Deferred();
    d.raise.apply(d, arguments);
    return d;
  },
  /**
   * Return a new cancellable Deferred that will .begin() after
   *  at least seconds seconds have elapsed.
   *
   *
   * @example
   *   // Called after 5 seconds.
   *   Pot.Deferred.wait(5).then(function() {
   *     debug('Begin wait() test');
   *   }).then(function() {
   *     return Pot.Deferred.wait(2); // Wait 2 seconds.
   *   }).then(function() {
   *     debug('End wait() test');
   *   });
   *
   *
   * @param  {Number}  seconds  Number of seconds.
   * @param  {*}       (value)  (optional) The value passed to the next chain.
   * @return {Deferred}         Return a new Deferred.
   * @type Function
   * @function
   * @public
   * @static
   */
  wait : function(seconds, value) {
    var timer, d = new Pot.Deferred({
      canceller : function() {
        try {
          Pot.Internal.clearTimeout(timer);
        } catch (e) {}
      }
    });
    if (arguments.length >= 2) {
      d.then(function() {
        return value;
      });
    }
    timer = Pot.Internal.setTimeout(function() {
      d.begin();
    }, Math.floor(((seconds - 0) || 0) * 1000));
    return d;
  },
  /**
   * Call the specified function after a few(seconds) seconds.
   *
   *
   * @example
   *   var value = null;
   *   // Called after 1 second.
   *   Pot.Deferred.callLater(1, function() {
   *     value = 'hoge';
   *   });
   *   debug(value); // null
   *   Pot.Deferred.callLater(1, function() {
   *     debug(value); // 'hoge'
   *   });
   *
   *
   * @example
   *   // Create a new Deferred synchronously.
   *   var d = new Pot.Deferred({ async : false });
   *   d.then(function() {
   *     return 'Hello Deferred!';
   *   }).then(function(res) {
   *     debug(res);
   *   });
   *   // But, run with asynchronously.
   *   // If the argument is the instance of Deferred
   *   //  then will be called "begin" method.
   *   Pot.Deferred.callLater(5, d); // Called after 5 seconds.
   *
   *
   * @param  {Number}   seconds   The number of seconds to delay.
   * @param  {Function} callback  The callback function.
   * @return {Deferred}           Return a new Deferred.
   * @type Function
   * @function
   * @public
   * @static
   */
  callLater : function(seconds, callback) {
    var args = arrayize(arguments, 2);
    return Pot.Deferred.wait(seconds).then(function() {
      if (Pot.isDeferred(callback)) {
        return callback.begin.apply(callback, args);
      } else if (Pot.isFunction(callback)) {
        return callback.apply(callback, args);
      } else {
        return callback;
      }
    });
  },
  /**
   * Call the specified function as browser-non-blocking in background.
   * If callback is a Deferred, then will call .begin(args)
   *
   *
   * @example
   *   var value = null;
   *   Pot.Deferred.callLazy(function() {
   *     value = 'hoge';
   *   });
   *   debug(value); // null
   *   Pot.Deferred.callLazy(function() {
   *     debug(value); // 'hoge'
   *   });
   *
   *
   * @example
   *   // Create a new Deferred synchronously.
   *   var d = new Pot.Deferred({ async : false });
   *   d.then(function() {
   *     return 'Hello Deferred!';
   *   }).then(function(res) {
   *     debug(res);
   *   });
   *   // But, run with asynchronously.
   *   // If the argument is the instance of Deferred
   *   //  then will be called "begin" method.
   *   Pot.Deferred.callLazy(d);
   *
   *
   * @param  {Function} callback  A function to execute.
   * @return {Deferred}           Return a new Deferred.
   * @type Function
   * @function
   * @public
   * @static
   */
  callLazy : function(callback) {
    var args = arrayize(arguments, 1);
    return Pot.Deferred.wait(0).then(function() {
      if (Pot.isDeferred(callback)) {
        return callback.begin.apply(callback, args);
      } else if (Pot.isFunction(callback)) {
        return callback.apply(callback, args);
      } else {
        return callback;
      }
    });
  },
  /**
   * Return a Deferred surely that maybe as a Deferred.
   *
   *
   * @example
   *   var maybeTest = function(obj) {
   *     var deferred = Pot.Deferred.maybeDeferred(obj);
   *     debug(deferred);
   *     // @results  deferred = (object Deferred {...})
   *     return deferred;
   *   };
   *   var obj;
   *   if (Math.random() * 10 < 5) {
   *     obj = new Pot.Deferred().then(function() {
   *       return 'foo';
   *     });
   *   } else {
   *     obj = 'bar';
   *   }
   *   maybeTest(obj).then(function(res) {
   *     debug('res = ' + res); // 'foo' or 'bar'
   *   }).begin();
   *
   *
   * @param  {*}         x    The value like a Deferred.
   * @retrun {Deferred}       Return a Deferred.
   * @type Function
   * @function
   * @public
   * @static
   */
  maybeDeferred : function(x) {
    var result;
    if (Pot.isDeferred(x)) {
      result = x;
    } else {
      result = Pot.Deferred.succeed(x);
    }
    return result;
  },
  /**
   * Check whether the callback chain was fired.
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   debug( Pot.Deferred.isFired(d) ); // false
   *   d.then(function() {
   *     return 'hoge';
   *   });
   *   debug( Pot.Deferred.isFired(d) ); // false
   *   d.begin();
   *   debug( Pot.Deferred.isFired(d) ); // true
   *
   *
   * @param  {Deferred}  deferred  The target Deferred object.
   * @return {Boolean}             Return whether the
   *                                 callback chain was fired.
   * @type Function
   * @function
   * @public
   * @static
   */
  isFired : function(deferred) {
    return Pot.isDeferred(deferred) &&
           ((deferred.state & Pot.Deferred.states.fired) !== 0);
  },
  /**
   * Get the last result of the callback chains.
   *
   *
   * @example
   *   var d = new Pot.Deferred({ async : false });
   *   d.then(function() {
   *     return 'foo';
   *   }).then(function(res) {
   *     return 'bar';
   *   }).then(function(res) {
   *     return 'baz';
   *   }).begin();
   *   var result = Pot.Deferred.lastResult(d);
   *   debug(result);
   *   // @results  result = 'baz'
   *
   *
   * @param  {Deferred}  deferred  The target Deferred object.
   * @return {*}                   Return the last result if exist.
   * @type Function
   * @function
   * @public
   * @static
   */
  lastResult : function(deferred) {
    var result;
    if (Pot.isDeferred(deferred)) {
      try {
        result = deferred.results[
          Pot.Deferred.states[Pot.Deferred.states.success]
        ];
      } catch (e) {}
    }
    return result;
  },
  /**
   * Get the last Error of the callback chains.
   *
   *
   * @example
   *   var d = new Pot.Deferred({ async : false });
   *   d.then(function() {
   *     throw new Error('foo');
   *   }).then(function(res) {
   *     throw new Error('bar');
   *   }).then(function(res) {
   *     throw new Error('baz');
   *   }).begin();
   *   var result = Pot.Deferred.lastError(d);
   *   debug(result);
   *   // @results  result = (Error: foo)
   *
   *
   * @param  {Deferred}  deferred  The target Deferred object.
   * @return {*}                   Return the last Error if exist.
   * @type Function
   * @function
   * @public
   * @static
   */
  lastError : function(deferred) {
    var result;
    if (Pot.isDeferred(deferred)) {
      try {
        result = deferred.results[
          Pot.Deferred.states[Pot.Deferred.states.failure]
        ];
      } catch (e) {}
    }
    return result;
  },
  /**
   * Register the new method into Pot.Deferred.prototype.
   *
   *
   * @example
   *   // Register the new method for waiting 5 seconds.
   *   Pot.Deferred.register('wait5', function(args) {
   *     return Pot.Deferred.wait(5).then(function() {
   *       return args.result;
   *     });
   *   });
   *   // Use registered method.
   *   var d = new Pot.Deferred();
   *   d.then(function() {
   *     debug('begin');
   *     return 1;
   *   }).wait5().then(function(res) {
   *     debug(res); // @results  res = 1
   *     debug('end');
   *   });
   *   d.begin();
   *
   *
   * @example
   *   // Register a new method for add the input value and the result.
   *   Pot.Deferred.register('add', function(args) {
   *     return args.input + args.result;
   *   });
   *   // Use registered method.
   *   var d = new Pot.Deferred();
   *   d.then(function() {
   *     debug('begin');
   *     return 100;
   *   }).add(50).then(function(res) {
   *     debug(res); // @results  res = 150
   *     debug('end');
   *   });
   *   d.begin();
   *
   *
   * @param  {String|Object}  name  The name of the new method.
   *                                  Or, the new methods as key-value object.
   * @param  {Function}       func  The new method.
   *                                  A new function has defined argument
   *                                    that is an object.
   *                                  <pre>
   *                                  -------------------------------------
   *                                  function(args)
   *                                    - args.input  :
   *                                        The original input arguments.
   *                                    - args.result :
   *                                        The result of previous
   *                                          callback chain.
   *                                  -------------------------------------
   *                                  </pre>
   * @return {Number}               Return the registered count.
   * @type Function
   * @function
   * @public
   * @static
   */
  register : function(/*name, func*/) {
    var result, that = Pot.Deferred.fn, args = arrayize(arguments), methods;
    result  = 0;
    methods = [];
    switch (args.length) {
      case 0:
          break;
      case 1:
          if (Pot.isObject(args[0])) {
            each(args[0], function(val, key) {
              if (Pot.isFunction(val) && Pot.isString(key)) {
                methods.push([key, val]);
              } else if (Pot.isFunction(key) && Pot.isString(val)) {
                methods.push([val, key]);
              }
            });
          }
          break;
      case 2:
      default:
          if (Pot.isFunction(args[0])) {
            methods.push([args[1], args[0]]);
          } else {
            methods.push([args[0], args[1]]);
          }
          break;
    }
    if (methods && methods.length) {
      each(methods, function(item) {
        var subs = {}, name, func, method;
        if (item && item.length >= 2 && Pot.isFunction(item[1])) {
          name = stringify(item[0], true);
          func = item[1];
          /**@ignore*/
          method = function() {
            var params = {}, a = arrayize(arguments);
            params.input = (a.length > 1) ? a : a[0];
            return this.then(function() {
              var ar = arrayize(arguments);
              params.result = (ar.length > 1) ? ar : ar[0];
              return func.apply(this, arrayize(params));
            });
          };
          subs[name] = method;
          update(that, subs);
          result++;
        }
      });
    }
    return result;
  },
  /**
   * Unregister the user defined method from Pot.Deferred.prototype.
   *
   *
   * @example
   *   // Register a new method for add the input value and the result.
   *   Pot.Deferred.register('add', function(args) {
   *     return args.input + args.result;
   *   });
   *   // Use registered method.
   *   var d = new Pot.Deferred();
   *   d.then(function() {
   *     debug('begin');
   *     return 100;
   *   }).add(50).then(function(res) {
   *     debug(res); // @results  res = 150
   *     debug('end');
   *   });
   *   d.begin();
   *   // Unregister the user defined method from Pot.Deferred.prototype.
   *   Pot.Deferred.unregister('add');
   *   var dfd = new Pot.Deferred();
   *   dfd.then(function() {
   *     debug('After unregister');
   *     return 10;
   *     // Next chain will be occur an error: add is undefined.
   *   }).add(20).then(function(res) {
   *     debug(res);
   *   });
   *   dfd.begin();
   *
   *
   * @param  {String|Array}  name  The name of the user defined method.
   * @return {Number}              Return the unregistered count.
   * @type Function
   * @function
   * @public
   * @static
   */
  unregister : function(/*name*/) {
    var result, that = Pot.Deferred.fn, args = arrayize(arguments), names;
    result = 0;
    if (args.length > 1) {
      names = args;
    } else {
      names = args[0];
    }
    each(arrayize(names), function(name) {
      try {
        delete that[name];
        result++;
      } catch (e) {}
    });
    return result;
  },
  /**
   * Create new defer function from static function.
   * That returns a new instance of Pot.Deferred that
   *   has already ".begin()" called.
   *
   *
   * @example
   *   var timer = Pot.Deferred.deferrize(window, 'setTimeout');
   *   // Call the defer function with same as the original arguments usage.
   *   timer(function() {
   *     debug('in timer (2000 ms.)');
   *   }, 2000).then(function() {
   *     debug('End timer');
   *   });
   *
   *
   * @example
   *   var byId = Pot.Deferred.deferrize(document, 'getElementById');
   *   // Call the defer function with same as the original arguments usage.
   *   byId('container').then(function(element) {
   *     debug('End byId()');
   *     debug('tagName = ' + element.tagName);
   *     // @results  tagName = 'DIV'
   *   });
   *
   *
   * @example
   *   // Example of user defined function.
   *   var toCharCode = Pot.Deferred.deferrize(function(string) {
   *     var chars = [], i, len = string.length;
   *     for (i = 0; i < len; i++) {
   *       chars.push(string.charCodeAt(i));
   *     }
   *     return chars;
   *   });
   *   var string = 'abcdef';
   *   Pot.Deferred.begin(function() {
   *     debug('string = ' + string);
   *     return toCharCode(string).then(function(result) {
   *       debug('result = ' + result);
   *       // @results  result = [97, 98, 99, 100, 101, 102]
   *     });
   *   });
   *
   *
   * @param  {Object|Function}   object   The context object.
   *                                        or the target function.
   * @param  {String|Function}  (method)  The target function name.
   *                                        or the target function.
   * @return {Function}                   The defer function that
   *                                        returns Deferred object.
   * @based  JSDeferred.connect
   * @type   Function
   * @function
   * @public
   * @static
   */
  deferrize : function(object, method) {
    var args = arguments, func, context, err;
    try {
      switch (args.length) {
        case 0:
            throw false;
        case 1:
            func = object;
            break;
        case 2:
        default:
            func = method;
            context = object;
            break;
      }
      if (!func) {
        throw func;
      }
    } catch (e) {
      err = e;
      throw (Pot.isError(err) ? err : new Error(err));
    }
    return function() {
      var that = this, args = arrayize(arguments), d = new Pot.Deferred();
      d.then(function() {
        var dd, result, params = [], done = false, error;
        dd = new Pot.Deferred();
        each(args, function(val) {
          if (!done && Pot.isFunction(val)) {
            params.push(function() {
              var r, er;
              try {
                r = val.apply(that, arguments);
              } catch (e) {
                er = e;
                dd.raise(er);
              } finally {
                dd.begin(r);
              }
              if (er) {
                throw Pot.isError(er) ? er : new Error(er);
              }
              return r;
            });
            done = true;
          } else {
            params[params.length] = val;
          }
        });
        try {
          result = invoke(context, func, params);
        } catch (e) {
          error = e;
          if (!done) {
            dd.raise(error);
          }
        } finally {
          if (!done) {
            dd.begin(result);
          }
        }
        if (error) {
          throw Pot.isError(error) ? error : new Error(error);
        }
        return dd;
      }).begin();
      return d;
    };
  },
  /**
   * Update the Pot.Deferred.
   *
   *
   * @example
   *   // Update Pot.Deferred.
   *   Pot.Deferred.update({
   *     sayHoge : function() {
   *       alert('hoge');
   *     }
   *   });
   *   Pot.Deferred.sayHoge(); // hoge
   *
   *
   * @param  {Object}        (...)  The object to update.
   * @return {Pot.Deferred}         Return Pot.Deferred.
   * @type   Function
   * @function
   * @public
   * @static
   */
  update : function() {
    var that = Pot.Deferred, args = arrayize(arguments);
    args.unshift(that);
    return update.apply(that, args);
  }
});

// Definitions of the loop/iterator methods.
update(Pot.Deferred, {
  /**
   * @lends Pot.Deferred
   */
  /**
   * A shortcut faster way of creating new Deferred sequence.
   *
   *
   * @example
   *   Pot.Deferred.begin(function() {
   *     debug('Begin Deferred.begin');
   *   }).wait(1).then(function() {
   *     debug('End Deferred.begin');
   *   });
   *   // Without having to call  the ".begin()", has already executed.
   *
   *
   * @param  {Function|*}   x   A callback function or any value.
   * @return {Deferred}         Return a new Deferred.
   * @class
   * @type Function
   * @function
   * @public
   * @static
   */
  begin : function(x) {
    var d, timer, args = arrayize(arguments, 1), callable;
    d = new Pot.Deferred({
      async     : true,
      canceller : function() {
        try {
          Pot.Internal.clearTimeout(timer);
        } catch (e) {}
      }
    });
    callable = x && Pot.isFunction(x);
    timer = Pot.Internal.setTimeout(function() {
      d.begin(callable ? (void 0) : x);
    }, 0);
    if (callable) {
      d.then(function() {
        return x.apply(this, args);
      });
    }
    return d;
  },
  /**
   * Call the function with asynchronous.
   *
   *
   * @example
   *   var value = null;
   *   // Call the function with asynchronous.
   *   Pot.Deferred.flush(function() {
   *     debug('Begin Deferred.flush');
   *     value = 1;
   *   }).wait(1).then(function() {
   *     debug('End Deferred.flush');
   *     value = 2;
   *   });
   *   // Without having to call the ".begin()", has already executed.
   *   debug(value);
   *   // @results  value = null
   *   Pot.Deferred.callLater(2.5, function() {
   *     debug(value);
   *     // @results  value = 2
   *   });
   *
   *
   * @param  {Function|*} callback  A function to call.
   * @param  {...}        (...)     Arguments passed to callback.
   * @return {Deferred}             Return a new Deferred.
   * @class
   * @type Function
   * @function
   * @public
   * @static
   */
  flush : function(callback) {
    var args = arrayize(arguments, 1);
    return Pot.Deferred.begin(function() {
      if (Pot.isDeferred(callback)) {
        return callback.begin.apply(callback, args);
      } else if (Pot.isFunction(callback)) {
        return callback.apply(this, args);
      } else {
        return callback;
      }
    });
  },
  /**
   * Wait until the condition completed.
   * If true returned, waiting state will end.
   *
   *
   * @example
   *   debug('Begin till');
   *   Pot.Deferred.till(function() {
   *     // wait until the DOM body element is loaded
   *     if (!document.body) {
   *       return false;
   *     } else {
   *       return true;
   *     }
   *   }).then(function() {
   *     debug('End till');
   *     document.body.innerHTML += 'hoge';
   *   });
   *
   *
   * @param  {Function|*}   cond   A function or value as condition.
   * @return {Deferred}            Return the Deferred.
   * @type Function
   * @function
   * @public
   * @static
   */
  till : function(cond) {
    var d = new Pot.Deferred(), args = arrayize(arguments, 1), interval = 13;
    return Pot.Deferred.begin(function() {
      var that = this, me = arguments.callee, time = now();
      if (cond && !cond.apply(this, args)) {
        Pot.Internal.setTimeout(function() {
          me.call(that);
        }, interval + (now() - time));
      } else {
        d.begin();
      }
      return d;
    });
  },
  /**
   * Bundle up some Deferreds (DeferredList) to one Deferred
   *  then returns results of  these list.
   *
   * The DeferredList can be as Array or Object.
   *
   *
   * @example
   *   Pot.Deferred.parallel([
   *     function() {
   *       debug(1);
   *       return 1;
   *     },
   *     function() {
   *       debug(2);
   *       var d = new Pot.Deferred();
   *       return d.then(function() { return 2; }).begin();
   *     },
   *     (new Pot.Deferred()).then(function() {
   *       debug(3);
   *       return 3;
   *     }),
   *     '{4}',
   *     (new Pot.Deferred()).then(function() {
   *       return Pot.Deferred.wait(1).then(function() {
   *         debug(5);
   *         return 5;
   *       });
   *     }),
   *     6.00126,
   *     function() {
   *       return Pot.Deferred.succeed().then(function() {
   *         return Pot.Deferred.wait(1).then(function() {
   *           return 7;
   *         });
   *       });
   *     },
   *     function() {
   *       debug('8 [END]');
   *       return 8;
   *     }
   *   ]).then(function(values) {
   *     debug(values);
   *     // values[0] == 1
   *     // values[1] == 2
   *     // values[2] == 3
   *     // values[3] == '{4}'
   *     // ...
   *   });
   *   // @results  values = [1, 2, 3, '{4}', 5, 6.00126, 7, 8]
   *
   *
   * @example
   *   Pot.Deferred.parallel({
   *     foo : function() {
   *       debug(1);
   *       return 1;
   *     },
   *     bar : (new Pot.Deferred()).then(function() {
   *       debug(2);
   *       return Pot.Deferred.begin(function() {
   *         return Pot.Deferred.wait(1).then(function() {
   *           return Pot.Deferred.succeed(2);
   *         });
   *       });
   *     }),
   *     baz : function() {
   *       var d = new Pot.Deferred();
   *       return d.async(false).then(function() {
   *         debug(3);
   *         return 3;
   *       });
   *     }
   *   }).then(function(values) {
   *     debug(values);
   *     // values.foo == 1
   *     // values.bar == 2
   *     // values.baz == 3
   *   });
   *   // @results  values = {foo: 1, bar: 2, baz: 3}
   *
   *
   * @param  {...[Array|Object|*]} deferredList  Deferred list to get
   *                                               the results in bundles.
   * @return {Deferred}                          Return the Deferred.
   * @type Function
   * @function
   * @public
   * @static
   */
  parallel : function(deferredList) {
    var result, args = arguments, d, deferreds, values;
    if (args.length === 0) {
      result = Pot.Deferred.succeed();
    } else {
      if (args.length === 1) {
        if (Pot.isObject(deferredList)) {
          deferreds = deferredList;
        } else {
          deferreds = arrayize(deferredList);
        }
      } else {
        deferreds = arrayize(args);
      }
      result = new Pot.Deferred({
        canceller : function() {
          each(deferreds, function(deferred) {
            if (Pot.isDeferred(deferred)) {
              deferred.cancel();
            }
          });
        }
      });
      values = {};
      d = new Pot.Deferred();
      each(deferreds, function(deferred, key) {
        var defer;
        if (Pot.isDeferred(deferred)) {
          defer = deferred;
        } else {
          if (Pot.isFunction(deferred)) {
            defer = new Pot.Deferred();
            defer.then(function() {
              var r = deferred();
              if (Pot.isDeferred(r) &&
                  r.state === Pot.Deferred.states.unfired) {
                r.begin();
              }
              return r;
            });
          } else {
            defer = Pot.Deferred.succeed(deferred);
          }
        }
        d.then(function() {
          if (!Pot.isDeferred(defer)) {
            defer = Pot.Deferred.maybeDeferred(defer);
          }
          if (defer.state === Pot.Deferred.states.unfired) {
            Pot.Deferred.callLazy(defer);
          }
          return defer;
        }).then(function(value) {
          values[key] = value;
        });
      });
      d.then(function() {
        result.begin(values);
      }, function(err) {
        result.raise(err);
      });
      Pot.Deferred.callLazy(d);
    }
    return result;
  },
  /**
   * Create a new Deferred with callback chains by
   *   some functionable arguments.
   *
   *
   * @example
   *   var deferred = Pot.Deferred.chain(
   *     function() {
   *       debug(1);
   *       return Pot.Deferred.wait(1);
   *     },
   *     function() {
   *       debug(2);
   *       throw new Error('error');
   *     },
   *     function rescue(err) {
   *       debug(3);
   *       debug('Error : ' + err);
   *     },
   *     1000,
   *     function(number) {
   *       debug(4);
   *       debug('prev number = ' + number);
   *       return Pot.Deferred.wait(2);
   *     },
   *     {
   *       foo : function() {
   *         debug('5 foo');
   *         return '{{foo}}';
   *       },
   *       bar : function() {
   *         debug('6 bar');
   *         return Pot.Deferred.begin(function() {
   *           return '{{bar}}';
   *         });
   *       }
   *     },
   *     function(res) {
   *       debug('7 res:');
   *       debug(res);
   *     },
   *     new Error('error2'),
   *     function() {
   *       debug('This chain will not be called.');
   *     },
   *     function rescue(e) {
   *       debug(8);
   *       debug('Error : ' + e);
   *     },
   *     [
   *       function() {
   *         debug(9);
   *         return Pot.Deferred.wait(1).then(function() {
   *           return 9;
   *         });
   *       },
   *       function() {
   *         debug(10);
   *         return Pot.Deferred.wait(1.5).then(function() {
   *           return Pot.Deferred.succeed(10);
   *         });
   *       }
   *     ],
   *     function(res) {
   *       debug('11 res:');
   *       debug('res[0] = ' + res[0] + ', res[1] = ' + res[1]);
   *     },
   *     (new Pot.Deferred()).then(function() {
   *       debug('12 [END]');
   *     })
   *   );
   *
   *
   * @param  {...[Function|Array|Object|*]}  (...)  Arguments to
   *                                                  concatenate the chains.
   * @return {Deferred}                             Return a new Deferred.
   * @type Function
   * @function
   * @public
   * @static
   * @based  JSDeferred.chain
   */
  chain : function() {
    var args = arguments, len = args.length, chains, chain, re;
    chain = new Pot.Deferred();
    if (len > 0) {
      chains = arrayize(len === 1 ? args[0] : args);
      re = {
        name   : /^\s*[()]*\s*function\s*([^\s()]+)/,
        rescue : /rescue|raise|err|fail/i
      };
      each(chains, function(o) {
        var name;
        if (Pot.isFunction(o)) {
          try {
            name = o.toString().match(re.name)[1];
          } catch (e) {}
          if (name && re.rescue.test(name)) {
            chain.rescue(o);
          } else {
            chain.then(o);
          }
        } else if (Pot.isDeferred(o)) {
          chain.then(function(v) {
            if (o.state === Pot.Deferred.states.unfired) {
              o.begin(v);
            }
            return o;
          });
        } else if (Pot.isObject(o) || Pot.isArray(o)) {
          chain.then(function() {
            return Pot.Deferred.parallel(o);
          });
        } else if (Pot.isError(o)) {
          chain.then(function() {
            throw o;
          });
        } else {
          chain.then(function() {
            return o;
          });
        }
      });
    }
    Pot.Deferred.callLazy(chain);
    return chain;
  }
});

// Extends the speeds control methods
/**
 * Pot.Deferred.begin.*speed* (limp/doze/slow/normal/fast/rapid/ninja).
 *
 * A shortcut faster way of
 *   creating new Deferred sequence with specified speed.
 *
 * @param  {Function|*}   x   A callback function or any value.
 * @return {Deferred}         Return a new Deferred.
 *
 * @static
 * @lends Pot.Deferred.begin
 * @property {Function} limp
 *           Return new Deferred with slowest speed. (static)
 * @property {Function} doze
 *           Return new Deferred with slower speed. (static)
 * @property {Function} slow
 *           Return new Deferred with slow speed. (static)
 * @property {Function} normal
 *           Return new Deferred with normal speed. (static)
 * @property {Function} fast
 *           Return new Deferred with fast speed. (static)
 * @property {Function} rapid
 *           Return new Deferred with faster speed. (static)
 * @property {Function} ninja
 *           Return new Deferred with fastest speed. (static)
 */
Pot.Deferred.extendSpeeds(Pot.Deferred, 'begin', function(opts, x) {
  var d, timer, args = arrayize(arguments, 2), callable, op;
  callable = Pot.isFunction(x);
  op = opts.options || opts || {};
  if (!op.cancellers) {
    op.cancellers = [];
  }
  op.cancellers.push(function() {
    try {
      Pot.Internal.clearTimeout(timer);
    } catch (e) {}
  });
  d = new Pot.Deferred(opts);
  timer = Pot.Internal.setTimeout(function() {
    d.begin(callable ? (void 0) : x);
  }, opts.options && opts.options.speed || opts.speed);
  if (callable) {
    d.then(function() {
      return x.apply(this, args);
    });
  }
  return d;
}, Pot.Deferred.speeds);

/**
 * Pot.Deferred.flush.*speed* (limp/doze/slow/normal/fast/rapid/ninja).
 *
 * Call the function with asynchronous by specified speed.
 *
 * @param  {Function|*} callback  A function to call.
 * @param  {...}        (...)     Arguments passed to callback.
 * @return {Deferred}
 *
 * @static
 * @lends Pot.Deferred.flush
 * @property {Function} limp
 *           Return new Deferred with slowest speed. (static)
 * @property {Function} doze
 *           Return new Deferred with slower speed. (static)
 * @property {Function} slow
 *           Return new Deferred with slow speed. (static)
 * @property {Function} normal
 *           Return new Deferred with normal speed. (static)
 * @property {Function} fast
 *           Return new Deferred with fast speed. (static)
 * @property {Function} rapid
 *           Return new Deferred with faster speed. (static)
 * @property {Function} ninja
 *           Return new Deferred with fastest speed. (static)
 */
Pot.Deferred.extendSpeeds(Pot.Deferred, 'flush', function(opts, callback) {
  var speed, name, method, args = arrayize(arguments, 2);
  speed = opts.options ? opts.options.speed : opts.speed;
  if (speed in Pot.Deferred.speeds &&
      Pot.isString(Pot.Deferred.speeds[speed])) {
    name = Pot.Deferred.speeds[speed];
  } else {
    each(Pot.Deferred.speeds, function(val, key) {
      if (val == speed) {
        name = key;
        throw Pot.StopIteration;
      }
    });
  }
  if (name && name in Pot.Deferred.begin) {
    method = Pot.Deferred.begin[name];
  } else {
    method = Pot.Deferred.begin;
  }
  return method(function() {
    if (Pot.isDeferred(callback)) {
      return callback.begin.apply(callback, args);
    } else if (Pot.isFunction(callback)) {
      return callback.apply(this, args);
    } else {
      return callback;
    }
  });
}, Pot.Deferred.speeds);

})();
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Define iteration methods. (internal)

update(Pot.Internal, {
  /**
   * @lends Pot.Internal
   */
  /**
   * LightIterator.
   *
   * Async/Sync iterator.
   *
   * @class
   * @private
   * @constructor
   * @ignore
   */
  LightIterator : update(function(object, callback, options) {
    return new Pot.Internal.LightIterator.prototype.doit(
      object, callback, options
    );
  }, {
    /**@ignore*/
    speeds : {
      limp   : -1,
      doze   :  0,
      slow   :  2,
      normal :  5,
      fast   : 12,
      rapid  : 36,
      ninja  : 60
    },
    /**@ignore*/
    delays : {
      limp   : 1000,
      doze   :  100,
      slow   :   13,
      normal :    0,
      fast   :    0,
      rapid  :    0,
      ninja  :    0
    },
    /**@ignore*/
    types : {
      forLoop   : 0x01,
      forInLoop : 0x02,
      repeat    : 0x04,
      forEver   : 0x08,
      iterate   : 0x10
    }
  })
});

update(Pot.Internal.LightIterator, {
  /**@ignore*/
  defaults : {
    speed : Pot.Internal.LightIterator.speeds.normal
  },
  /**@ignore*/
  revSpeeds : {}
});

each(Pot.Internal.LightIterator.speeds, function(v, k) {
  Pot.Internal.LightIterator.revSpeeds[v] = k;
});

Pot.Internal.LightIterator.prototype =
  update(Pot.Internal.LightIterator.prototype, {
  /**
   * @lends Pot.Internal.LightIterator.prototype
   */
  /**
   * @ignore
   */
  constructor : Pot.Internal.LightIterator,
  /**
   * @private
   * @ignore
   */
  interval : Pot.Internal.LightIterator.defaults.speed,
  /**
   * @private
   * @ignore
   */
  iter : null,
  /**
   * @private
   * @ignore
   */
  result : null,
  /**
   * @private
   * @ignore
   */
  deferred : null,
  /**
   * @private
   * @ignore
   */
  revDeferred : null,
  /**
   * @private
   * @ignore
   */
  time : {},
  /**
   * @private
   * @ignore
   */
  waiting : false,
  /**
   * @private
   * @ignore
   */
  restable : false,
  /**
   * @private
   * @ignore
   */
  async : false,
  /**
   * @private
   * @ignore
   */
  options : null,
  /**
   * @private
   * @ignore
   */
  doit : function(object, callback, options) {
    this.setOptions(options);
    this.execute(object, callback);
    this.watch();
    return this;
  },
  /**
   * Set the options.
   *
   * @private
   * @ignore
   */
  setOptions : function(options) {
    this.options = options || {};
    this.setInterval();
    this.setAsync();
  },
  /**
   * Set the interval option.
   *
   * @private
   * @ignore
   */
  setInterval : function() {
    var n = null;
    if (Pot.isNumeric(this.options.interval)) {
      n = this.options.interval - 0;
    } else if (this.options.interval in Pot.Internal.LightIterator.speeds) {
      n = Pot.Internal.LightIterator.speeds[this.options.interval] - 0;
    }
    if (n !== null && !isNaN(n)) {
      this.interval = n;
    }
    if (!Pot.isNumeric(this.interval)) {
      this.interval = Pot.Internal.LightIterator.defaults.speed;
    }
  },
  /**
   * Set the async option.
   *
   * @private
   * @ignore
   */
  setAsync : function() {
    var a = null;
    if (this.options.async !== undefined) {
      a = !!this.options.async;
    }
    if (a !== null) {
      this.async = !!a;
    }
    if (!Pot.isBoolean(this.async)) {
      this.async = !!this.async;
    }
  },
  /**
   * Create a new Deferred.
   *
   * @private
   * @ignore
   */
  createDeferred : function() {
    return new Pot.Deferred({ async : false });
  },
  /**
   * Watch the process.
   *
   * @private
   * @ignore
   */
  watch : function() {
    var that = this;
    if (!this.async && this.waiting === true) {
      if (this.isWaitable()) {
        Pot.XPCOM.till(function() {
          return that.waiting !== true;
        });
      } else {
        //XXX: Fix to synchronize loop for perfectly.
        throw new Error('Failed to synchronize loop');
      }
    }
  },
  /**
   * Execute process.
   *
   * @private
   * @ignore
   */
  execute : function(object, callback) {
    var d, that = this;
    this.waiting = true;
    if (!object) {
      this.result = {};
      this.waiting = false;
    } else {
      this.waiting  = true;
      this.restable = true;
      this.time = {
        total  : null,
        loop   : null,
        count  : 1,
        rest   : 100,
        limit  : 255
      };
      this.setIter(object, callback);
      if (!this.async && !this.isWaitable()) {
        this.revback();
        this.waiting = false;
      } else {
        d = this.createDeferred();
        d.then(function() {
          var d1, d2;
          d1 = that.createDeferred();
          d2 = that.createDeferred();
          d1.then(function() {
            return that.revolve().then(function() {
              d2.begin();
            });
          }).begin();
          return d2;
        }).ensure(function() {
          that.waiting = false;
        });
        if (this.async) {
          this.deferred = d.then(function() {
            return that.result;
          });
        }
        this.flush(d);
      }
    }
  },
  /**
   * @private
   * @ignore
   */
  setIter : function(object, callback) {
    var type, types, context;
    type = this.options.type;
    types = Pot.Internal.LightIterator.types;
    context = this.options.context;
    if ((type & types.iterate) === types.iterate) {
      this.result = null;
      this.iter = this.iterate(object, callback, context);
    } else if ((type & types.forEver) === types.forEver) {
      this.result = {};
      this.iter = this.forEver(object, context);
    } else if ((type & types.repeat) === types.repeat) {
      this.result = {};
      this.iter = this.repeat(object, callback, context);
    } else if (Pot.isArrayLike(object)) {
      this.result = object;
      this.iter = this.forLoop(object, callback, context);
    } else {
      this.result = object;
      this.iter = this.forInLoop(object, callback, context);
    }
  },
  /**
   * @private
   * @ignore
   */
  revback : function() {
    var err, cutback = false, diff, ax;
    this.time.loop = now();
    REVOLVE: {
      do {
        try {
          this.iter.next();
        } catch (e) {
          err = e;
          if (Pot.isStopIter(err)) {
            break REVOLVE;
          }
          throw err;
        }
        if (this.isWaitable()) {
          if (this.time.total === null) {
            this.time.total = now();
          } else if (now() - this.time.total >= this.time.rest) {
            Pot.XPCOM.till(0);
            this.time.total = now();
          }
        } else if (!this.async) {
          if (this.restable && this.time.count >= this.time.limit) {
            this.restable = false;
          }
        }
        diff = now() - this.time.loop;
        if (diff >= this.interval) {
          if (this.async &&
              this.interval < Pot.Internal.LightIterator.speeds.normal) {
            cutback = true;
          } else if (this.async || this.restable || this.isWaitable()) {
            if (diff < this.interval + 8) {
              ax = 2;
            } else if (diff < this.interval + 36) {
              ax = 5;
            } else {
              ax = 7;
            }
            cutback = (Math.random() * 10 < ax);
          }
        }
      } while (!cutback);
      if (this.time.count <= this.time.limit) {
        this.time.count++;
      }
      return this.flush(this.revback, true);
    }
    if (Pot.isDeferred(this.revDeferred)) {
      this.revDeferred.begin();
    }
  },
  /**
   * Revolve the process.
   *
   * @private
   * @ignore
   */
  revolve : function() {
    var that = this, d, de;
    d  = this.createDeferred();
    de = this.createDeferred();
    d.then(function() {
      var dd = that.createDeferred();
      dd.then(function() {
        that.revDeferred = that.createDeferred();
        that.revback();
      }).begin();
      return that.revDeferred;
    }).ensure(function(er) {
      de.begin();
      if (Pot.isError(er)) {
        throw er;
      }
    });
    this.flush(d);
    return de;
  },
  /**
   * Flush the callback.
   *
   * @private
   * @ignore
   */
  flush : function(callback, useSpeed) {
    var that = this, d, lazy = false, speed, speedKey;
    if (this.async || this.isWaitable()) {
      lazy = true;
    }
    if (!lazy && Pot.isFunction(callback)) {
      return callback.call(this);
    } else {
      d = this.createDeferred();
      d.then(function() {
        if (Pot.isDeferred(callback)) {
          callback.begin();
        } else {
          callback.apply(that);
        }
      });
      if (lazy) {
        speed = 0;
        if (useSpeed) {
          speedKey = Pot.Internal.LightIterator.revSpeeds[this.interval];
          if (speedKey &&
              Pot.isNumeric(Pot.Internal.LightIterator.delays[speedKey])) {
            speed = Pot.Internal.LightIterator.delays[speedKey];
          }
        }
        if (speed === 0) {
          Pot.Deferred.callLazy(d);
        } else {
          Pot.Deferred.callLater(speed / 1000, d);
        }
      } else {
        d.begin();
      }
      return d;
    }
  },
  /**
   * @private
   * @ignore
   */
  isWaitable : function() {
    return !!(Pot.System.isWaitable && Pot.XPCOM && Pot.XPCOM.isEnabled);
  },
  /**
   * Return noop function.
   *
   * @private
   * @ignore
   */
  noop : function() {
    return {
      /**@ignore*/
      next : function() {
        throw Pot.StopIteration;
      }
    };
  },
  /**
   * forEver.
   *
   * @private
   * @ignore
   */
  forEver : function(callback, context) {
    var i = 0;
    if (!Pot.isFunction(callback)) {
      return this.noop;
    }
    return {
      /**@ignore*/
      next : function() {
        var result = callback.call(context, i);
        try {
          if (!isFinite(++i) || i >= Number.MAX_VALUE) {
            throw 0;
          }
        } catch (ex) {
          i = 0;
        }
      }
    };
  },
  /**
   * repeat.
   *
   * @private
   * @ignore
   */
  repeat : function(max, callback, context) {
    var i, loops, n, last;
    if (!Pot.isFunction(callback)) {
      return this.noop;
    }
    if (!max || max == null) {
      n = 0;
    } else if (Pot.isNumeric(max)) {
      n = max - 0;
    } else {
      n = max || {};
      if (Pot.isNumeric(n.start)) {
        n.begin = n.start;
      }
      if (Pot.isNumeric(n.stop)) {
        n.end = n.stop;
      }
    }
    loops = {
      begin : Pot.isNumeric(n.begin) ? n.begin - 0 : 0,
      end   : Pot.isNumeric(n.end)   ? n.end   - 0 : (n || 0) - 0,
      step  : Pot.isNumeric(n.step)  ? n.step  - 0 : 1,
      last  : false,
      prev  : null
    };
    i = loops.step ? loops.begin : loops.end;
    last = loops.end - loops.step;
    return {
      /**@ignore*/
      next : function() {
        var result;
        if (i < loops.end) {
          loops.last = (i >= last);
          result = callback.call(context, i, loops.last, loops);
          loops.prev = result;
        } else {
          throw Pot.StopIteration;
        }
        i += loops.step;
      }
    };
  },
  /**
   * forLoop.
   *
   * @private
   * @ignore
   */
  forLoop : function(object, callback, context) {
    var copy, i = 0;
    if (!object || !object.length || !Pot.isFunction(callback)) {
      return this.noop;
    }
    copy = arrayize(object);
    return {
      /**@ignore*/
      next : function() {
        var val, result;
        while (true) {
          if (i >= copy.length) {
            throw Pot.StopIteration;
          }
          if (!(i in copy)) {
            i++;
            continue;
          }
          try {
            val = copy[i];
          } catch (e) {
            i++;
            continue;
          }
          result = callback.call(context, val, i, object);
          i++;
          break;
        }
      }
    };
  },
  /**
   * forInLoop.
   *
   * @private
   * @ignore
   */
  forInLoop : function(object, callback, context) {
    var copy, i = 0, p, v, len;
    //XXX: Should use "yield" for duplicate loops.
    if (Pot.isFunction(callback)) {
      copy = [];
      for (p in object) {
        try {
          v = object[p];
        } catch (e) {
          continue;
        }
        copy[copy.length] = [v, p];
      }
    }
    if (!copy || !copy.length) {
      return this.noop;
    }
    return {
      /**@ignore*/
      next : function() {
        var result, c, key, val;
        while (true) {
          if (i >= copy.length) {
            throw Pot.StopIteration;
          }
          if (!(i in copy)) {
            i++;
            continue;
          }
          try {
            c = copy[i];
            val = c[0];
            key = c[1];
          } catch (e) {
            i++;
            continue;
          }
          result = callback.call(context, val, key, object);
          i++;
          break;
        }
      }
    };
  },
  /**
   * iterate.
   *
   * @private
   * @ignore
   */
  iterate : function(object, callback, context) {
    var that = this, iterable;
    iterable = Pot.Iter.toIter(object);
    if (!Pot.isIter(iterable)) {
      return this.noop;
    }
    if (Pot.isFunction(callback)) {
      return {
        /**@ignore*/
        next : function() {
          var results = iterable.next();
          results.push(object);
          that.result = callback.apply(context, results);
        }
      };
    } else {
      return {
        /**@ignore*/
        next : function() {
          that.result = iterable.next();
        }
      };
    }
  }
});

Pot.Internal.LightIterator.prototype.doit.prototype =
  Pot.Internal.LightIterator.prototype;
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Define the main iterators.

// Temporary creation function.
update(Pot.tmp, {
  /**
   * @lends Pot.tmp
   */
  /**
   * @private
   * @ignore
   */
  createLightIterateConstructor : function(creator) {
    var methods, construct, name;
    /**@ignore*/
    var create = function(speed) {
      var interval;
      if (Pot.Internal.LightIterator.speeds[speed] === undefined) {
        interval = Pot.Internal.LightIterator.defaults.speed;
      } else {
        interval = Pot.Internal.LightIterator.speeds[speed];
      }
      return creator(interval);
    };
    construct = create();
    methods = {};
    for (name in Pot.Internal.LightIterator.speeds) {
      methods[name] = create(name);
    }
    return update(construct, methods);
  }
});

// Define the iterator functions to evaluate as synchronized.
Pot.update({
  /**
   * @lends Pot
   */
  /**
   * Iterates as "for each" loop.
   *
   *
   * @desc
   * <pre>
   * Unlike Deferred, speed options affect to cutback count in loop.
   * Options append to after the forEach and execute it.
   *
   *  e.g.   Pot.forEach.slow(obj, function() {...})
   *
   * The available methods are below.
   * ------------------------------------
   *   method name   |  speed
   * ------------------------------------
   *      limp       :  slowest
   *      doze       :  slower
   *      slow       :  slow
   *      normal     :  normal (default)
   *      fast       :  fast
   *      rapid      :  faster
   *      ninja      :  fastest
   * ------------------------------------
   * </pre>
   *
   *
   * @example
   *   var a = 0;
   *   Pot.forEach([1, 2, 3], function(value) {
   *     a += value;
   *   });
   *   debug(a);
   *   // @results 6
   *
   *
   * @example
   *   var a = '';
   *   Pot.forEach({a:'foo', b:'bar'}, function(value, key) {
   *     a += key + '=' + value + ',';
   *   });
   *   debug(a);
   *   // @results 'a=foo,b=bar,'
   *
   *
   * @param  {Array|Object}  object    A target object.
   * @param  {Function}      callback  An iterable function.
   *                                     function(value, key, object)
   *                                       this == `context`.
   *                                   Throw Pot.StopIteration
   *                                     if you want to stop the loop.
   * @param  {*}            (context)  Optionally, context object. (i.e. this)
   * @result {Object}                  Return the object.
   * @class
   * @function
   * @static
   * @name Pot.forEach
   * @property {Function} limp   Iterates "for each" loop with slowest speed.
   * @property {Function} doze   Iterates "for each" loop with slower speed.
   * @property {Function} slow   Iterates "for each" loop with slow speed.
   * @property {Function} normal Iterates "for each" loop with default speed.
   * @property {Function} fast   Iterates "for each" loop with fast speed.
   * @property {Function} rapid  Iterates "for each" loop with faster speed.
   * @property {Function} ninja  Iterates "for each" loop with fastest speed.
   */
  forEach : Pot.tmp.createLightIterateConstructor(function(interval) {
    return function(object, callback, context) {
      var opts = {};
      opts.type = Pot.Internal.LightIterator.types.forLoop |
                  Pot.Internal.LightIterator.types.forInLoop;
      opts.interval = interval;
      opts.async = false;
      opts.context = context;
      return (new Pot.Internal.LightIterator(object, callback, opts)).result;
    };
  }),
  /**
   * "repeat" loop iterates a specified number.
   *
   * The second argument of the callback function is
   *   passed the value to true only for the end of the loop.
   *
   * The first argument can pass as object
   *   that gives names "begin, end, step" any keys.
   *
   *
   * @example
   *   var a = [];
   *   Pot.repeat(10, function(i) {
   *     a.push(i);
   *   });
   *   debug(a);
   *   // @results [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
   *
   *
   * @example
   *   //
   *   // The second argument of the callback function is
   *   //  passed the value to true only for the end of the loop.
   *   //
   *   var s = '', a = 'abcdef'.split('');
   *   Pot.repeat(a.length, function(i, last) {
   *     s += a[i] + '=' + i + (last ? ';' : ',');
   *   });
   *   debug(s);
   *   // @results 'a=0,b=1,c=2,d=3,e=4,f=5;'
   *
   *
   * @example
   *   //
   *   // The first argument can pass as object
   *   //  that gives names "begin, end, step" any keys.
   *   //
   *   var a = [];
   *   Pot.repeat({begin: 0, end: 100, step: 10}, function(i) {
   *     a.push(i);
   *   });
   *   debug(a);
   *   // @results [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]
   *
   *
   * @param  {Number|Object}  max       The maximum number of times to loop,
   *                                      or object.
   * @param  {Function}       callback  An iterable function.
   *                                    Throw Pot.StopIteration
   *                                      if you want to stop the loop.
   * @param  {*}             (context)  Optionally, context object. (i.e. this)
   * @class
   * @function
   * @static
   * @name Pot.repeat
   * @property {Function} limp   Iterates "repeat" loop with slowest speed.
   * @property {Function} doze   Iterates "repeat" loop with slower speed.
   * @property {Function} slow   Iterates "repeat" loop with slow speed.
   * @property {Function} normal Iterates "repeat" loop with default speed.
   * @property {Function} fast   Iterates "repeat" loop with fast speed.
   * @property {Function} rapid  Iterates "repeat" loop with faster speed.
   * @property {Function} ninja  Iterates "repeat" loop with fastest speed.
   */
  repeat : Pot.tmp.createLightIterateConstructor(function(interval) {
    return function(max, callback, context) {
      var opts = {};
      opts.type = Pot.Internal.LightIterator.types.repeat;
      opts.interval = interval;
      opts.async = false;
      opts.context = context;
      return (new Pot.Internal.LightIterator(max, callback, opts)).result;
    };
  }),
  /**
   * Iterates indefinitely until "Pot.StopIteration" is thrown.
   *
   *
   * @example
   *   var s = '', a = 'abc*';
   *   Pot.forEver(function(i) {
   *     s += i + ':' + a;
   *     if (s.length > 50) {
   *       throw Pot.StopIteration;
   *     }
   *   });
   *   debug(s);
   *   // @results
   *   // '0:abc*1:abc*2:abc*3:abc*4:abc*5:abc*6:abc*7:abc*8:abc*'
   *
   *
   * @param  {Function}  callback   An iterable function.
   *                                Throw Pot.StopIteration
   *                                  if you want to stop the loop.
   * @param  {*}         (context)  Optionally, context object. (i.e. this)
   * @class
   * @function
   * @static
   * @name Pot.forEver
   * @property {Function} limp   Iterates "forEver" loop with slowest speed.
   * @property {Function} doze   Iterates "forEver" loop with slower speed.
   * @property {Function} slow   Iterates "forEver" loop with slow speed.
   * @property {Function} normal Iterates "forEver" loop with default speed.
   * @property {Function} fast   Iterates "forEver" loop with fast speed.
   * @property {Function} rapid  Iterates "forEver" loop with faster speed.
   * @property {Function} ninja  Iterates "forEver" loop with fastest speed.
   */
  forEver : Pot.tmp.createLightIterateConstructor(function(interval) {
    return function(callback, context) {
      var opts = {};
      opts.type = Pot.Internal.LightIterator.types.forEver;
      opts.interval = interval;
      opts.async = false;
      opts.context = context;
      return (new Pot.Internal.LightIterator(callback, null, opts)).result;
    };
  }),
  /**
   * Iterate an iterable object. (using Pot.Iter)
   *
   * @param  {*}         object     An iterable object.
   * @param  {Function}  callback   An iterable function.
   *                                  function(value, key, object)
   *                                    this == `context`.
   *                                Throw Pot.StopIteration
   *                                  if you want to stop the loop.
   * @param  {Object}    (context)  Optionally, context object. (i.e. this)
   * @return {*}                    Result of iteration.
   * @class
   * @function
   * @static
   * @name Pot.iterate
   * @property {Function} limp   Iterates "iterate" loop with slowest speed.
   * @property {Function} doze   Iterates "iterate" loop with slower speed.
   * @property {Function} slow   Iterates "iterate" loop with slow speed.
   * @property {Function} normal Iterates "iterate" loop with default speed.
   * @property {Function} fast   Iterates "iterate" loop with fast speed.
   * @property {Function} rapid  Iterates "iterate" loop with faster speed.
   * @property {Function} ninja  Iterates "iterate" loop with fastest speed.
   */
  iterate : Pot.tmp.createLightIterateConstructor(function(interval) {
    return function(object, callback, context) {
      var opts = {};
      opts.type = Pot.Internal.LightIterator.types.iterate;
      opts.interval = interval;
      opts.async = false;
      opts.context = context;
      return (new Pot.Internal.LightIterator(object, callback, opts)).result;
    };
  })
});

// Define iterators for Deferred (Asynchronous)
update(Pot.Deferred, {
  /**
   * Iterates as "for each" loop. (Asynchronous)
   *
   * @desc
   * <pre>
   * Unlike Deferred, speed options affect to cutback count in loop.
   * Options append to after the forEach and execute it.
   *
   *  e.g.   Pot.Deferred.forEach.fast(obj, function() {...})
   *
   * The available methods are below.
   * ------------------------------------
   *   method name   |  speed
   * ------------------------------------
   *      limp       :  slowest
   *      doze       :  slower
   *      slow       :  slow
   *      normal     :  normal (default)
   *      fast       :  fast
   *      rapid      :  faster
   *      ninja      :  fastest
   * ------------------------------------
   * </pre>
   *
   * @param  {Array|Object}  object    A target object.
   * @param  {Function}      callback  An iterable function.
   *                                     function(value, key, object)
   *                                       this == `context`.
   *                                   Throw Pot.StopIteration
   *                                     if you want to stop the loop.
   * @param  {*}            (context)  Optionally, context object. (i.e. this)
   * @result {Deferred}                Return the Deferred.
   * @class
   * @function
   * @public
   * @type Function
   * @name Pot.Deferred.forEach
   * @property {Function} limp   Iterates "for each" loop with slowest speed.
   * @property {Function} doze   Iterates "for each" loop with slower speed.
   * @property {Function} slow   Iterates "for each" loop with slow speed.
   * @property {Function} normal Iterates "for each" loop with default speed.
   * @property {Function} fast   Iterates "for each" loop with fast speed.
   * @property {Function} rapid  Iterates "for each" loop with faster speed.
   * @property {Function} ninja  Iterates "for each" loop with fastest speed.
   */
  forEach : Pot.tmp.createLightIterateConstructor(function(interval) {
    return function(object, callback, context) {
      var opts = {};
      opts.type = Pot.Internal.LightIterator.types.forLoop |
                  Pot.Internal.LightIterator.types.forInLoop;
      opts.interval = interval;
      opts.async = true;
      opts.context = context;
      return (new Pot.Internal.LightIterator(object, callback, opts)).deferred;
    };
  }),
  /**
   * "repeat" loop iterates a specified number. (Asynchronous)
   *
   * @param  {Number|Object}  max       The maximum number of times to loop,
   *                                      or object.
   * @param  {Function}       callback  An iterable function.
   *                                    Throw Pot.StopIteration
   *                                      if you want to stop the loop.
   * @param  {*}             (context)  Optionally, context object. (i.e. this)
   * @return {Deferred}                 Return the Deferred.
   * @class
   * @function
   * @public
   * @type Function
   * @name Pot.Deferred.repeat
   * @property {Function} limp   Iterates "repeat" loop with slowest speed.
   * @property {Function} doze   Iterates "repeat" loop with slower speed.
   * @property {Function} slow   Iterates "repeat" loop with slow speed.
   * @property {Function} normal Iterates "repeat" loop with default speed.
   * @property {Function} fast   Iterates "repeat" loop with fast speed.
   * @property {Function} rapid  Iterates "repeat" loop with faster speed.
   * @property {Function} ninja  Iterates "repeat" loop with fastest speed.
   */
  repeat : Pot.tmp.createLightIterateConstructor(function(interval) {
    return function(max, callback, context) {
      var opts = {};
      opts.type = Pot.Internal.LightIterator.types.repeat;
      opts.interval = interval;
      opts.async = true;
      opts.context = context;
      return (new Pot.Internal.LightIterator(max, callback, opts)).deferred;
    };
  }),
  /**
   * Iterates indefinitely until "Pot.StopIteration" is thrown. (Asynchronous)
   *
   * @param  {Function}  callback   An iterable function.
   *                                Throw Pot.StopIteration
   *                                  if you want to stop the loop.
   * @param  {*}         (context)  Optionally, context object. (i.e. this)
   * @return {Deferred}             Return the Deferred.
   * @class
   * @function
   * @public
   * @type Function
   * @name Pot.Deferred.forEver
   * @property {Function} limp   Iterates "forEver" loop with slowest speed.
   * @property {Function} doze   Iterates "forEver" loop with slower speed.
   * @property {Function} slow   Iterates "forEver" loop with slow speed.
   * @property {Function} normal Iterates "forEver" loop with default speed.
   * @property {Function} fast   Iterates "forEver" loop with fast speed.
   * @property {Function} rapid  Iterates "forEver" loop with faster speed.
   * @property {Function} ninja  Iterates "forEver" loop with fastest speed.
   */
  forEver : Pot.tmp.createLightIterateConstructor(function(interval) {
    return function(callback, context) {
      var opts = {};
      opts.type = Pot.Internal.LightIterator.types.forEver;
      opts.interval = interval;
      opts.async = true;
      opts.context = context;
      return (new Pot.Internal.LightIterator(callback, null, opts)).deferred;
    };
  }),
  /**
   * Iterate an iterable object. (using Pot.Iter)
   *
   * @param  {*}         object     An iterable object.
   * @param  {Function}  callback   An iterable function.
   *                                  function(value, key, object)
   *                                    this == `context`.
   *                                Throw Pot.StopIteration
   *                                  if you want to stop the loop.
   * @param  {Object}    (context)  Optionally, context object. (i.e. this)
   * @return {Deferred}             Return the Deferred.
   * @class
   * @function
   * @public
   * @type Function
   * @name Pot.Deferred.iterate
   * @property {Function} limp   Iterates "iterate" loop with slowest speed.
   * @property {Function} doze   Iterates "iterate" loop with slower speed.
   * @property {Function} slow   Iterates "iterate" loop with slow speed.
   * @property {Function} normal Iterates "iterate" loop with default speed.
   * @property {Function} fast   Iterates "iterate" loop with fast speed.
   * @property {Function} rapid  Iterates "iterate" loop with faster speed.
   * @property {Function} ninja  Iterates "iterate" loop with fastest speed.
   */
  iterate : Pot.tmp.createLightIterateConstructor(function(interval) {
    return function(object, callback, context) {
      var opts = {};
      opts.type = Pot.Internal.LightIterator.types.iterate;
      opts.interval = interval;
      opts.async = true;
      opts.context = context;
      return (new Pot.Internal.LightIterator(object, callback, opts)).deferred;
    };
  })
});

delete Pot.tmp.createLightIterateConstructor;
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Definition of Iter.
Pot.update({
  /**
   * @lends Pot
   */
  /**
   * Iter.
   *
   * A Simple iterator.
   * Constructor.
   *
   * @param  {*}          Options.
   * @return {Pot.Iter}   Returns an instance of Pot.Iter
   *
   * @name  Pot.Iter
   * @class
   * @constructor
   * @public
   */
  Iter : function() {
    return Pot.isIter(this) ? this.init(arguments) :
            new Pot.Iter.fn.init(arguments);
  }
});

// Definition of the prototype
Pot.Iter.fn = Pot.Iter.prototype = update(Pot.Iter.prototype, {
  /**
   * @lends Pot.Iter.prototype
   */
  /**
   * @ignore
   */
  constructor : Pot.Iter,
  /**
   * @private
   * @ignore
   */
  id : Pot.Internal.getMagicNumber(),
  /**
   * A unique strings.
   *
   * @type String
   * @private
   * @const
   */
  serial : null,
  /**
   * @private
   * @ignore
   * @const
   */
  NAME : 'Iter',
  /**
   * toString.
   *
   * @return  Return formatted string of object.
   * @type  Function
   * @function
   * @const
   * @static
   * @public
   */
  toString : Pot.toString,
  /**
   * isIter.
   *
   * @type Function
   * @function
   * @const
   * @static
   * @public
   */
  isIter : Pot.isIter,
  /**
   * Initialize properties.
   *
   * @private
   * @ignore
   */
  init : function(args) {
    if (!this.serial) {
      this.serial = buildSerial(this);
    }
    return this;
  },
  /**
   * Abstract function.
   *
   * Note: Firebug 1.7.x never shows the name of "next" method.
   *
   * @abstract
   * @type Function
   * @function
   * @public
   */
  next : function() {
    throw Pot.StopIteration;
  }
  /**
   * The property that implemented since JavaScript 1.7
   *   as the extended ECMAScript-3rd edition.
   *
   * @return  {Object}       Return the iterator object
   */
  //XXX: __iterator__ unimplemented for Object.prototype.__iterator__.
  //__iterator__ : function() {
  //  return this;
  //}
});

Pot.Iter.prototype.init.prototype = Pot.Iter.prototype;

// Define Iter object properties.
update(Pot.Iter, {
  /**
   * @lends Pot.Iter
   */
  /**
   * StopIteration.
   *
   * @type Object
   * @static
   * @const
   * @public
   */
  StopIteration : Pot.StopIteration,
  /**
   * Assign to an iterator from the argument object value.
   *
   * @param  {*}         x   An iterable object.
   * @return {Pot.Iter}      An iterator object instance.
   * @type Function
   * @function
   * @static
   * @public
   */
  toIter : function(x) {
    var iter, o, p, v, arrayLike, objectLike;
    if (Pot.isIter(x)) {
      return x;
    }
    arrayLike  = x && Pot.isArrayLike(x);
    objectLike = x && !arrayLike && Pot.isObject(x);
    if (objectLike) {
      o = [];
      for (p in x) {
        try {
          v = x[p];
        } catch (e) {
          continue;
        }
        o[o.length] = [v, p];
      }
    } else {
      o = arrayize(x);
    }
    iter = new Pot.Iter();
    /**@ignore*/
    iter.next = (function() {
      var i = 0;
      if (objectLike) {
        return function() {
          var key, val, pair;
          while (true) {
            if (i >= o.length) {
              throw Pot.StopIteration;
            }
            if (!(i in o)) {
              i++;
              continue;
            }
            try {
              key = o[i][1];
              val = o[i][0];
            } catch (e) {
              i++;
              continue;
            }
            pair = [val, key];
            i++;
            return pair;
          }
        };
      } else {
        return function() {
          var value, result;
          while (true) {
            if (i >= o.length) {
              throw Pot.StopIteration;
            }
            if (!(i in o)) {
              i++;
              continue;
            }
            try {
              value = o[i];
            } catch (e) {
              i++;
              continue;
            }
            result = [value, i];
            i++;
            return result;
          }
        };
      }
    })();
    return iter;
  },
  /**
   * @private
   * @ignore
   */
  forEach : function(/*object, callback[, context]*/) {
    return Pot.iterate.apply(null, arguments);
  },
  /**
   * Creates a new object with the results of calling a
   *   provided function on every element in object.
   *
   * This method like Array.prototype.map
   *
   *
   * @example
   *   function fuzzyPlural(single) {
   *     return single.replace(/o/g, 'e');
   *   }
   *   var words = ['foot', 'goose', 'moose'];
   *   debug(Pot.Iter.map(words, fuzzyPlural));
   *   // @results ['feet', 'geese', 'meese']
   *
   *
   * @example
   *   var object = {foo: 'foo1', bar: 'bar2', baz: 'baz3'};
   *   var result = Pot.Iter.map(object, function(value, key) {
   *     return value + '00';
   *   });
   *   debug(result);
   *   // @results {foo: 'foo100', bar: 'bar200', baz: 'baz300'}
   *
   *
   * @param  {Array|Object|*} object    A target object.
   * @param  {Function}       callback  A callback function.
   * @param  {*}             (context)  (Optional) Object to use
   *                                      as `this` when executing callback.
   * @return {*}                        Return the result of each callbacks.
   * @type Function
   * @function
   * @static
   * @public
   */
  map : function(object, callback, context) {
    var result, arrayLike, objectLike, iterateDefer, it, iterable;
    iterateDefer = this && this.iterateSpeed;
    arrayLike  = object && Pot.isArrayLike(object);
    objectLike = object && !arrayLike && Pot.isObject(object);
    if (arrayLike) {
      result = [];
    } else if (objectLike) {
      result = {};
    } else {
      result = null;
    }
    iterable = iterateDefer || this && this.iterateSpeedSync || Pot.iterate;
    /**@ignore*/
    it = function() {
      return iterable(object, function(val, key, obj) {
        var res = callback.call(context, val, key, obj);
        if (arrayLike) {
          result[result.length] = res;
        } else if (objectLike) {
          result[key] = res;
        } else {
          result = res;
        }
      }, context);
    };
    if (iterateDefer) {
      return it().then(function() {
        return result;
      });
    } else {
      it();
      return result;
    }
  },
  /**
   * Creates a new object with all elements that
   *  pass the test implemented by the provided function.
   *
   * This method like Array.prototype.filter
   *
   *
   * @example
   *   function isBigEnough(value, index, array) {
   *     return (value >= 10);
   *   }
   *   var filtered = Pot.Iter.filter([12, 5, 8, 130, 44], isBigEnough);
   *   debug(filtered);
   *   // @results [12, 130, 44]
   *
   *
   * @example
   *   function isBigEnough(value, key, object) {
   *     return (value >= 10);
   *   }
   *   var object = {a: 1, b: 20, c: 7, d: 5, e: 27, f: 99};
   *   var result = Pot.Iter.filter(object, isBigEnough);
   *   debug(result);
   *   // @results {b: 20, e: 27, f: 99}
   *
   *
   * @param  {Array|Object|*} object    A target object.
   * @param  {Function}       callback  A callback function.
   * @param  {*}             (context)  (Optional) Object to use
   *                                      as `this` when executing callback.
   * @return {*}                        Return the result of each callbacks.
   * @type Function
   * @function
   * @static
   * @public
   */
  filter : function(object, callback, context) {
    var result, arrayLike, objectLike, iterateDefer, it, iterable;
    iterateDefer = this && this.iterateSpeed;
    arrayLike  = object && Pot.isArrayLike(object);
    objectLike = object && !arrayLike && Pot.isObject(object);
    if (arrayLike) {
      result = [];
    } else if (objectLike) {
      result = {};
    } else {
      result = null;
    }
    iterable = iterateDefer || this && this.iterateSpeedSync || Pot.iterate;
    /**@ignore*/
    it = function() {
      return iterable(object, function(val, key, obj) {
        if (callback.call(context, val, key, obj)) {
          if (arrayLike) {
            result[result.length] = val;
          } else if (objectLike) {
            result[key] = val;
          } else {
            result = val;
          }
        }
      }, context);
    };
    if (iterateDefer) {
      return it().then(function() {
        return result;
      });
    } else {
      it();
      return result;
    }
  },
  /**
   * Apply a function against an accumulator and each value of
   *  the object (from left-to-right) as to reduce it to a single value.
   *
   * This method like Array.prototype.reduce
   *
   *
   * @example
   *   var array = [1, 2, 3, 4, 5];
   *   var total = Pot.Iter.reduce(array, function(a, b) { return a + b; });
   *   debug(total);
   *   // @results 15
   *
   * @example
   *   var object = {a: 1, b: 2, c: 3};
   *   var total = Pot.Iter.reduce(object, function(a, b) { return a + b; });
   *   debug(total);
   *   // @results 6
   *
   *
   * @param  {Array|Object|*} object    A target object.
   * @param  {Function}       callback  A callback function.
   * @param  {*}             (initial)  An initial value passed as `callback`
   *                                      argument that will be used on
   *                                      first iteration.
   * @param  {*}             (context)  (Optional) Object to use as
   *                                      the first argument to the
   *                                      first call of the `callback`.
   * @return {*}                        Return the result of each callbacks.
   * @type Function
   * @function
   * @static
   * @public
   */
  reduce : function(object, callback, initial, context) {
    var arrayLike, objectLike, value, skip, iterateDefer, it, iterable;
    iterateDefer = this && this.iterateSpeed;
    arrayLike  = object && Pot.isArrayLike(object);
    objectLike = object && !arrayLike && Pot.isObject(object);
    if (initial === undefined) {
      value = (function() {
        var first;
        if (arrayLike || objectLike) {
          each(object, function(v) {
            first = v;
            throw Pot.StopIteration;
          });
        }
        return first;
      })();
    } else {
      value = initial;
    }
    skip = true;
    iterable = iterateDefer || this && this.iterateSpeedSync || Pot.iterate;
    /**@ignore*/
    it = function() {
      return iterable(object, function(val, key, obj) {
        if (skip) {
          skip = false;
        } else {
          value = callback.call(context, value, val, key, obj);
        }
      }, context);
    };
    if (iterateDefer) {
      return it().then(function() {
        return value;
      });
    } else {
      it();
      return value;
    }
  },
  /**
   * Tests whether all elements in the object pass the
   *  test implemented by the provided function.
   *
   * This method like Array.prototype.every
   *
   * @example
   *   function isBigEnough(value, index, array) {
   *     return (value >= 10);
   *   }
   *   var passed = Pot.Iter.every([12, 5, 8, 130, 44], isBigEnough);
   *   debug(passed);
   *   // passed is false
   *   passed = Pot.Iter.every([12, 54, 18, 130, 44], isBigEnough);
   *   debug(passed);
   *   // passed is true
   *
   *
   * @param  {Array|Object|*} object    A target object.
   * @param  {Function}       callback  A callback function.
   * @param  {*}             (context)  (Optional) Object to use
   *                                      as `this` when executing callback.
   * @return {Boolean}                  Return the Boolean result by callback.
   * @type Function
   * @function
   * @static
   * @public
   */
  every : function(object, callback, context) {
    var result = true, iterateDefer, it, iterable;
    iterateDefer = this && this.iterateSpeed;
    iterable = iterateDefer || this && this.iterateSpeedSync || Pot.iterate;
    /**@ignore*/
    it = function() {
      return iterable(object, function(val, key, obj) {
        if (!callback.call(context, val, key, obj)) {
          result = false;
          throw Pot.StopIteration;
        }
      }, context);
    };
    if (iterateDefer) {
      return it().then(function() {
        return result;
      });
    } else {
      it();
      return result;
    }
  },
  /**
   * Tests whether some element in the object passes the
   *  test implemented by the provided function.
   *
   * This method like Array.prototype.some
   *
   *
   * @example
   *   function isBigEnough(value, index, array) {
   *     return (value >= 10);
   *   }
   *   var passed = Pot.Iter.some([2, 5, 8, 1, 4], isBigEnough);
   *   debug(passed);
   *   // passed is false
   *   passed = Pot.Iter.some([12, 5, 8, 1, 4], isBigEnough);
   *   debug(passed);
   *   // passed is true
   *
   *
   * @param  {Array|Object|*} object    A target object.
   * @param  {Function}       callback  A callback function.
   * @param  {*}             (context)  (Optional) Object to use
   *                                      as `this` when executing callback.
   * @return {Boolean}                  Return the Boolean result by callback.
   * @type Function
   * @function
   * @static
   * @public
   */
  some : function(object, callback, context) {
    var result = false, iterateDefer, it, iterable;
    iterateDefer = this && this.iterateSpeed;
    iterable = iterateDefer || this && this.iterateSpeedSync || Pot.iterate;
    /**@ignore*/
    it = function() {
      return iterable(object, function(val, key, obj) {
        if (callback.call(context, val, key, obj)) {
          result = true;
          throw Pot.StopIteration;
        }
      }, context);
    };
    if (iterateDefer) {
      return it().then(function() {
        return result;
      });
    } else {
      it();
      return result;
    }
  },
  /**
   * Create continuously array that
   *  has numbers between start number and end number.
   *
   * First argument can given an object that has "begin, end, step" any keys.
   *
   * This function can be a letter rather than just numbers.
   *
   * @example
   *   var numbers = Pot.Iter.range(1, 5);
   *   debug(numbers); // @results [1, 2, 3, 4, 5]
   *   var chars = Pot.Iter.range('a', 'f');
   *   debug(chars);   // @results ['a', 'b', 'c', 'd', 'e', 'f']
   *   var ranges = Pot.Iter.range({begin: 0, step: 10, end: 50});
   *   debug(ranges);  // @results [0, 10, 20, 30, 40, 50]
   *
   *
   * @param  {Number|Object}  end/begin  The end number or object.
   * @param  {Number}         (end)      (optinal) The end number.
   * @param  {Number}         (step)     (optinal) The step number.
   * @return {Array}                     Return an array result.
   * @type Function
   * @function
   * @static
   * @public
   */
  range : function(/*[begin,] end[, step]*/) {
    var args = arguments, arg, result;
    var begin, end, step, n, string, iter;
    result = [];
    begin = 0;
    end   = 0;
    step  = 1;
    switch (args.length) {
      case 0:
          return (void 0);
      case 1:
          arg = args[0];
          if (Pot.isObject(arg)) {
            if ('begin' in arg) {
              begin = arg.begin;
            } else if ('start' in arg) {
              begin = arg.start;
            }
            if ('end' in arg) {
              end = arg.end;
            } else if ('stop' in arg) {
              end = arg.stop;
            }
            if ('step' in arg) {
              step = arg.step;
            }
          } else {
            end = arg;
          }
          break;
      case 2:
          begin = args[0];
          end   = args[1];
          break;
      case 3:
      default:
          begin = args[0];
          end   = args[1];
          step  = args[2];
          break;
    }
    if (Pot.isString(begin) && begin.length === 1 &&
        Pot.isString(end)   && end.length   === 1) {
      begin  = begin.charCodeAt(0) || 0;
      end    = end.charCodeAt(0)   || 0;
      string = true;
    } else {
      begin  = begin - 0;
      end    = end   - 0;
      string = false;
    }
    step = step - 0;
    if (isNaN(begin) || isNaN(end) || isNaN(step) || step == 0) {
      return result;
    }
    if ((step > 0 && begin > end) ||
        (step < 0 && begin < end)) {
      n     = begin;
      begin = end;
      end   = n;
    }
    iter = new Pot.Iter();
    /**@ignore*/
    iter.next = function() {
      if ((step > 0 && begin > end) ||
          (step < 0 && begin < end)) {
        throw Pot.StopIteration;
      }
      result[result.length] = string ? String.fromCharCode(begin) : begin;
      begin += step;
    };
    Pot.iterate(iter);
    return result;
  },
  /**
   * Returns the first index at which a
   *  given element can be found in the object, or -1 if it is not present.
   *
   * This method like Array.prototype.indexOf
   *
   *
   * @example
   *   var array = [2, 5, 9];
   *   var index = Pot.Iter.indexOf(array, 2);
   *   // index is 0
   *   index = Pot.Iter.indexOf(array, 7);
   *   // index is -1
   *   var object = {a: 2, b: 5, c: 9};
   *   index = Pot.Iter.indexOf(object, 2);
   *   // index is 'a'
   *   index = Pot.Iter.indexOf(object, 7);
   *   // index is -1
   *
   *
   * @param  {Array|Object|*} object  A target object.
   * @param  {*}              subject A subject object.
   * @param  {*}              (from)  (Optional) The index at
   *                                    which to begin the search.
   *                                  Defaults to 0.
   * @return {Number}                 Return the index of result, or -1.
   * @type Function
   * @function
   * @static
   * @public
   */
  indexOf : function(object, subject, from) {
    var result = -1, arrayLike, objectLike;
    var i, len,  key, val, args, argn, passed;
    args = arguments;
    argn = args.length;
    arrayLike  = object && Pot.isArrayLike(object);
    objectLike = object && !arrayLike && Pot.isObject(object);
    if (arrayLike) {
      try {
        if (Pot.System.isBuiltinArrayIndexOf) {
          i = Array.prototype.indexOf.apply(object, arrayize(args, 1));
          if (Pot.isNumeric(i)) {
            result = i;
          } else {
            throw i;
          }
        } else {
          throw i;
        }
      } catch (err) {
        len = (object && object.length) || 0;
        i = Number(from) || 0;
        i = (i < 0) ? Math.ceil(i) : Math.floor(i);
        if (i < 0) {
          i += len;
        }
        for (; i < len; i++) {
          try {
            if (i in object) {
              val = object[i];
              if (val === subject) {
                result = i;
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }
      }
    } else if (objectLike) {
      passed = false;
      for (key in object) {
        try {
          if (!passed && argn >= 3 && from !== key) {
            continue;
          } else {
            passed = true;
          }
          val = object[key];
          if (val === subject) {
            result = key;
          }
        } catch (e) {
          continue;
        }
      }
    } else if (object != null) {
      try {
        val = (object.toString && object.toString()) || String(object);
        result = String.prototype.indexOf.apply(val, arrayize(args, 1));
      } catch (e) {
        result = -1;
      }
    } else {
      result = -1;
    }
    return result;
  },
  /**
   * Returns the last index at which a
   *  given element can be found in the object, or -1 if it is not present.
   *
   * This method like Array.prototype.lastIndexOf
   *
   *
   * @example
   *   debug('array');
   *   var index, array = [2, 5, 9, 2];
   *   index = Pot.Iter.lastIndexOf(array, 2);
   *   debug('index is 3 : result = ' + index);      // 3
   *   index = Pot.Iter.lastIndexOf(array, 7);
   *   debug('index is -1 : result = ' + index);     // -1
   *   index = Pot.Iter.lastIndexOf(array, 2, 3);
   *   debug('index is 3 : result = ' + index);      // 3
   *   index = Pot.Iter.lastIndexOf(array, 2, 2);
   *   debug('index is 0 : result = ' + index);      // 0
   *   index = Pot.Iter.lastIndexOf(array, 2, -2);
   *   debug('index is 0 : result = ' + index);      // 0
   *   index = Pot.Iter.lastIndexOf(array, 2, -1);
   *   debug('index is 3 : result = ' + index);      // 3
   *   debug('object');
   *   var object = {a: 2, b: 5, c: 9, d: 2};
   *   index = Pot.Iter.lastIndexOf(object, 2);
   *   debug('index is  d : result = ' + index);     // 'd'
   *   index = Pot.Iter.lastIndexOf(object, 7);
   *   debug('index is -1 : result = ' + index);     // -1
   *   index = Pot.Iter.lastIndexOf(object, 2, 'd'); // 'd'
   *   debug('index is  d : result = ' + index);
   *   index = Pot.Iter.lastIndexOf(object, 2, 'c'); // 'a'
   *   debug('index is  a : result = ' + index);
   *
   *
   * @param  {Array|Object|*} object  A target object.
   * @param  {*}              subject A subject object.
   * @param  {*}             (from)   (Optional) The index at which to
   *                                    start searching backwards.
   *                                  Defaults to the array's length.
   * @return {Number}                 Return the index of result, or -1.
   * @type Function
   * @function
   * @static
   * @public
   */
  lastIndexOf : function(object, subject, from) {
    var result = -1, arrayLike, objectLike;
    var i, len,  key, val, args, argn, passed, pairs;
    args = arguments;
    argn = args.length;
    arrayLike  = object && Pot.isArrayLike(object);
    objectLike = object && !arrayLike && Pot.isObject(object);
    if (arrayLike) {
      try {
        if (Pot.System.isBuiltinArrayLastIndexOf) {
          i = Array.prototype.lastIndexOf.apply(object, arrayize(args, 1));
          if (Pot.isNumeric(i)) {
            result = i;
          } else {
            throw i;
          }
        } else {
          throw i;
        }
      } catch (err) {
        len = (object && object.length) || 0;
        i = Number(from);
        if (isNaN(i)) {
          i = len - 1;
        } else {
          i = (i < 0) ? Math.ceil(i) : Math.floor(i);
          if (i < 0) {
            i += len;
          } else if (i >= len) {
            i = len - 1;
          }
        }
        for (; i > -1; i--) {
          try {
            if (i in object) {
              val = object[i];
              if (val === subject) {
                result = i;
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }
      }
    } else if (objectLike) {
      pairs = [];
      passed = false;
      for (key in object) {
        try {
          val = object[key];
        } catch (e) {
          continue;
        }
        pairs[pairs.length] = [key, val];
        if (val === subject) {
          result = key;
        }
        if (key === from) {
          passed = true;
          break;
        }
      }
      if (passed) {
        result = -1;
        len = pairs.length;
        while (--len >= 0) {
          key = pairs[len][0];
          val = pairs[len][1];
          if (val === subject) {
            result = key;
            break;
          }
        }
      }
    } else if (object != null) {
      try {
        val = (object.toString && object.toString()) || String(object);
        result = String.prototype.lastIndexOf.apply(val, arrayize(args, 1));
      } catch (e) {
        result = -1;
      }
    } else {
      result = -1;
    }
    return result;
  }
});
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Update the Pot.Deferred object for iterators.

// Extends the Pot.Deferred object for iterators with speed.
update(Pot.tmp, {
  /**
   * @private
   * @ignore
   */
  createIterators : function(iters) {
    each(iters, function(iter) {
      var o = {};
      /**@ignore*/
      o[iter.NAME] = function() {
        var me = {}, args = arrayize(arguments);
        me.iterateSpeed = (this && this.iterateSpeed) || Pot.Deferred.iterate;
        return Pot.Deferred.begin(function() {
          var d = new Pot.Deferred();
          iter.method.apply(me, args).then(function(res) {
            d.begin(res);
          }, function(err) {
            d.raise(err);
          });
          return d;
        });
      };
      update(Pot.Deferred, o);
      Pot.Deferred.extendSpeeds(Pot.Deferred, iter.NAME, function(opts) {
        var me = {}, args = arrayize(arguments, 1);
        me.iterateSpeed = Pot.Deferred.iterate[opts.speedName];
        return Pot.Deferred.begin(function() {
          var d = new Pot.Deferred();
          iter.method.apply(me, args).then(function(res) {
            d.begin(res);
          }, function(err) {
            d.raise(err);
          });
          return d;
        });
      }, Pot.Internal.LightIterator.speeds);
    });
  },
  /**
   * @private
   * @ignore
   */
  createProtoIterators : function(iters) {
    each(iters, function(iter) {
      var o = {}, sp = {};
      /**@ignore*/
      o[iter.NAME] = function() {
        var args = arrayize(arguments), options = update({}, this.options);
        return this.then(function(value) {
          var d = new Pot.Deferred();
          args = iter.args(value, args);
          iter.method.apply(iter.context, args).ensure(function(res) {
            extendDeferredOptions(d, options);
            if (Pot.isError(res)) {
              d.raise(res);
            } else {
              d.begin(res);
            }
          });
          return d;
        });
      };
      update(Pot.Deferred.fn, o);
      if (iter.speed) {
        if (iter.iterable) {
          /**@ignore*/
          sp.methods = function(speed) {
            return {
              iter    : iter.iterable[speed],
              context : iter.context
            };
          };
        } else {
          /**@ignore*/
          sp.methods = function(speed) {
            return {
              iter    : iter.method,
              context : {iterateSpeed : iter.context.iterateSpeed[speed]}
            };
          };
        }
        Pot.Deferred.extendSpeeds(Pot.Deferred.fn, iter.NAME, function(opts) {
          var that = this, iterable, options, args = arrayize(arguments, 1);
          iterable = sp.methods(opts.speedName);
          options  = update({}, this.options);
          return this.then(function(value) {
            var d = new Pot.Deferred();
            args = iter.args(value, args);
            iterable.iter.apply(iterable.context, args).ensure(function(res) {
              extendDeferredOptions(d, options);
              if (Pot.isError(res)) {
                d.raise(res);
              } else {
                d.begin(res);
              }
            });
            return d;
          });
        }, Pot.Internal.LightIterator.speeds);
      }
    });
  },
  /**
   * @private
   * @ignore
   */
  createSyncIterator : function(creator) {
    var methods, construct;
    /**@ignore*/
    var create = function(speed) {
      var key = speed;
      if (!key) {
        each(Pot.Internal.LightIterator.speeds, function(v, k) {
          if (v === Pot.Internal.LightIterator.defaults.speed) {
            key = k;
            throw Pot.StopIteration;
          }
        });
      }
      return creator(key);
    };
    construct = create();
    methods = {};
    each(Pot.Internal.LightIterator.speeds, function(v, k) {
      methods[k] = create(k);
    });
    return update(construct, methods);
  }
});

// Create iterators to Pot.Deferred.
Pot.tmp.createIterators([{
  /**
   * Creates a new object with the results of calling a
   *   provided function on every element in object.
   *
   * Iteration will use the results of the previous chain.
   *
   * This method like Array.prototype.map
   *
   *
   * @example
   *   var words = ['foot', 'goose', 'moose'];
   *   Pot.Deferred.map(words, function(word) {
   *     return word.replace(/o/g, 'e');
   *   }).then(function(result) {
   *     debug(result);
   *   });
   *   // @results result = ['feet', 'geese', 'meese']
   *
   *
   * @param  {Array|Object|*} object    A target object.
   * @param  {Function}       callback  A callback function.
   * @param  {*}             (context)  (Optional) Object to use
   *                                      as `this` when executing callback.
   * @return {*}                        Return the result of each callbacks.
   * @name   Pot.Deferred.map
   * @type   Function
   * @class
   * @function
   * @static
   * @public
   *
   * @property {Function} limp   Iterates "map" loop with slowest speed.
   * @property {Function} doze   Iterates "map" loop with slower speed.
   * @property {Function} slow   Iterates "map" loop with slow speed.
   * @property {Function} normal Iterates "map" loop with default speed.
   * @property {Function} fast   Iterates "map" loop with fast speed.
   * @property {Function} rapid  Iterates "map" loop with faster speed.
   * @property {Function} ninja  Iterates "map" loop with fastest speed.
   */
  NAME   : 'map',
  /**@ignore*/
  method : Pot.Iter.map
}, {
  /**
   * Creates a new object with all elements that
   *  pass the test implemented by the provided function.
   *
   * Iteration will use the results of the previous chain.
   *
   * This method like Array.prototype.filter
   *
   *
   * @example
   *   var numbers = [12, 5, 8, 130, 44];
   *   Pot.Deferred.filter(numbers, function(value, index, array) {
   *     return (value >= 10);
   *   }).then(function(result) {
   *     debug(result);
   *   });
   *   // @results result = [12, 130, 44]
   *
   *
   * @param  {Array|Object|*} object    A target object.
   * @param  {Function}       callback  A callback function.
   * @param  {*}             (context)  (Optional) Object to use
   *                                      as `this` when executing callback.
   * @return {*}                        Return the result of each callbacks.
   * @name   Pot.Deferred.filter
   * @type   Function
   * @class
   * @function
   * @static
   * @public
   *
   * @property {Function} limp   Iterates "filter" loop with slowest speed.
   * @property {Function} doze   Iterates "filter" loop with slower speed.
   * @property {Function} slow   Iterates "filter" loop with slow speed.
   * @property {Function} normal Iterates "filter" loop with default speed.
   * @property {Function} fast   Iterates "filter" loop with fast speed.
   * @property {Function} rapid  Iterates "filter" loop with faster speed.
   * @property {Function} ninja  Iterates "filter" loop with fastest speed.
   */
  NAME   : 'filter',
  /**@ignore*/
  method : Pot.Iter.filter
}, {
  /**
   * Apply a function against an accumulator and each value of
   *  the object (from left-to-right) as to reduce it to a single value.
   *
   * Iteration will use the results of the previous chain.
   *
   * This method like Array.prototype.reduce
   *
   *
   * @example
   *   var numbers = [1, 2, 3, 4, 5];
   *   Pot.Deferred.reduce(numbers, function(a, b) {
   *     return a + b;
   *   }).then(function(result) {
   *     debug(result);
   *   });
   *   // @results result = 15
   *
   *
   * @param  {Array|Object|*}  object     A target object.
   * @param  {Function}        callback   A callback function.
   * @param  {*}               initial    An initial value passed as
   *                                        `callback` argument that
   *                                        will be used on
   *                                        first iteration.
   * @param  {*}              (context)   (Optional) Object to use as
   *                                        the first argument to the
   *                                        first call of the `callback`.
   * @return {*}                          Return the result of each callbacks.
   * @name   Pot.Deferred.reduce
   * @type   Function
   * @class
   * @function
   * @static
   * @public
   *
   * @property {Function} limp   Iterates "reduce" loop with slowest speed.
   * @property {Function} doze   Iterates "reduce" loop with slower speed.
   * @property {Function} slow   Iterates "reduce" loop with slow speed.
   * @property {Function} normal Iterates "reduce" loop with default speed.
   * @property {Function} fast   Iterates "reduce" loop with fast speed.
   * @property {Function} rapid  Iterates "reduce" loop with faster speed.
   * @property {Function} ninja  Iterates "reduce" loop with fastest speed.
   */
  NAME   : 'reduce',
  /**@ignore*/
  method : Pot.Iter.reduce
}, {
  /**
   * Tests whether all elements in the object pass the
   *  test implemented by the provided function.
   *
   * Iteration will use the results of the previous chain.
   *
   * This method like Array.prototype.every
   *
   * @example
   *   var numbers = [12, 5, 8, 130, 44];
   *   Pot.Deferred.every(numbers, function(value, index, array) {
   *     return (value >= 10);
   *   }).then(function(result) {
   *     debug(result);
   *     // @results false
   *   });
   *
   * @example
   *   var numbers = [12, 54, 18, 130, 44];
   *   Pot.Deferred.every(numbers, function(value, index, array) {
   *     return (value >= 10);
   *   }).then(function(result) {
   *     debug(result);
   *     // @results true
   *   });
   *
   * @param  {Array|Object|*}  object      A target object.
   * @param  {Function}        callback    A callback function.
   * @param  {*}               (context)   (Optional) Object to use as
   *                                         `this` when executing callback.
   * @return {Boolean}                     Return the Boolean result
   *                                          by callback.
   * @name   Pot.Deferred.every
   * @type   Function
   * @class
   * @function
   * @static
   * @public
   *
   * @property {Function} limp   Iterates "every" loop with slowest speed.
   * @property {Function} doze   Iterates "every" loop with slower speed.
   * @property {Function} slow   Iterates "every" loop with slow speed.
   * @property {Function} normal Iterates "every" loop with default speed.
   * @property {Function} fast   Iterates "every" loop with fast speed.
   * @property {Function} rapid  Iterates "every" loop with faster speed.
   * @property {Function} ninja  Iterates "every" loop with fastest speed.
   */
  NAME   : 'every',
  /**@ignore*/
  method : Pot.Iter.every
}, {
  /**
   * Tests whether some element in the object passes the
   *  test implemented by the provided function.
   *
   * Iteration will use the results of the previous chain.
   *
   * This method like Array.prototype.some
   *
   *
   * @example
   *   var numbers = [2, 5, 8, 1, 4];
   *   Pot.Deferred.some(numbers, function(value, index, array) {
   *     return (value >= 10);
   *   }).then(function(result) {
   *     debug(result);
   *     // @results false
   *   });
   *
   * @example
   *   var numbers = [12, 5, 8, 1, 4];
   *   Pot.Deferred.some(numbers, function(value, index, array) {
   *     return (value >= 10);
   *   }).then(function(result) {
   *     debug(result);
   *     // @results true
   *   });
   *
   *
   * @param  {Array|Object|*}  object      A target object.
   * @param  {Function}        callback    A callback function.
   * @param  {*}               (context)   (Optional) Object to use as
   *                                         `this` when executing callback.
   * @return {Boolean}                     Return the Boolean result by
   *                                         callback.
   * @name   Pot.Deferred.some
   * @type   Function
   * @class
   * @function
   * @static
   * @public
   *
   * @property {Function} limp   Iterates "some" loop with slowest speed.
   * @property {Function} doze   Iterates "some" loop with slower speed.
   * @property {Function} slow   Iterates "some" loop with slow speed.
   * @property {Function} normal Iterates "some" loop with default speed.
   * @property {Function} fast   Iterates "some" loop with fast speed.
   * @property {Function} rapid  Iterates "some" loop with faster speed.
   * @property {Function} ninja  Iterates "some" loop with fastest speed.
   */
  NAME   : 'some',
  /**@ignore*/
  method : Pot.Iter.some
}]);

// Create iterators to Pot.Deferred.prototype.
Pot.tmp.createProtoIterators([{
  /**
   * Iterates as "for each" loop. (Asynchronous)
   *
   * Iteration will use the results of the previous chain.
   *
   * @desc
   * <pre>
   * Unlike Deferred, speed options affect to cutback count in loop.
   * Options append to after the forEach and execute it.
   *
   *  e.g. d.forEach.slow(function() {...}).then(function() {...})
   *
   * The available methods are below.
   * ------------------------------------
   *   method name   |  speed
   * ------------------------------------
   *      limp       :  slowest
   *      doze       :  slower
   *      slow       :  slowly
   *      normal     :  normal (default)
   *      fast       :  fast
   *      rapid      :  faster
   *      ninja      :  fastest
   * ------------------------------------
   * </pre>
   *
   *
   * @example
   *   var elems = document.getElementsByTagName('*');
   *   var defer = new Pot.Deferred();
   *   var alpha = 1;
   *   defer.forEach.slow(function(elem, i, elems) {
   *     alpha -= 0.02;
   *     if (alpha < 0.02) {
   *       alpha = 0.02;
   *     }
   *     elem.style.opacity = alpha;
   *   }).wait(5).forEach(function(elem, i, elems) {
   *     elem.style.opacity = 1;
   *   }).then(function() {
   *     debug('end');
   *   }).begin(elems);
   *
   *
   * @param  {Function}   callback   An iterable function.
   *                                   function(value, key, object)
   *                                     this == `context`.
   *                                 Throw Pot.StopIteration
   *                                   if you want to stop the loop.
   * @param  {*}          (context)  Optionally, context object. (i.e. this)
   * @result {Deferred}              Return the Deferred.
   *
   * @name  Pot.Deferred.prototype.forEach
   * @class
   * @public
   *
   * @property {Function} limp   Iterates "for each" loop with slowest speed.
   * @property {Function} doze   Iterates "for each" loop with slower speed.
   * @property {Function} slow   Iterates "for each" loop with slow speed.
   * @property {Function} normal Iterates "for each" loop with default speed.
   * @property {Function} fast   Iterates "for each" loop with fast speed.
   * @property {Function} rapid  Iterates "for each" loop with faster speed.
   * @property {Function} ninja  Iterates "for each" loop with fastest speed.
   */
  NAME : 'forEach',
  /**
   * @ignore
   */
  method : Pot.Deferred.forEach,
  /**
   * @ignore
   */
  context : null,
  /**
   * @ignore
   */
  speed : true,
  /**
   * @ignore
   */
  iterable : Pot.Deferred.forEach,
  /**
   * @ignore
   */
  args : function(arg, args) {
    return [arg].concat(args);
  }
}, {
  /**
   * "repeat" loop iterates a specified number. (Asynchronous)
   *
   * If you specify the first argument as a function
   *  then the results of the previous chain will be used.
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   var p = document.getElementsByTagName('p');
   *   d.repeat(p.length, function(i, last) {
   *     p[i].innerHTML += last ? 'end' : i;
   *   }).then(function() {
   *     debug('finish');
   *   }).begin();
   *
   *
   * @param  {Number|Object}  (max)     The maximum number of times to loop,
   *                                      or object.
   * @param  {Function}       callback  An iterable function.
   *                                    Throw Pot.StopIteration
   *                                      if you want to stop the loop.
   * @param  {*}             (context)  Optionally, context object. (i.e. this)
   * @return {Deferred}                 Return the Deferred.
   *
   * @name  Pot.Deferred.prototype.repeat
   * @class
   * @public
   * 
   * @property {Function} limp   Iterates "repeat" loop with slowest speed.
   * @property {Function} doze   Iterates "repeat" loop with slower speed.
   * @property {Function} slow   Iterates "repeat" loop with slow speed.
   * @property {Function} normal Iterates "repeat" loop with default speed.
   * @property {Function} fast   Iterates "repeat" loop with fast speed.
   * @property {Function} rapid  Iterates "repeat" loop with faster speed.
   * @property {Function} ninja  Iterates "repeat" loop with fastest speed.
   */
  NAME : 'repeat',
  /**
   * @ignore
   */
  method : Pot.Deferred.repeat,
  /**
   * @ignore
   */
  context : null,
  /**
   * @ignore
   */
  speed : true,
  /**
   * @ignore
   */
  iterable : Pot.Deferred.repeat,
  /**
   * @ignore
   */
  args : function(arg, args) {
    if (arg && Pot.isNumber(arg.length)) {
      return [arg.length].concat(args);
    }
    if (arg && Pot.isObject(arg) &&
        ('end'  in arg || 'begin' in arg || 'step' in arg ||
         'stop' in arg || 'start' in arg)) {
      return [arg].concat(args);
    }
    return args;
  }
}, {
  /**
   * Iterates indefinitely until "Pot.StopIteration" is thrown. (Asynchronous)
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   var s = '';
   *   d.forEver(function(i) {
   *     s += 'i=' + i + ',';
   *     if (s.length > 25) {
   *       throw Pot.StopIteration;
   *     }
   *   }).then(function() {
   *     debug(s);
   *   }).begin();
   *   // @results  s = 'i=0,i=1,i=2,i=3,i=4,i=5,i=6,'
   *
   *
   * @param  {Function}  callback   An iterable function.
   *                                Throw Pot.StopIteration
   *                                  if you want to stop the loop.
   * @param  {*}         (context)  Optionally, context object. (i.e. this)
   * @return {Deferred}             Return the Deferred.
   *
   * @name  Pot.Deferred.prototype.forEver
   * @class
   * @public
   *
   * @property {Function} limp   Iterates "forEver" loop with slowest speed.
   * @property {Function} doze   Iterates "forEver" loop with slower speed.
   * @property {Function} slow   Iterates "forEver" loop with slow speed.
   * @property {Function} normal Iterates "forEver" loop with default speed.
   * @property {Function} fast   Iterates "forEver" loop with fast speed.
   * @property {Function} rapid  Iterates "forEver" loop with faster speed.
   * @property {Function} ninja  Iterates "forEver" loop with fastest speed.
   */
  NAME : 'forEver',
  /**
   * @ignore
   */
  method : Pot.Deferred.forEver,
  /**
   * @ignore
   */
  context : null,
  /**
   * @ignore
   */
  speed : true,
  /**
   * @ignore
   */
  iterable : Pot.Deferred.forEver,
  /**
   * @ignore
   */
  args : function(arg, args) {
    return args;
  }
}, {
  /**
   * Iterate an iterable object that is previous chain result.
   *
   * Iteration will use the results of the previous chain.
   *
   * @param  {Function}  callback   An iterable function.
   *                                  function(value, key, object)
   *                                    this == `context`.
   *                                Throw Pot.StopIteration
   *                                  if you want to stop the loop.
   * @param  {Object}    (context)  Optionally, context object. (i.e. this)
   * @return {Deferred}             Return the Deferred.
   *
   * @name  Pot.Deferred.prototype.iterate
   * @class
   * @public
   *
   * @property {Function} limp   Iterates "iterate" loop with slowest speed.
   * @property {Function} doze   Iterates "iterate" loop with slower speed.
   * @property {Function} slow   Iterates "iterate" loop with slow speed.
   * @property {Function} normal Iterates "iterate" loop with default speed.
   * @property {Function} fast   Iterates "iterate" loop with fast speed.
   * @property {Function} rapid  Iterates "iterate" loop with faster speed.
   * @property {Function} ninja  Iterates "iterate" loop with fastest speed.
   */
  NAME : 'iterate',
  /**
   * @ignore
   */
  method : Pot.Deferred.iterate,
  /**
   * @ignore
   */
  context : null,
  /**
   * @ignore
   */
  speed : true,
  /**
   * @ignore
   */
  iterable : Pot.Deferred.iterate,
  /**
   * @ignore
   */
  args : function(arg, args) {
    return [arg].concat(args);
  }
}, {
  /**
   * Creates a new object with the results of calling a
   *   provided function on every element in chains result.
   *
   * Iteration will use the results of the previous chain.
   *
   * This method like Array.prototype.map
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   d.then(function() {
   *     return ['foot', 'goose', 'moose'];
   *   }).map(function(word) {
   *     return word.replace(/o/g, 'e');
   *   }).then(function(result) {
   *     debug(result);
   *   }).begin();
   *   // @results result = ['feet', 'geese', 'meese']
   *
   *
   * @param  {Function}       callback  A callback function.
   * @param  {*}             (context)  (Optional) Object to use
   *                                      as `this` when executing callback.
   * @return {*}                        Return the result of each callbacks.
   *
   * @name  Pot.Deferred.prototype.map
   * @class
   * @public
   *
   * @property {Function} limp   Iterates "map" loop with slowest speed.
   * @property {Function} doze   Iterates "map" loop with slower speed.
   * @property {Function} slow   Iterates "map" loop with slow speed.
   * @property {Function} normal Iterates "map" loop with default speed.
   * @property {Function} fast   Iterates "map" loop with fast speed.
   * @property {Function} rapid  Iterates "map" loop with faster speed.
   * @property {Function} ninja  Iterates "map" loop with fastest speed.
   */
  NAME : 'map',
  /**
   * @ignore
   */
  method : Pot.Iter.map,
  /**
   * @ignore
   */
  context : {iterateSpeed : Pot.Deferred.iterate},
  /**
   * @ignore
   */
  speed : true,
  /**
   * @ignore
   */
  iterable : null,
  /**
   * @ignore
   */
  args : function(arg, args) {
    return [arg].concat(args);
  }
}, {
  /**
   * Creates a new object with all elements that
   *  pass the test implemented by the provided function.
   *
   * Iteration will use the results of the previous chain.
   *
   * This method like Array.prototype.filter
   *
   *
   * @example
   *   var d = new Pot.Deferred();
   *   d.then(function() {
   *     return [12, 5, 8, 130, 44];
   *   }).filter(function(value, index, array) {
   *     return (value >= 10);
   *   }).then(function(result) {
   *     debug(result);
   *   }).begin();
   *   // @results [12, 130, 44]
   *
   *
   * @param  {Function}       callback  A callback function.
   * @param  {*}             (context)  (Optional) Object to use
   *                                      as `this` when executing callback.
   * @return {*}                        Return the result of each callbacks.
   *
   * @name  Pot.Deferred.prototype.filter
   * @class
   * @public
   *
   * @property {Function} limp   Iterates "filter" loop with slowest speed.
   * @property {Function} doze   Iterates "filter" loop with slower speed.
   * @property {Function} slow   Iterates "filter" loop with slow speed.
   * @property {Function} normal Iterates "filter" loop with default speed.
   * @property {Function} fast   Iterates "filter" loop with fast speed.
   * @property {Function} rapid  Iterates "filter" loop with faster speed.
   * @property {Function} ninja  Iterates "filter" loop with fastest speed.
   */
  NAME : 'filter',
  /**
   * @ignore
   */
  method : Pot.Iter.filter,
  /**
   * @ignore
   */
  context : {iterateSpeed : Pot.Deferred.iterate},
  /**
   * @ignore
   */
  speed : true,
  /**
   * @ignore
   */
  iterable : null,
  /**
   * @ignore
   */
  args : function(arg, args) {
    return [arg].concat(args);
  }
}, {
  /**
   * Apply a function against an accumulator and each value of
   *  the object (from left-to-right) as to reduce it to a single value.
   *
   * Iteration will use the results of the previous chain.
   *
   * This method like Array.prototype.reduce
   *
   *
   * @example
   *   Pot.Deferred.begin(function() {
   *     return [1, 2, 3, 4, 5];
   *   }).reduce(function(a, b) {
   *     return a + b;
   *   }).then(function(result) {
   *     debug(result);
   *   });
   *   // @results 15
   *
   *
   * @param  {Function}  callback    A callback function.
   * @param  {*}         initial     An initial value passed as `callback`
   *                                   argument that will be used on
   *                                   first iteration.
   * @param  {*}         (context)   (Optional) Object to use as
   *                                   the first argument to the
   *                                   first call of the `callback`.
   * @return {*}                     Return the result of each callbacks.
   *
   * @name  Pot.Deferred.prototype.reduce
   * @class
   * @public
   *
   * @property {Function} limp   Iterates "reduce" loop with slowest speed.
   * @property {Function} doze   Iterates "reduce" loop with slower speed.
   * @property {Function} slow   Iterates "reduce" loop with slow speed.
   * @property {Function} normal Iterates "reduce" loop with default speed.
   * @property {Function} fast   Iterates "reduce" loop with fast speed.
   * @property {Function} rapid  Iterates "reduce" loop with faster speed.
   * @property {Function} ninja  Iterates "reduce" loop with fastest speed.
   */
  NAME : 'reduce',
  /**
   * @ignore
   */
  method : Pot.Iter.reduce,
  /**
   * @ignore
   */
  context : {iterateSpeed : Pot.Deferred.iterate},
  /**
   * @ignore
   */
  speed : true,
  /**
   * @ignore
   */
  iterable : null,
  /**
   * @ignore
   */
  args : function(arg, args) {
    return [arg].concat(args);
  }
}, {
  /**
   * Tests whether all elements in the object pass the
   *  test implemented by the provided function.
   *
   * Iteration will use the results of the previous chain.
   *
   * This method like Array.prototype.every
   *
   * @example
   *   var d = new Pot.Deferred();
   *   d.then(function() {
   *     return [12, 5, 8, 130, 44];
   *   }).every(function(value, index, array) {
   *     return (value >= 10);
   *   }).then(function(result) {
   *     debug(result);
   *     // @results false
   *   }).then(function() {
   *     return [12, 54, 18, 130, 44];
   *   }).every(function(value, index, array) {
   *     return (value >= 10);
   *   }).then(function(result) {
   *     debug(result);
   *     // @results true
   *   });
   *   d.begin();
   *
   *
   * @param  {Function}  callback    A callback function.
   * @param  {*}         (context)   (Optional) Object to use
   *                                   as `this` when executing callback.
   * @return {Boolean}               Return the Boolean result by callback.
   *
   * @name  Pot.Deferred.prototype.every
   * @class
   * @public
   *
   * @property {Function} limp   Iterates "every" loop with slowest speed.
   * @property {Function} doze   Iterates "every" loop with slower speed.
   * @property {Function} slow   Iterates "every" loop with slow speed.
   * @property {Function} normal Iterates "every" loop with default speed.
   * @property {Function} fast   Iterates "every" loop with fast speed.
   * @property {Function} rapid  Iterates "every" loop with faster speed.
   * @property {Function} ninja  Iterates "every" loop with fastest speed.
   */
  NAME : 'every',
  /**
   * @ignore
   */
  method : Pot.Iter.every,
  /**
   * @ignore
   */
  context : {iterateSpeed : Pot.Deferred.iterate},
  /**
   * @ignore
   */
  speed : true,
  /**
   * @ignore
   */
  iterable : null,
  /**
   * @ignore
   */
  args : function(arg, args) {
    return [arg].concat(args);
  }
}, {
  /**
   * Tests whether some element in the object passes the
   *  test implemented by the provided function.
   *
   * Iteration will use the results of the previous chain.
   *
   * This method like Array.prototype.some
   *
   *
   * @example
   *   Pot.Deferred.begin(function() {
   *     return [2, 5, 8, 1, 4];
   *   }).some(function(value, index, array) {
   *     return (value >= 10);
   *   }).then(function(result) {
   *     debug(result);
   *     // @results false
   *   }).then(function() {
   *     return [12, 5, 8, 1, 4];
   *   }).some(function(value, index, array) {
   *     return (value >= 10);
   *   }).then(function(result) {
   *     debug(result);
   *     // @results true;
   *   });
   *
   *
   * @param  {Function}  callback    A callback function.
   * @param  {*}         (context)   (Optional) Object to use
   *                                   as `this` when executing callback.
   * @return {Boolean}               Return the Boolean result by callback.
   *
   * @name  Pot.Deferred.prototype.some
   * @class
   * @public
   *
   * @property {Function} limp   Iterates "some" loop with slowest speed.
   * @property {Function} doze   Iterates "some" loop with slower speed.
   * @property {Function} slow   Iterates "some" loop with slow speed.
   * @property {Function} normal Iterates "some" loop with default speed.
   * @property {Function} fast   Iterates "some" loop with fast speed.
   * @property {Function} rapid  Iterates "some" loop with faster speed.
   * @property {Function} ninja  Iterates "some" loop with fastest speed.
   */
  NAME : 'some',
  /**
   * @ignore
   */
  method : Pot.Iter.some,
  /**
   * @ignore
   */
  context : {iterateSpeed : Pot.Deferred.iterate},
  /**
   * @ignore
   */
  speed : true,
  /**
   * @ignore
   */
  iterable : null,
  /**
   * @ignore
   */
  args : function(arg, args) {
    return [arg].concat(args);
  }
}]);

// Update iterator methods for Pot
Pot.update({
  /**
   * @lends Pot
   */
  /**
   * Creates a new object with the results of calling a
   *   provided function on every element in object.
   *
   * This method like Array.prototype.map
   *
   *
   * @example
   *   function fuzzyPlural(single) {
   *     return single.replace(/o/g, 'e');
   *   }
   *   var words = ['foot', 'goose', 'moose'];
   *   debug(Pot.map(words, fuzzyPlural));
   *   // @results ['feet', 'geese', 'meese']
   *
   * @example
   *   var object = {foo: 'foo1', bar: 'bar2', baz: 'baz3'};
   *   var result = Pot.map(object, function(value, key) {
   *     return value + '00';
   *   });
   *   debug(result);
   *   // @results {foo: 'foo100', bar: 'bar200', baz: 'baz300'}
   *
   *
   * @param  {Array|Object|*} object    A target object.
   * @param  {Function}       callback  A callback function.
   * @param  {*}             (context)  (Optional) Object to use
   *                                      as `this` when executing callback.
   * @return {*}                        Return the result of each callbacks.
   * @name  Pot.map
   * @class
   * @function
   * @static
   * @public
   */
  map : Pot.tmp.createSyncIterator(function(speedKey) {
    return function() {
      var context = {iterateSpeedSync : Pot.iterate[speedKey]};
      return Pot.Iter.map.apply(context, arguments);
    };
  }),
  /**
   * Creates a new object with all elements that
   *  pass the test implemented by the provided function.
   *
   * This method like Array.prototype.filter
   *
   *
   * @example
   *   function isBigEnough(value, index, array) {
   *     return (value >= 10);
   *   }
   *   var filtered = Pot.filter([12, 5, 8, 130, 44], isBigEnough);
   *   debug(filtered);
   *   // @results [12, 130, 44]
   *
   *
   * @example
   *   function isBigEnough(value, key, object) {
   *     return (value >= 10);
   *   }
   *   var object = {a: 1, b: 20, c: 7, d: 5, e: 27, f: 99};
   *   var result = Pot.filter(object, isBigEnough);
   *   debug(result);
   *   // @results {b: 20, e: 27, f: 99}
   *
   *
   * @param  {Array|Object|*} object    A target object.
   * @param  {Function}       callback  A callback function.
   * @param  {*}             (context)  (Optional) Object to use
   *                                      as `this` when executing callback.
   * @return {*}                        Return the result of each callbacks.
   * @name  Pot.filter
   * @class
   * @function
   * @static
   * @public
   */
  filter : Pot.tmp.createSyncIterator(function(speedKey) {
    return function() {
      var context = {iterateSpeedSync : Pot.iterate[speedKey]};
      return Pot.Iter.filter.apply(context, arguments);
    };
  }),
  /**
   * Apply a function against an accumulator and each value of
   *  the object (from left-to-right) as to reduce it to a single value.
   *
   * This method like Array.prototype.reduce
   *
   *
   * @example
   *   var array = [1, 2, 3, 4, 5];
   *   var total = Pot.reduce(array, function(a, b) { return a + b; });
   *   debug(total);
   *   // @results 15
   *
   * @example
   *   var object = {a: 1, b: 2, c: 3};
   *   var total = Pot.reduce(object, function(a, b) { return a + b; });
   *   debug(total);
   *   // @results 6
   *
   *
   * @param  {Array|Object|*} object    A target object.
   * @param  {Function}       callback  A callback function.
   * @param  {*}              initial   An initial value passed as `callback`
   *                                      argument that will be used on
   *                                      first iteration.
   * @param  {*}             (context)  (Optional) Object to use as
   *                                      the first argument to the
   *                                      first call of the `callback`.
   * @return {*}                        Return the result of each callbacks.
   * @name  Pot.reduce
   * @class
   * @function
   * @static
   * @public
   */
  reduce : Pot.tmp.createSyncIterator(function(speedKey) {
    return function() {
      var context = {iterateSpeedSync : Pot.iterate[speedKey]};
      return Pot.Iter.reduce.apply(context, arguments);
    };
  }),
  /**
   * Tests whether all elements in the object pass the
   *  test implemented by the provided function.
   *
   * This method like Array.prototype.every
   *
   * @example
   *   function isBigEnough(value, index, array) {
   *     return (value >= 10);
   *   }
   *   var passed = Pot.every([12, 5, 8, 130, 44], isBigEnough);
   *   // passed is false
   *   passed = Pot.every([12, 54, 18, 130, 44], isBigEnough);
   *   // passed is true
   *
   *
   * @param  {Array|Object|*} object    A target object.
   * @param  {Function}       callback  A callback function.
   * @param  {*}             (context)  (Optional) Object to use
   *                                      as `this` when executing callback.
   * @return {Boolean}                  Return the Boolean result by callback.
   * @name  Pot.every
   * @class
   * @function
   * @static
   * @public
   */
  every : Pot.tmp.createSyncIterator(function(speedKey) {
    return function() {
      var context = {iterateSpeedSync : Pot.iterate[speedKey]};
      return Pot.Iter.every.apply(context, arguments);
    };
  }),
  /**
   * Tests whether some element in the object passes the
   *  test implemented by the provided function.
   *
   * This method like Array.prototype.some
   *
   *
   * @example
   *   function isBigEnough(value, index, array) {
   *     return (value >= 10);
   *   }
   *   var passed = Pot.some([2, 5, 8, 1, 4], isBigEnough);
   *   // passed is false
   *   passed = Pot.some([12, 5, 8, 1, 4], isBigEnough);
   *   // passed is true
   *
   *
   * @param  {Array|Object|*} object    A target object.
   * @param  {Function}       callback  A callback function.
   * @param  {*}             (context)  (Optional) Object to use
   *                                      as `this` when executing callback.
   * @return {Boolean}                  Return the Boolean result by callback.
   * @name  Pot.some
   * @class
   * @function
   * @static
   * @public
   */
  some : Pot.tmp.createSyncIterator(function(speedKey) {
    return function() {
      var context = {iterateSpeedSync : Pot.iterate[speedKey]};
      return Pot.Iter.some.apply(context, arguments);
    };
  }),
  /**
   * Create continuously array that
   *  has numbers between start number and end number.
   *
   * First argument can given an object that has "begin, end, step" any keys.
   *
   * This function can be a letter rather than just numbers.
   *
   * @example
   *   var numbers = Pot.range(1, 5);
   *   debug(numbers); // @results [1, 2, 3, 4, 5]
   *   var chars = Pot.range('a', 'f');
   *   debug(chars);   // @results ['a', 'b', 'c', 'd', 'e', 'f']
   *   var ranges = Pot.range({begin: 0, step: 10, end: 50});
   *   debug(ranges);  // @results [0, 10, 20, 30, 40, 50]
   *
   *
   * @param  {Number|Object}  end/begin  The end number or object.
   * @param  {Number}         (end)      (optinal) The end number.
   * @param  {Number}         (step)     (optinal) The step number.
   * @return {Array}                     Return an array result.
   * @function
   * @static
   * @public
   */
  range : function(/*[begin,] end[, step]*/) {
    return Pot.Iter.range.apply(null, arguments);
  },
  /**
   * Returns the first index at which a
   *  given element can be found in the object, or -1 if it is not present.
   *
   * This method like Array.prototype.indexOf
   *
   *
   * @example
   *   var array = [2, 5, 9];
   *   var index = Pot.indexOf(array, 2);
   *   // index is 0
   *   index = Pot.indexOf(array, 7);
   *   // index is -1
   *   var object = {a: 2, b: 5, c: 9};
   *   index = Pot.indexOf(object, 2);
   *   // index is 'a'
   *   index = Pot.indexOf(object, 7);
   *   // index is -1
   *
   *
   * @param  {Array|Object|*} object  A target object.
   * @param  {*}              (from)  (Optional) The index at
   *                                    which to begin the search.
   *                                  Defaults to 0.
   * @return                          Return the index of result, or -1.
   * @function
   * @static
   * @public
   */
  indexOf : function() {
    return Pot.Iter.indexOf.apply(null, arguments);
  },
  /**
   * Returns the last index at which a
   *  given element can be found in the object, or -1 if it is not present.
   *
   * This method like Array.prototype.lastIndexOf
   *
   *
   * @example
   *   debug('array');
   *   var index, array = [2, 5, 9, 2];
   *   index = Pot.lastIndexOf(array, 2);
   *   debug('index is 3 : result = ' + index);   // 3
   *   index = Pot.lastIndexOf(array, 7);
   *   debug('index is -1 : result = ' + index);  // -1
   *   index = Pot.lastIndexOf(array, 2, 3);
   *   debug('index is 3 : result = ' + index);   // 3
   *   index = Pot.lastIndexOf(array, 2, 2);
   *   debug('index is 0 : result = ' + index);   // 0
   *   index = Pot.lastIndexOf(array, 2, -2);
   *   debug('index is 0 : result = ' + index);   // 0
   *   index = Pot.lastIndexOf(array, 2, -1);
   *   debug('index is 3 : result = ' + index);   // 3
   *   debug('object');
   *   var object = {a: 2, b: 5, c: 9, d: 2};
   *   index = Pot.lastIndexOf(object, 2);
   *   debug('index is  d : result = ' + index);  // 'd'
   *   index = Pot.lastIndexOf(object, 7);
   *   debug('index is -1 : result = ' + index);  // -1
   *   index = Pot.lastIndexOf(object, 2, 'd');   // 'd'
   *   debug('index is  d : result = ' + index);
   *   index = Pot.lastIndexOf(object, 2, 'c');   // 'a'
   *   debug('index is  a : result = ' + index);
   *
   *
   * @param  {Array|Object|*} object  A target object.
   * @param  {*}             (from)   (Optional) The index at which to
   *                                    start searching backwards.
   *                                  Defaults to the array's length.
   * @return                          Return the index of result, or -1.
   * @function
   * @static
   * @public
   */
  lastIndexOf : function() {
    return Pot.Iter.lastIndexOf.apply(null, arguments);
  }
});

delete Pot.tmp.createIterators;
delete Pot.tmp.createProtoIterators;
delete Pot.tmp.createSyncIterator;
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Definition of Crypt.
Pot.update({
  /**
   * @lends Pot
   */
  /**
   * Crypt and Hash utilities.
   *
   * @name Pot.Crypt
   * @type Object
   * @class
   * @static
   * @public
   */
  Crypt : {}
});

update(Pot.Crypt, {
  /**
   * @lends Pot.Crypt
   */
  /**
   * String hash function similar to java.lang.String.hashCode().
   *   The hash code for a string is computed as
   *   s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
   *   where s[i] is the ith character of the string and n is the length of
   *   the string.
   * We mod the result to make it between 0 (inclusive) and 2^32 (exclusive).
   *
   *
   * @param  {String|*}  string   A string.
   * @return {Number}             Hash value for `string`,
   *                                between 0 (inclusive)
   *                                 and 2^32 (exclusive).
   *                              The empty string returns 0.
   * @based goog.string.hashCode
   * @type Function
   * @function
   * @public
   * @static
   */
  hashCode : function(string) {
    var result = 0, s, i, len, max;
    max = 0x100000000; // 2^32
    if (string == null) {
      s = String(string);
    } else {
      s = string.toString ? string.toString() : String(string);
    }
    len = s.length;
    for (i = 0; i < len; ++i) {
      result = 31 * result + s.charCodeAt(i);
      result %= max;
    }
    return result;
  }
});

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Definition of Mozilla XPCOM interfaces/methods.
Pot.update({
  /**
   * XPCOM utilities.
   *
   * @name Pot.XPCOM
   * @type Object
   * @class
   * @static
   * @public
   */
  XPCOM : {}
});

update(Pot.XPCOM, {
  /**
   * @lends Pot.XPCOM
   */
  /**
   * Check whether XPCOM Components are enabled
   *
   * @type Boolean
   * @const
   * @static
   * @public
   */
  isEnabled : (function() {
    var result = false, x;
    try {
      if (typeof window === 'object' && window.location &&
          /^(?:chrome|resource):$/.test(window.location.protocol)) {
        try {
          Cc = Components.classes;
          Ci = Components.interfaces;
          Cr = Components.results;
          Cu = Components.utils;
          result = true;
        } catch (e) {
          // If you need XPCOM, try following privilege.
          // e.g.
          //   netscape.security.PrivilegeManager
          //           .enablePrivilege('UniversalXPConnect');
          //   or about:config :
          //   signed.applets.codebase_principal_support : true (default=false)
          //
          Ci = Cc = Cr = Cu = null;
          result = false;
        }
      }
    } catch (err) {
      result = false;
    }
    if (result) {
      Pot.System.isWaitable = true;
    }
    return result;
  })(),
  /**
   * Evaluate JavaScript code in the sandbox.
   *
   * @param  {String}  code   The expression.
   * @param  {String}  url    The sandbox url.
   * @return {*}              Return the result of expression.
   * @type Function
   * @function
   * @public
   * @static
   */
  evalInSandbox : function(code, url) {
    var result, re, src, uri;
    if (Pot.XPCOM.isEnabled) {
      if (!Cu) {
        Pot.System.isWaitable = Pot.XPCOM.isEnabled = false;
        return;
      }
      re = /^[\s;]*|[\s;]*$/g;
      src = ['(', ')'].join(stringify(code).replace(re, ''));
      //TODO: fix URL for example.
      uri = url || 'http://www.example.com/';
      result = Cu.evalInSandbox(src, Cu.Sandbox(uri));
    }
    return result;
  },
  /**
   * Wait until condition is true on the thread in non-blocking.
   * If true returned, waiting state will end.
   *
   * @param  {Function|*}  cond  A function or value as condition.
   * @based  Tombloo Lib
   * @type Function
   * @function
   * @public
   * @static
   */
  till : function(cond) {
    var thread;
    if (Pot.XPCOM.isEnabled) {
      try {
        thread = Cc['@mozilla.org/thread-manager;1']
                .getService(Ci.nsIThreadManager).mainThread;
      } catch (e) {
        Pot.System.isWaitable = Pot.XPCOM.isEnabled = false;
      }
      if (thread && Pot.XPCOM.isEnabled) {
        do {
          thread.processNextEvent(true);
        } while (cond && !cond());
      }
    }
  },
  /**
   * Get a browser window that was active last.
   *
   * @return {Window}       Return the browser window.
   * @type Function
   * @function
   * @public
   * @static
   */
  getMostRecentWindow : function() {
    var cwin;
    if (Pot.XPCOM.isEnabled) {
      try {
        cwin = Cc['@mozilla.org/appshell/window-mediator;1']
              .getService(Ci.nsIWindowMediator)
              .getMostRecentWindow('navigator:browser');
      } catch (e) {
        Pot.System.isWaitable = Pot.XPCOM.isEnabled = false;
      }
    }
    return cwin;
  },
  /**
   * Get the specific XUL Window.
   *
   * @param  {String}  uri  The target URI to get.
   *                        Will be the browser window if omitted.
   * @return {Object}       XULWindow.
   * @type Function
   * @function
   * @public
   * @static
   */
  getChromeWindow : function(uri) {
    var result, win, wins, pref;
    if (!Pot.XPCOM.isEnabled) {
      return;
    }
    pref = uri || 'chrome://browser/content/browser.xul';
    try {
      wins = Cc['@mozilla.org/appshell/window-mediator;1']
            .getService(Ci.nsIWindowMediator)
            .getXULWindowEnumerator(null);
    } catch (e) {
      Pot.System.isWaitable = Pot.XPCOM.isEnabled = false;
      return;
    }
    while (wins.hasMoreElements()) {
      try {
        win = wins.getNext()
            .QueryInterface(Ci.nsIXULWindow).docShell
            .QueryInterface(Ci.nsIInterfaceRequestor)
            .getInterface(Ci.nsIDOMWindow);
        if (win && win.location &&
            (win.location.href == pref || win.location == pref)) {
          result = win;
          break;
        }
      } catch (e) {}
    }
    return result;
  }
});

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Definition of Debug.
Pot.update({
  /**
   * Debugging utilities.
   *
   * @name Pot.Debug
   * @type Object
   * @class
   * @static
   * @public
   */
  Debug : {}
});

update(Pot.Debug, {
  /**
   * @lends Pot.Debug
   */
  /**
   * Output to the console using log function for debug.
   *
   *
   * @example
   *   debug('hoge'); // hoge
   *
   *
   * @param  {*}  msg  A log message, or variable.
   *
   * @type Function
   * @function
   * @public
   * @static
   */
  debug : debug
});

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Definition of globalize method.

Pot.update({
  /**
   * @lends Pot
   */
  /**
   * Globalizes the Pot object properties.
   *
   *
   * @example
   *   var obj = {
   *     foo : function() { return 'foo'; },
   *     bar : function() { return 'bar'; }
   *   };
   *   globalize(obj);
   *   // e.g.,
   *   debug(window.foo()); // 'foo'
   *   debug(bar());        // 'bar'
   *
   *
   * @example
   *   var result, obj = [1, 2, 3];
   *   //
   *   // Test for before globalization.
   *   try {
   *     result = succeed(obj);
   *   } catch (e) {
   *     // Will be Error: ReferenceError: unique is not defined.
   *     // Call by method to see a long object name from Pot.
   *     result = Pot.Deferred.succeed(obj);
   *     result.map(function(val) {
   *       return val + 100;
   *     }).then(function(res) {
   *       debug(res);
   *       // @results  res = [101, 102, 103]
   *     });
   *   }
   *   //
   *   // Globalize the Pot object methods.
   *   //
   *   Pot.globalize();
   *   //
   *   // Then you can call the short method name easy.
   *   var s = '';
   *   forEach(range('A', 'C'), function(val, key) {
   *     s += val + key;
   *   });
   *   debug(s);
   *   // @results 'A0B0C0'
   *
   *
   * @param  {Object}   (target)    A target object to globalize.
   * @param  {Boolean}  (advised)   (Optional) Whether to not overwrite the
   *                                  global object property names 
   *                                  if a conflict with the Pot object
   *                                  property name.
   * @return {Array}                The property name(s) that not defined by
   *                                  conflict as an array.
   * @type  Function
   * @function
   * @static
   * @public
   */
  globalize : function(target, advised) {
    var result = false, args = arrayize(arguments);
    var inputs, outputs, len, noops = [];
    len = args.length;
    if (len <= 1 && this === Pot && !Pot.isObject(target)) {
      inputs = this;
      if (len >= 1 && Pot.isBoolean(target)) {
        advised = target;
      } else {
        advised = !!target;
      }
    } else if (target && (Pot.isObject(target) ||
               Pot.isFunction(target) || Pot.isArray(target))) {
      inputs = target;
    }
    outputs = Pot.Internal.getExportObject();
    if (inputs && outputs) {
      if (inputs === Pot) {
        if (Pot.Internal.exportPot && Pot.Internal.PotExportProps) {
          result = Pot.Internal.exportPot(advised);
        }
      } else {
        each(inputs, function(prop, name) {
          if (advised && name in outputs) {
            noops[noops.length] = name;
          } else {
            outputs[name] = prop;
          }
        });
        result = noops;
      }
    }
    return result;
  }
});

// Define the export method.
update(Pot.Internal, {
  /**
   * Export the Pot properties.
   *
   * @private
   * @ignore
   * @internal
   */
  exportPot : function(advised) {
    var outputs, noops = [];
    outputs = Pot.Internal.getExportObject();
    if (outputs) {
      each(Pot.Internal.PotExportProps, function(prop, name) {
        if (advised && name in outputs) {
          noops[noops.length] = name;
        } else {
          outputs[name] = prop;
        }
      });
    }
    return noops;
  },
  /**
   * The properties to export.
   *
   * @private
   * @ignore
   * @internal
   */
  PotExportProps : {
    Pot             : Pot,
    update          : update,
    isBoolean       : Pot.isBoolean,
    isNumber        : Pot.isNumber,
    isString        : Pot.isString,
    isFunction      : Pot.isFunction,
    isArray         : Pot.isArray,
    isDate          : Pot.isDate,
    isRegExp        : Pot.isRegExp,
    isObject        : Pot.isObject,
    isError         : Pot.isError,
    typeOf          : Pot.typeOf,
    typeLikeOf      : Pot.typeLikeOf,
    StopIteration   : Pot.StopIteration,
    isStopIter      : Pot.isStopIter,
    isArrayLike     : Pot.isArrayLike,
    isDeferred      : Pot.isDeferred,
    isIter          : Pot.isIter,
    isNumeric       : Pot.isNumeric,
    isInt           : Pot.isInt,
    isNativeCode    : Pot.isNativeCode,
    isBuiltinMethod : Pot.isBuiltinMethod,
    isWindow        : Pot.isWindow,
    isDocument      : Pot.isDocument,
    isElement       : Pot.isElement,
    isNodeLike      : Pot.isNodeLike,
    isNodeList      : Pot.isNodeList,
    Deferred        : Pot.Deferred,
    succeed         : Pot.Deferred.succeed,
    failure         : Pot.Deferred.failure,
    wait            : Pot.Deferred.wait,
    callLater       : Pot.Deferred.callLater,
    callLazy        : Pot.Deferred.callLazy,
    maybeDeferred   : Pot.Deferred.maybeDeferred,
    isFired         : Pot.Deferred.isFired,
    lastResult      : Pot.Deferred.lastResult,
    lastError       : Pot.Deferred.lastError,
    register        : Pot.Deferred.register,
    unregister      : Pot.Deferred.unregister,
    deferrize       : Pot.Deferred.deferrize,
    begin           : Pot.Deferred.begin,
    flush           : Pot.Deferred.flush,
    till            : Pot.Deferred.till,
    parallel        : Pot.Deferred.parallel,
    chain           : Pot.Deferred.chain,
    forEach         : Pot.forEach,
    repeat          : Pot.repeat,
    forEver         : Pot.forEver,
    iterate         : Pot.iterate,
    Iter            : Pot.Iter,
    toIter          : Pot.Iter.toIter,
    map             : Pot.map,
    filter          : Pot.filter,
    reduce          : Pot.reduce,
    every           : Pot.every,
    some            : Pot.some,
    range           : Pot.range,
    indexOf         : Pot.indexOf,
    lastIndexOf     : Pot.lastIndexOf,
    rescape         : rescape,
    arrayize        : arrayize,
    invoke          : invoke,
    stringify       : stringify,
    trim            : trim,
    now             : now,
    hashCode        : Pot.Crypt.hashCode,
    globalize       : Pot.globalize,
    debug           : Pot.Debug.debug
  }
});

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Register the Pot object into global.
update(globals || Pot.Global || {}, {
  Pot : Pot
});

})(this || {});

