//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Define iteration methods. (internal)
(function() {
var LightIterator,
    QuickIteration,
    createLightIterateConstructor,
    createSyncIterator;

update(PotInternal, {
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
    return new LightIterator.fn.doit(
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
      iterate   : 0x10,
      items     : 0x20,
      zip       : 0x40
    }
  })
});

// Refer the Pot properties/functions.
PotInternalLightIterator = LightIterator = PotInternal.LightIterator;

update(LightIterator, {
  /**@ignore*/
  defaults : {
    speed : LightIterator.speeds.normal
  },
  /**@ignore*/
  revSpeeds : {}
});

each(LightIterator.speeds, function(v, k) {
  LightIterator.revSpeeds[v] = k;
});

LightIterator.fn = LightIterator.prototype =
  update(LightIterator.prototype, {
  /**
   * @lends Pot.Internal.LightIterator.prototype
   */
  /**
   * @ignore
   */
  constructor : LightIterator,
  /**
   * @private
   * @ignore
   */
  interval : LightIterator.defaults.speed,
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
  isDeferStopIter : false,
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
    if (isNumeric(this.options.interval)) {
      n = this.options.interval - 0;
    } else if (this.options.interval in LightIterator.speeds) {
      n = LightIterator.speeds[this.options.interval] - 0;
    }
    if (n !== null && !isNaN(n)) {
      this.interval = n;
    }
    if (!isNumeric(this.interval)) {
      this.interval = LightIterator.defaults.speed;
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
    if (this.options.async !== void 0) {
      a = !!this.options.async;
    }
    if (a !== null) {
      this.async = !!a;
    }
    if (!isBoolean(this.async)) {
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
    return new Deferred({ async : false });
  },
  /**
   * Watch the process.
   *
   * @private
   * @ignore
   */
  watch : function() {
    var that = this;
    if (!this.async && this.waiting === true && PotSystem.isWaitable) {
      Pot.XPCOM.throughout(function() {
        return that.waiting !== true;
      });
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
        start : now(),
        total : null,
        loop  : null,
        diff  : null,
        risk  : null,
        axis  : null,
        count : 1,
        rest  : 100,
        limit : 255
      };
      this.setIter(object, callback);
      if (!this.async && !PotSystem.isWaitable) {
        this.revback();
        this.waiting = false;
      } else {
        d = this.createDeferred();
        d.then(function() {
          var d1 = that.createDeferred(),
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
            if (isDeferred(that.result) &&
                isStopIter(Deferred.lastError(that.result))) {
              that.result = Deferred.lastResult(that.result);
            }
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
    var type = this.options.type,
        types = LightIterator.types,
        context = this.options.context;
    switch (true) {
      case ((type & types.iterate) === types.iterate):
          this.result = null;
          this.iter = this.iterate(object, callback, context);
          break;
      case ((type & types.forEver) === types.forEver):
          this.result = {};
          this.iter = this.forEver(object, context);
          break;
      case ((type & types.repeat) === types.repeat):
          this.result = {};
          this.iter = this.repeat(object, callback, context);
          break;
      case ((type & types.items) === types.items):
          this.result = [];
          this.iter = this.items(object, callback, context);
          break;
      case ((type & types.zip) === types.zip):
          this.result = [];
          this.iter = this.zip(object, callback, context);
          break;
      default:
          if (isArrayLike(object)) {
            this.result = object;
            this.iter = this.forLoop(object, callback, context);
          } else {
            this.result = object;
            this.iter = this.forInLoop(object, callback, context);
          }
    }
  },
  /**
   * @private
   * @ignore
   */
  revback : function() {
    var that = this, result, err, cutback = false, time;
    this.time.loop = now();
    REVOLVE: {
      do {
        try {
          if (this.isDeferStopIter) {
            this.isDeferStopIter = false;
            throw PotStopIteration;
          }
          result = this.iter.next();
        } catch (e) {
          err = e;
          if (isStopIter(err)) {
            break REVOLVE;
          }
          throw err;
        }
        if (this.async && isDeferred(result)) {
          return result.ensure(function(res) {
            if (res !== void 0) {
              if (isError(res)) {
                if (isStopIter(res)) {
                  that.isDeferStopIter = true;
                  if (isDeferred(that.result) &&
                      isStopIter(Deferred.lastError(that.result))) {
                    that.result = Deferred.lastResult(that.result);
                  }
                } else {
                  Deferred.lastError(this, res);
                }
              } else {
                Deferred.lastResult(this, res);
              }
            }
            that.flush(that.revback, true);
          });
        }
        time = now();
        if (PotSystem.isWaitable) {
          if (this.time.total === null) {
            this.time.total = time;
          } else if (time - this.time.total >= this.time.rest) {
            Pot.XPCOM.throughout(0);
            this.time.total = now();
          }
        } else if (!this.async) {
          if (this.restable && this.time.count >= this.time.limit) {
            this.restable = false;
          }
        }
        this.time.risk = time - this.time.start;
        this.time.diff = time - this.time.loop;
        if (this.time.diff >= this.interval) {
          if (this.async &&
              this.interval < LightIterator.speeds.normal) {
            cutback = true;
          } else if (this.async || this.restable || PotSystem.isWaitable) {
            if (this.time.diff < this.interval + 8) {
              this.time.axis = 2;
            } else if (this.time.diff < this.interval + 36) {
              this.time.axis = 5;
            } else if (this.time.diff < this.interval + 48) {
              this.time.axis = 7;
            } else {
              this.time.axis = 10;
            }
            if (this.time.axis >= 10 ||
                (Math.random() * 10 < this.time.axis)) {
              cutback = true;
            }
          }
        }
      } while (!cutback);
      if (this.time.count <= this.time.limit) {
        this.time.count++;
      }
      return this.flush(this.revback, true);
    }
    if (isDeferred(this.revDeferred)) {
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
    var that = this,
        d  = this.createDeferred(),
        de = this.createDeferred();
    d.then(function() {
      var dd = that.createDeferred();
      that.revDeferred = that.createDeferred();
      dd.then(function() {
        return that.revback();
      }).begin();
      return that.revDeferred;
    }).ensure(function(er) {
      de.begin();
      if (isError(er)) {
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
    if (this.async || PotSystem.isWaitable) {
      lazy = true;
    }
    if (!lazy && isFunction(callback)) {
      return callback.call(this);
    } else {
      d = this.createDeferred();
      d.then(function() {
        if (isDeferred(callback)) {
          callback.begin();
        } else {
          callback.call(that);
        }
      });
      if (lazy) {
        speed = 0;
        if (useSpeed) {
          speedKey = LightIterator.revSpeeds[this.interval];
          if (speedKey &&
              isNumeric(LightIterator.delays[speedKey])) {
            speed = LightIterator.delays[speedKey];
          }
          if (Math.random() * 10 < Math.max(2, (this.time.axis || 2) / 2.75)) {
            speed += Math.min(
              this.time.rest,
              Math.max(1,
                Math.ceil(
                  (this.time.risk / (this.time.rest + this.time.diff)) +
                   this.time.diff
                )
              )
            );
          }
        }
        PotInternalSetTimeout(function() {
          d.begin();
        }, speed);
      } else {
        d.begin();
      }
    }
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
        throw PotStopIteration;
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
    if (!isFunction(callback)) {
      return this.noop();
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
        return result;
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
    if (!isFunction(callback)) {
      return this.noop();
    }
    if (!max || max == null) {
      n = 0;
    } else if (isNumeric(max)) {
      n = max - 0;
    } else {
      n = max || {};
      if (isNumeric(n.start)) {
        n.begin = n.start;
      }
      if (isNumeric(n.stop)) {
        n.end = n.stop;
      }
    }
    loops = {
      begin : isNumeric(n.begin) ? n.begin - 0 : 0,
      end   : isNumeric(n.end)   ? n.end   - 0 : (n || 0) - 0,
      step  : isNumeric(n.step)  ? n.step  - 0 : 1,
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
          throw PotStopIteration;
        }
        i += loops.step;
        return result;
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
    if (!object || !object.length || !isFunction(callback)) {
      return this.noop();
    }
    copy = arrayize(object);
    return {
      /**@ignore*/
      next : function() {
        var val, result;
        while (true) {
          if (i >= copy.length) {
            throw PotStopIteration;
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
          return result;
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
    var copy, i = 0;
    //XXX: Should use "yield" for duplicate loops.
    if (isFunction(callback)) {
      copy = [];
      each(object, function(value, prop) {
        copy[copy.length] = [value, prop];
      });
    }
    if (!copy || !copy.length) {
      return this.noop();
    }
    return {
      /**@ignore*/
      next : function() {
        var result, c, key, val;
        while (true) {
          if (i >= copy.length) {
            throw PotStopIteration;
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
          return result;
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
    if (Pot.isIterable(object) && !Pot.isIter(object)) {
      // using "yield" generator.
      if (isFunction(callback)) {
        return {
          /**@ignore*/
          next : function() {
            var res = object.next();
            that.result = callback.apply(context, arrayize(res));
            return that.result;
          }
        };
      } else {
        return {
          /**@ignore*/
          next : function() {
            that.result = object.next();
            return that.result;
          }
        };
      }
    } else {
      iterable = Iter.toIter(object);
      if (!isIter(iterable)) {
        return this.noop();
      }
      if (isFunction(callback)) {
        return {
          /**@ignore*/
          next : function() {
            var results = iterable.next();
            results = arrayize(results);
            while (results.length < 2) {
              results.push((void 0));
            }
            results.push(object);
            that.result = callback.apply(context, results);
            return that.result;
          }
        };
      } else {
        return {
          /**@ignore*/
          next : function() {
            that.result = iterable.next();
            return that.result;
          }
        };
      }
    }
  },
  /**
   * items format loop.
   *
   * @private
   * @ignore
   */
  items : function(object, callback, context) {
    var that = this, copy, i = 0, isPair;
    if (isObject(object)) {
      copy = [];
      each(object, function(ov, op) {
        copy[copy.length] = [op, ov];
      });
      isPair = true;
    } else if (isArrayLike(object)) {
      copy = arrayize(object);
    }
    if (!copy || !copy.length) {
      return this.noop();
    }
    if (isFunction(callback)) {
      return {
        /**@ignore*/
        next : function() {
          var result, c, key, val;
          while (true) {
            if (i >= copy.length) {
              throw PotStopIteration;
            }
            if (!(i in copy)) {
              i++;
              continue;
            }
            try {
              c = copy[i];
              if (isPair) {
                key = c[0];
                val = c[1];
              } else {
                key = i;
                val = c;
              }
            } catch (e) {
              i++;
              continue;
            }
            result = callback.call(context, [key, val], object);
            i++;
            that.result[that.result.length] = result;
            return result;
          }
        }
      };
    } else {
      return {
        /**@ignore*/
        next : function() {
          var r, t, k, v;
          while (true) {
            if (i >= copy.length) {
              throw PotStopIteration;
            }
            if (!(i in copy)) {
              i++;
              continue;
            }
            try {
              t = copy[i];
              if (isPair) {
                k = t[0];
                v = t[1];
              } else {
                k = i;
                v = t;
              }
            } catch (e) {
              i++;
              continue;
            }
            i++;
            r = [k, v];
            that.result[that.result.length] = r;
            return r;
          }
        }
      };
    }
  },
  /**
   * zip iteration.
   *
   * @private
   * @ignore
   */
  zip : function(object, callback, context) {
    var that = this, copy, i = 0, max;
    if (isArrayLike(object)) {
      copy = arrayize(object);
      max = copy.length;
    }
    if (!max || !copy || !copy.length) {
      return this.noop();
    }
    if (isFunction(callback)) {
      return {
        /**@ignore*/
        next : function() {
          var result, zips = [], j, item;
          for (j = 0; j < max; j++) {
            item = arrayize(copy[j]);
            if (!item || !item.length || i >= item.length) {
              throw PotStopIteration;
            }
            zips[zips.length] = item[i];
          }
          result = callback.call(context, zips, object);
          that.result[that.result.length] = result;
          i++;
          return result;
        }
      };
    } else {
      return {
        /**@ignore*/
        next : function() {
          var z = [], k, t;
          for (k = 0; k < max; k++) {
            t = arrayize(copy[k]);
            if (!t || !t.length || i >= t.length) {
              throw PotStopIteration;
            }
            z[z.length] = t[i];
          }
          that.result[that.result.length] = z;
          i++;
          return z;
        }
      };
    }
  }
});

LightIterator.fn.doit.prototype = LightIterator.fn;

// Update internal synchronous iteration.
update(LightIterator, {
  /**
   * @lends Pot.Internal.LightIterator
   */
  /**
   * Quick iteration for synchronous.
   *
   * @type Object
   * @class
   * @private
   * @ignore
   */
  QuickIteration : {
    /**
     * @lends Pot.Internal.LightIterator.QuickIteration
     */
    /**
     * @private
     * @ignore
     */
    resolve : function(iter) {
      var err;
      try {
        while (true) {
          iter.next();
        }
      } catch (e) {
        err = e;
        if (!isStopIter(err)) {
          throw err;
        }
      }
    },
    /**
     * @private
     * @ignore
     */
    forEach : function(object, callback, context) {
      var result, iter, that = LightIterator.fn;
      if (!object) {
        result = {};
      } else {
        result = object;
        if (isArrayLike(object)) {
          iter = that.forLoop(object, callback, context);
        } else {
          iter = that.forInLoop(object, callback, context);
        }
        QuickIteration.resolve(iter);
      }
      return result;
    },
    /**
     * @private
     * @ignore
     */
    repeat : function(max, callback, context) {
      var result = {}, iter, that = LightIterator.fn;
      if (max) {
        iter = that.repeat(max, callback, context);
        QuickIteration.resolve(iter);
      }
      return result;
    },
    /**
     * @private
     * @ignore
     */
    forEver : function(callback, context) {
      var result = {}, iter, that = LightIterator.fn;
      if (callback) {
        iter = that.forEver(callback, context);
        QuickIteration.resolve(iter);
      }
      return result;
    },
    /**
     * @private
     * @ignore
     */
    iterate : function(object, callback, context) {
      var result, iter, o, that = LightIterator.fn;
      if (!object) {
        result = {};
      } else {
        result = null;
        o = {
          noop   : that.noop,
          result : null
        };
        iter = that.iterate.call(o, object, callback, context);
        QuickIteration.resolve(iter);
        result = o.result;
      }
      return result;
    },
    /**
     * @private
     * @ignore
     */
    items : function(object, callback, context) {
      var result = [], iter, o, that = LightIterator.fn;
      if (object) {
        o = {
          noop   : that.noop,
          result : []
        };
        iter = that.items.call(o, object, callback, context);
        QuickIteration.resolve(iter);
        result = o.result;
      }
      return result;
    },
    /**
     * @private
     * @ignore
     */
    zip : function(object, callback, context) {
      var result = [], iter, o, that = LightIterator.fn;
      if (object) {
        o = {
          noop   : that.noop,
          result : []
        };
        iter = that.zip.call(o, object, callback, context);
        QuickIteration.resolve(iter);
        result = o.result;
      }
      return result;
    }
  }
});

QuickIteration = LightIterator.QuickIteration;
//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Define the main iterators.

// Temporary creation function.
update(PotTmp, {
  /**
   * @lends Pot.tmp
   */
  /**
   * @private
   * @ignore
   */
  createLightIterateConstructor : function(creator) {
    var
    name,
    /**@ignore*/
    create = function(speed) {
      var interval;
      if (LightIterator.speeds[speed] === void 0) {
        interval = LightIterator.defaults.speed;
      } else {
        interval = LightIterator.speeds[speed];
      }
      return creator(interval);
    },
    methods = {},
    construct = create();
    for (name in LightIterator.speeds) {
      methods[name] = create(name);
    }
    return update(construct, methods);
  }
});

createLightIterateConstructor = PotTmp.createLightIterateConstructor;

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
  forEach : createLightIterateConstructor(function(interval) {
    if (PotSystem.isWaitable &&
        interval < LightIterator.speeds.normal) {
      return function(object, callback, context) {
        var opts = {};
        opts.type = LightIterator.types.forLoop |
                    LightIterator.types.forInLoop;
        opts.interval = interval;
        opts.async = false;
        opts.context = context;
        return (new LightIterator(object, callback, opts)).result;
      };
    } else {
      return function(object, callback, context) {
        return QuickIteration.forEach(
          object, callback, context
        );
      };
    }
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
  repeat : createLightIterateConstructor(function(interval) {
    if (PotSystem.isWaitable &&
        interval < LightIterator.speeds.normal) {
      return function(max, callback, context) {
        var opts = {};
        opts.type = LightIterator.types.repeat;
        opts.interval = interval;
        opts.async = false;
        opts.context = context;
        return (new LightIterator(max, callback, opts)).result;
      };
    } else {
      return function(max, callback, context) {
        return QuickIteration.repeat(
          max, callback, context
        );
      };
    }
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
  forEver : createLightIterateConstructor(function(interval) {
    if (PotSystem.isWaitable &&
        interval < LightIterator.speeds.normal) {
      return function(callback, context) {
        var opts = {};
        opts.type = LightIterator.types.forEver;
        opts.interval = interval;
        opts.async = false;
        opts.context = context;
        return (new LightIterator(callback, null, opts)).result;
      };
    } else {
      return function(callback, context) {
        return QuickIteration.forEver(
          callback, context
        );
      };
    }
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
  iterate : createLightIterateConstructor(function(interval) {
    if (PotSystem.isWaitable &&
        interval < LightIterator.speeds.normal) {
      return function(object, callback, context) {
        var opts = {};
        opts.type = LightIterator.types.iterate;
        opts.interval = interval;
        opts.async = false;
        opts.context = context;
        return (new LightIterator(object, callback, opts)).result;
      };
    } else {
      return function(object, callback, context) {
        return QuickIteration.iterate(
          object, callback, context
        );
      };
    }
  }),
  /**
   * Collect the object key and value and make array as items format.
   *
   *
   * @example
   *   var obj = {foo: 1, bar: 2, baz: 3};
   *   debug(items(obj));
   *   // @results [['foo', 1], ['bar', 2], ['baz', 3]]
   *
   *
   * @example
   *   var array = ['foo', 'bar', 'baz'];
   *   debug(items(array));
   *   // @results [[0, 'foo'], [1, 'bar'], [2, 'baz']]
   *
   *
   * @example
   *   // Example for using callback.
   *   var arr = ['foo', 'bar', 'baz'];
   *   var func = function(item) {
   *     return '(' + item[0] + ')' + item[1];
   *   };
   *   debug(items(arr, func));
   *   // @results ['(0)foo', '(1)bar', '(2)baz']
   *
   *
   * @example
   *   // Example for using callback.
   *   var obj = {foo: 1, bar: 2, baz: 3};
   *   var func = function(item) {
   *     return [item[0] + '::' + item[1]];
   *   };
   *   debug(items(obj, func));
   *   // @results [['foo::1'], ['bar::2'], ['baz::3']]
   *
   *
   * @param  {Object|Array}  object     The target object or an array.
   * @param  {Function}     (callback)  (Optional) Callback function.
   *                                      function({Array} item[, object])
   *                                        this == `context`.
   * @param  {*}            (context)   (Optional) Object to use
   *                                      as `this` when executing callback.
   * @return {Array}                    The collected items as an array.
   *
   * @class
   * @function
   * @static
   * @name Pot.items
   *
   * @property {Function} limp   Iterates "items" loop with slowest speed.
   * @property {Function} doze   Iterates "items" loop with slower speed.
   * @property {Function} slow   Iterates "items" loop with slow speed.
   * @property {Function} normal Iterates "items" loop with default speed.
   * @property {Function} fast   Iterates "items" loop with fast speed.
   * @property {Function} rapid  Iterates "items" loop with faster speed.
   * @property {Function} ninja  Iterates "items" loop with fastest speed.
   */
  items : createLightIterateConstructor(function(interval) {
    if (PotSystem.isWaitable &&
        interval < LightIterator.speeds.normal) {
      return function(object, callback, context) {
        var opts = {};
        opts.type = LightIterator.types.items;
        opts.interval = interval;
        opts.async = false;
        opts.context = context;
        return (new LightIterator(object, callback, opts)).result;
      };
    } else {
      return function(object, callback, context) {
        return QuickIteration.items(
          object, callback, context
        );
      };
    }
  }),
  /**
   * Create a new array which has the elements at
   *   position ith of the provided arrays.
   * This function is handled as seen from the longitudinal for array
   *   that is similar to the zip() function in Python.
   *
   * <pre>
   * Example:
   *
   *   arguments:  [[1, 2, 3],
   *                [4, 5, 6]]
   *
   *   results:    [[1, 4],
   *                [2, 5],
   *                [3, 6]]
   * </pre>
   *
   *
   * @link http://docs.python.org/library/functions.html#zip
   *
   *
   * @example
   *   var result = zip([[1, 2, 3], [4, 5, 6]]);
   *   debug(result);
   *   // @results
   *   //   [[1, 4], [2, 5], [3, 6]]
   *   //
   *
   *
   * @example
   *   var result = zip([[1, 2, 3], [1, 2, 3, 4, 5]]);
   *   debug(result);
   *   // @results
   *   //   [[1, 1], [2, 2], [3, 3]]
   *   //
   *
   *
   * @example
   *   var result = zip([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11]]);
   *   debug(result);
   *   // @results
   *   //   [[1, 4, 7, 10], [2, 5, 8, 11]]
   *   //
   *
   *
   * @example
   *   var result = zip(['hoge']);
   *   debug(result);
   *   // @results
   *   //   [['hoge']]
   *   //
   *
   *
   * @example
   *   var result = zip([[1], [2], [3]]);
   *   debug(result);
   *   // @results
   *   //   [[1, 2, 3]]
   *   //
   *
   *
   * @example
   *   var result = zip([[1, 2, 3], ['foo', 'bar', 'baz'], [4, 5]]);
   *   debug(result);
   *   // @results
   *   //   [[1, 'foo', 4], [2, 'bar', 5]]
   *   //
   *
   *
   * @example
   *   var callback = function(items) { return items[0] + items[1]; };
   *   var result = zip([[1, 2, 3], [4, 5, 6]], callback);
   *   debug(result);
   *   // @results [5, 7, 9]
   *
   *
   * @param  {Array}     object     An array to be combined.
   * @param  {Function} (callback)  (Optional) Callback function.
   *                                  function({Array} items[, {*} object])
   *                                    this == `context`.
   * @param  {*}        (context)   (Optional) Object to use
   *                                  as `this` when executing callback.
   * @return {Array}                A new array of arrays created from
   *                                  provided objects.
   *
   * @class
   * @function
   * @static
   * @name Pot.zip
   *
   * @property {Function} limp   Iterates "zip" loop with slowest speed.
   * @property {Function} doze   Iterates "zip" loop with slower speed.
   * @property {Function} slow   Iterates "zip" loop with slow speed.
   * @property {Function} normal Iterates "zip" loop with default speed.
   * @property {Function} fast   Iterates "zip" loop with fast speed.
   * @property {Function} rapid  Iterates "zip" loop with faster speed.
   * @property {Function} ninja  Iterates "zip" loop with fastest speed.
   */
  zip : createLightIterateConstructor(function(interval) {
    if (PotSystem.isWaitable &&
        interval < LightIterator.speeds.normal) {
      return function(object, callback, context) {
        var opts = {};
        opts.type = LightIterator.types.zip;
        opts.interval = interval;
        opts.async = false;
        opts.context = context;
        return (new LightIterator(object, callback, opts)).result;
      };
    } else {
      return function(object, callback, context) {
        return QuickIteration.zip(
          object, callback, context
        );
      };
    }
  })
});

// Define iterators for Deferred (Asynchronous)
update(Deferred, {
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
  forEach : createLightIterateConstructor(function(interval) {
    return function(object, callback, context) {
      var opts = {};
      opts.type = LightIterator.types.forLoop |
                  LightIterator.types.forInLoop;
      opts.interval = interval;
      opts.async = true;
      opts.context = context;
      return (new LightIterator(object, callback, opts)).deferred;
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
  repeat : createLightIterateConstructor(function(interval) {
    return function(max, callback, context) {
      var opts = {};
      opts.type = LightIterator.types.repeat;
      opts.interval = interval;
      opts.async = true;
      opts.context = context;
      return (new LightIterator(max, callback, opts)).deferred;
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
  forEver : createLightIterateConstructor(function(interval) {
    return function(callback, context) {
      var opts = {};
      opts.type = LightIterator.types.forEver;
      opts.interval = interval;
      opts.async = true;
      opts.context = context;
      return (new LightIterator(callback, null, opts)).deferred;
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
  iterate : createLightIterateConstructor(function(interval) {
    return function(object, callback, context) {
      var opts = {};
      opts.type = LightIterator.types.iterate;
      opts.interval = interval;
      opts.async = true;
      opts.context = context;
      return (new LightIterator(object, callback, opts)).deferred;
    };
  }),
  /**
   * Collect the object key and value and make array as items format.
   *
   * @param  {Object|Array}  object     The target object or an array.
   * @param  {Function}     (callback)  (Optional) Callback function.
   *                                      function({Array} item[, object])
   *                                        this == `context`.
   * @param  {*}            (context)   (Optional) Object to use
   *                                      as `this` when executing callback.
   * @return {Deferred}                 Return a new instance of Deferred that
   *                                      has the collected items as an array.
   *
   * @class
   * @function
   * @public
   * @type Function
   * @name Pot.Deferred.items
   *
   * @property {Function} limp   Iterates "items" loop with slowest speed.
   * @property {Function} doze   Iterates "items" loop with slower speed.
   * @property {Function} slow   Iterates "items" loop with slow speed.
   * @property {Function} normal Iterates "items" loop with default speed.
   * @property {Function} fast   Iterates "items" loop with fast speed.
   * @property {Function} rapid  Iterates "items" loop with faster speed.
   * @property {Function} ninja  Iterates "items" loop with fastest speed.
   */
  items : createLightIterateConstructor(function(interval) {
    return function(object, callback, context) {
      var opts = {};
      opts.type = LightIterator.types.items;
      opts.interval = interval;
      opts.async = true;
      opts.context = context;
      return (new LightIterator(object, callback, opts)).deferred;
    };
  }),
  /**
   * Create a new array which has the elements at
   *   position ith of the provided arrays.
   * This function is handled as seen from the longitudinal for array
   *   that is similar to the zip() function in Python.
   *
   * <pre>
   * Example:
   *
   *   arguments:  [[1, 2, 3],
   *                [4, 5, 6]]
   *
   *   results:    [[1, 4],
   *                [2, 5],
   *                [3, 6]]
   * </pre>
   *
   * @link http://docs.python.org/library/functions.html#zip
   *
   * @param  {Array}     object     Objects to be combined.
   * @param  {Function} (callback)  (Optional) Callback function.
   *                                  function({Array} items[, {*} object])
   *                                    this == `context`.
   * @param  {*}        (context)   (Optional) Object to use
   *                                  as `this` when executing callback.
   * @return {Deferred}             Return a new instance of Deferred that has
   *                                  a new array of arrays created from
   *                                  provided objects.
   * @class
   * @function
   * @public
   * @type Function
   * @name Pot.Deferred.zip
   *
   * @property {Function} limp   Iterates "zip" loop with slowest speed.
   * @property {Function} doze   Iterates "zip" loop with slower speed.
   * @property {Function} slow   Iterates "zip" loop with slow speed.
   * @property {Function} normal Iterates "zip" loop with default speed.
   * @property {Function} fast   Iterates "zip" loop with fast speed.
   * @property {Function} rapid  Iterates "zip" loop with faster speed.
   * @property {Function} ninja  Iterates "zip" loop with fastest speed.
   */
  zip : createLightIterateConstructor(function(interval) {
    return function(object, callback, context) {
      var opts = {};
      opts.type = LightIterator.types.zip;
      opts.interval = interval;
      opts.async = true;
      opts.context = context;
      return (new LightIterator(object, callback, opts)).deferred;
    };
  })
});

delete PotTmp.createLightIterateConstructor;
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
    return isIter(this) ? this.init(arguments)
                        : new Iter.fn.init(arguments);
  }
});

// Refer the Pot properties/functions.
Iter = Pot.Iter;

// Definition of the prototype
Iter.fn = Iter.prototype = update(Iter.prototype, {
  /**
   * @lends Pot.Iter.prototype
   */
  /**
   * @ignore
   */
  constructor : Iter,
  /**
   * @private
   * @ignore
   */
  id : PotInternal.getMagicNumber(),
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
  toString : PotToString,
  /**
   * isIter.
   *
   * @type Function
   * @function
   * @const
   * @static
   * @public
   */
  isIter : isIter,
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
    throw PotStopIteration;
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

Iter.fn.init.prototype = Iter.fn;

// Define Iter object properties.
update(Iter, {
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
  StopIteration : PotStopIteration,
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
    var iter, o, arrayLike, objectLike;
    if (isIter(x)) {
      return x;
    }
    arrayLike  = x && isArrayLike(x);
    objectLike = x && !arrayLike && isObject(x);
    if (objectLike) {
      o = [];
      each(x, function(xv, xp) {
        o[o.length] = [xv, xp];
      });
    } else {
      o = arrayize(x);
    }
    iter = new Iter();
    /**@ignore*/
    iter.next = (function() {
      var i = 0;
      if (objectLike) {
        return function() {
          var key, val, pair;
          while (true) {
            if (i >= o.length) {
              throw PotStopIteration;
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
              throw PotStopIteration;
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
    }());
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
    arrayLike  = object && isArrayLike(object);
    objectLike = object && !arrayLike && isObject(object);
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
        if (isDeferred(res)) {
          return res.then(function(rv) {
            if (arrayLike) {
              result[result.length] = rv;
            } else if (objectLike) {
              result[key] = rv;
            } else {
              result = rv;
            }
          });
        } else {
          if (arrayLike) {
            result[result.length] = res;
          } else if (objectLike) {
            result[key] = res;
          } else {
            result = res;
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
  filter : (function() {
    /**@ignore*/
    var emptyFilter = function(a) { return a; };
    return function(object, callback, context) {
      var result, arrayLike, objectLike, iterateDefer, it, iterable, cb;
      cb = callback || emptyFilter;
      iterateDefer = this && this.iterateSpeed;
      arrayLike  = object && isArrayLike(object);
      objectLike = object && !arrayLike && isObject(object);
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
          var res = cb.call(context, val, key, obj);
          if (isDeferred(res)) {
            return res.then(function(rv) {
              if (rv) {
                if (arrayLike) {
                  result[result.length] = val;
                } else if (objectLike) {
                  result[key] = val;
                } else {
                  result = val;
                }
              }
            });
          } else {
            if (res) {
              if (arrayLike) {
                result[result.length] = val;
              } else if (objectLike) {
                result[key] = val;
              } else {
                result = val;
              }
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
    };
  }()),
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
    arrayLike  = object && isArrayLike(object);
    objectLike = object && !arrayLike && isObject(object);
    if (initial === void 0) {
      /**@ignore*/
      value = (function() {
        var first;
        if (arrayLike || objectLike) {
          each(object, function(v) {
            first = v;
            throw PotStopIteration;
          });
        }
        return first;
      }());
    } else {
      value = initial;
    }
    skip = true;
    iterable = iterateDefer || this && this.iterateSpeedSync || Pot.iterate;
    /**@ignore*/
    it = function() {
      return iterable(object, function(val, key, obj) {
        var res;
        if (skip) {
          skip = false;
        } else {
          res = callback.call(context, value, val, key, obj);
          if (isDeferred(res)) {
            return res.then(function(rv) {
              value = rv;
            });
          } else {
            value = res;
          }
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
        var res = callback.call(context, val, key, obj);
        if (isDeferred(res)) {
          return res.then(function(rv) {
            if (!rv) {
              result = false;
              throw PotStopIteration;
            }
          });
        } else {
          if (!res) {
            result = false;
            throw PotStopIteration;
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
        var res = callback.call(context, val, key, obj);
        if (isDeferred(res)) {
          return res.then(function(rv) {
            if (rv) {
              result = true;
              throw PotStopIteration;
            }
          });
        } else {
          if (res) {
            result = true;
            throw PotStopIteration;
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
    var args = arguments, arg, result = [],
        begin = 0,
        end   = 0,
        step  = 1,
        n, string, iter;
    switch (args.length) {
      case 0:
          return;
      case 1:
          arg = args[0];
          if (isObject(arg)) {
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
      default:
          begin = args[0];
          end   = args[1];
          step  = args[2];
    }
    if (isString(begin) && begin.length === 1 &&
        isString(end)   && end.length   === 1) {
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
    iter = new Iter();
    /**@ignore*/
    iter.next = function() {
      if ((step > 0 && begin > end) ||
          (step < 0 && begin < end)) {
        throw PotStopIteration;
      }
      result[result.length] = string ? fromUnicode(begin) : begin;
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
   * @return {Number|String}          Return the index of result, or -1.
   * @type Function
   * @function
   * @static
   * @public
   */
  indexOf : function(object, subject, from) {
    var result = -1, i, len, val, passed,
        args = arguments, argn = args.length,
        arrayLike = object && isArrayLike(object),
        objectLike = object && !arrayLike && isObject(object);
    if (arrayLike) {
      try {
        if (PotSystem.isBuiltinArrayIndexOf) {
          i = indexOf.apply(object, arrayize(args, 1));
          if (isNumeric(i)) {
            result = i;
          } else {
            throw i;
          }
        } else {
          throw i;
        }
      } catch (err) {
        len = (object && object.length) || 0;
        i = (+from) || 0;
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
      each(object, function(ov, op) {
        if (!passed && argn >= 3 && from !== op) {
          return;
        } else {
          passed = true;
        }
        if (ov === subject) {
          result = op;
        }
      });
    } else if (object != null) {
      try {
        val = (object.toString && object.toString()) || String(object);
        result = StringProto.indexOf.apply(val, arrayize(args, 1));
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
   * @return {Number|String}          Return the index of result, or -1.
   * @type Function
   * @function
   * @static
   * @public
   */
  lastIndexOf : function(object, subject, from) {
    var result = -1, i, len,  key, val, passed, pairs,
        args = arguments,
        arrayLike  = object && isArrayLike(object),
        objectLike = object && !arrayLike && isObject(object);
    if (arrayLike) {
      try {
        if (PotSystem.isBuiltinArrayLastIndexOf) {
          i = lastIndexOf.apply(object, arrayize(args, 1));
          if (isNumeric(i)) {
            result = i;
          } else {
            throw i;
          }
        } else {
          throw i;
        }
      } catch (err) {
        len = (object && object.length) || 0;
        i = (+from);
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
      each(object, function(ov, op) {
        pairs[pairs.length] = [op, ov];
        if (ov === subject) {
          result = op;
        }
        if (op === from) {
          passed = true;
          throw PotStopIteration;
        }
      });
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
        result = StringProto.lastIndexOf.apply(val, arrayize(args, 1));
      } catch (e) {
        result = -1;
      }
    } else {
      result = -1;
    }
    return result;
  }
});

// Update methods for reference.
Pot.update({
  toIter : Iter.toIter
});

//-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
// Update the Pot.Deferred object for iterators.

// Extends the Pot.Deferred object for iterators with speed.
update(PotTmp, {
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
        me.iterateSpeed = (this && this.iterateSpeed) || Deferred.iterate;
        return Deferred.begin(function() {
          var d = new Deferred();
          iter.method.apply(me, args).then(function(res) {
            d.begin(res);
          }, function(err) {
            d.raise(err);
          });
          return d;
        });
      };
      update(Deferred, o);
      Deferred.extendSpeeds(Deferred, iter.NAME, function(opts) {
        var me = {}, args = arrayize(arguments, 1);
        me.iterateSpeed = Deferred.iterate[opts.speedName];
        return Deferred.begin(function() {
          var d = new Deferred();
          iter.method.apply(me, args).then(function(res) {
            d.begin(res);
          }, function(err) {
            d.raise(err);
          });
          return d;
        });
      }, LightIterator.speeds);
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
          var d = new Deferred();
          args = iter.args(value, args);
          iter.method.apply(iter.context, args).ensure(function(res) {
            extendDeferredOptions(d, options);
            if (isError(res)) {
              d.raise(res);
            } else {
              d.begin(res);
            }
          });
          return d;
        });
      };
      update(Deferred.fn, o);
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
        Deferred.extendSpeeds(Deferred.fn, iter.NAME, function(opts) {
          var args = arrayize(arguments, 1),
              iterable = sp.methods(opts.speedName),
              options  = update({}, this.options);
          return this.then(function(value) {
            var d = new Deferred();
            args = iter.args(value, args);
            iterable.iter.apply(iterable.context, args).ensure(function(res) {
              extendDeferredOptions(d, options);
              if (isError(res)) {
                d.raise(res);
              } else {
                d.begin(res);
              }
            });
            return d;
          });
        }, LightIterator.speeds);
      }
    });
  },
  /**
   * @private
   * @ignore
   */
  createSyncIterator : function(creator) {
    var methods, construct,
        /**@ignore*/
        create = function(speed) {
          var key = speed;
          if (!key) {
            each(LightIterator.speeds, function(v, k) {
              if (v === LightIterator.defaults.speed) {
                key = k;
                throw PotStopIteration;
              }
            });
          }
          return creator(key);
        };
    construct = create();
    methods = {};
    each(LightIterator.speeds, function(v, k) {
      methods[k] = create(k);
    });
    return update(construct, methods);
  }
});

// Create iterators to Pot.Deferred.
PotTmp.createIterators([{
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
  method : Iter.map
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
  method : Iter.filter
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
  method : Iter.reduce
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
  method : Iter.every
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
  method : Iter.some
}]);

// Create iterators to Pot.Deferred.prototype.
PotTmp.createProtoIterators([{
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
  method : Deferred.forEach,
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
  iterable : Deferred.forEach,
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
  method : Deferred.repeat,
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
  iterable : Deferred.repeat,
  /**
   * @ignore
   */
  args : function(arg, args) {
    if (isNumeric(arg)) {
      return [arg - 0].concat(args);
    }
    if (arg && isNumber(arg.length)) {
      return [arg.length].concat(args);
    }
    if (arg && isObject(arg) &&
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
  method : Deferred.forEver,
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
  iterable : Deferred.forEver,
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
  method : Deferred.iterate,
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
  iterable : Deferred.iterate,
  /**
   * @ignore
   */
  args : function(arg, args) {
    return [arg].concat(args);
  }
}, {
  /**
   * Collect the object key and value and make array as items format.
   *
   *
   * @example
   *   var obj = {foo: 1, bar: 2, baz: 3};
   *   var d = new Deferred();
   *   d.items().then(function(res) {
   *     debug(res);
   *     // @results [['foo', 1], ['bar', 2], ['baz', 3]]
   *   }).begin(obj);
   *
   *
   * @example
   *   var array = ['foo', 'bar', 'baz'];
   *   var d = new Deferred();
   *   d.items().then(function(res) {
   *     debug(res);
   *     // @results [[0, 'foo'], [1, 'bar'], [2, 'baz']]
   *   }).begin(array);
   *
   *
   * @example
   *   // Example for using callback.
   *   var arr = ['foo', 'bar', 'baz'];
   *   var func = function(item) {
   *     return '(' + item[0] + ')' + item[1];
   *   };
   *   var d = new Deferred();
   *   d.items(func).then(function(res) {
   *     debug(res);
   *     // @results ['(0)foo', '(1)bar', '(2)baz']
   *   }).begin(arr);
   *
   *
   * @example
   *   // Example for using callback.
   *   var obj = {foo: 1, bar: 2, baz: 3};
   *   var func = function(item) {
   *     return [item[0] + '::' + item[1]];
   *   };
   *   var d = new Deferred();
   *   d.items(func).then(function(res) {
   *     debug(res);
   *     // @results [['foo::1'], ['bar::2'], ['baz::3']]
   *   }).begin(obj);
   *
   *
   * @param  {Function}     (callback)  (Optional) Callback function.
   *                                      function({Array} item[, object])
   *                                        this == `context`.
   * @param  {*}            (context)   (Optional) Object to use
   *                                      as `this` when executing callback.
   * @return {Array}                    The collected items as an array.
   *
   * @name  Pot.Deferred.prototype.items
   * @class
   * @public
   *
   * @property {Function} limp   Iterates "items" loop with slowest speed.
   * @property {Function} doze   Iterates "items" loop with slower speed.
   * @property {Function} slow   Iterates "items" loop with slow speed.
   * @property {Function} normal Iterates "items" loop with default speed.
   * @property {Function} fast   Iterates "items" loop with fast speed.
   * @property {Function} rapid  Iterates "items" loop with faster speed.
   * @property {Function} ninja  Iterates "items" loop with fastest speed.
   */
  NAME : 'items',
  /**
   * @ignore
   */
  method : Deferred.items,
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
  iterable : Deferred.items,
  /**
   * @ignore
   */
  args : function(arg, args) {
    return [arg].concat(args);
  }
}, {
  /**
   * Create a new array which has the elements at
   *   position ith of the provided arrays.
   * This function is handled as seen from the longitudinal for array
   *   that is similar to the zip() function in Python.
   *
   * <pre>
   * Example:
   *
   *   arguments:  [[1, 2, 3],
   *                [4, 5, 6]]
   *
   *   results:    [[1, 4],
   *                [2, 5],
   *                [3, 6]]
   * </pre>
   *
   *
   * @link http://docs.python.org/library/functions.html#zip
   *
   *
   * @example
   *   var d = new Deferred();
   *   d.then(function() {
   *     return [[1, 2, 3], [4, 5, 6]];
   *   }).zip().then(function(res) {
   *     debug(res);
   *     // @results
   *     //     [[1, 4], [2, 5], [3, 6]]
   *     //
   *   }).begin();
   *
   *
   * @example
   *   var d = new Deferred();
   *   d.then(function() {
   *     return [[1, 2, 3], [1, 2, 3, 4, 5]];
   *   }).zip().then(function(res) {
   *     debug(res);
   *     // @results
   *     //     [[1, 1], [2, 2], [3, 3]]
   *     //
   *   }).begin();
   *
   *
   * @example
   *   var d = new Deferred();
   *   d.then(function() {
   *     return [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11]];
   *   }).zip().then(function(res) {
   *     debug(res);
   *     // @results
   *     //     [[1, 4, 7, 10], [2, 5, 8, 11]]
   *     //
   *   }).begin();
   *
   *
   * @example
   *   begin(function() {
   *     return ['hoge'];
   *   }).zip().then(function(res) {
   *     debug(res);
   *     // @results
   *     //     [['hoge']]
   *     //
   *   });
   *
   *
   * @example
   *   begin(function() {
   *     return [[1], [2], [3]];
   *   }).zip().then(function(res) {
   *     debug(res);
   *     // @results
   *     //     [[1, 2, 3]]
   *     //
   *   });
   *
   *
   * @example
   *   begin(function() {
   *     return [[1, 2, 3], ['foo', 'bar', 'baz'], [4, 5]];
   *   }).zip().then(function(res) {
   *     debug(res);
   *     // @results
   *     //     [[1, 'foo', 4], [2, 'bar', 5]]
   *     //
   *   });
   *
   *
   * @example
   *   var callback = function(items) { return items[0] + items[1]; };
   *   begin(function() {
   *     return [[1, 2, 3], [4, 5, 6]];
   *   }).zip(callback).then(function(res) {
   *     debug(res);
   *     // @results [5, 7, 9]
   *   });
   *
   *
   * @param  {Function} (callback)  (Optional) Callback function.
   *                                  function({Array} items[, {*} object])
   *                                    this == `context`.
   * @param  {*}        (context)   (Optional) Object to use
   *                                  as `this` when executing callback.
   * @return {Array}                A new array of arrays created from
   *                                  provided objects.
   *
   * @name  Pot.Deferred.prototype.zip
   * @class
   * @public
   *
   * @property {Function} limp   Iterates "zip" loop with slowest speed.
   * @property {Function} doze   Iterates "zip" loop with slower speed.
   * @property {Function} slow   Iterates "zip" loop with slow speed.
   * @property {Function} normal Iterates "zip" loop with default speed.
   * @property {Function} fast   Iterates "zip" loop with fast speed.
   * @property {Function} rapid  Iterates "zip" loop with faster speed.
   * @property {Function} ninja  Iterates "zip" loop with fastest speed.
   */
  NAME : 'zip',
  /**
   * @ignore
   */
  method : Deferred.zip,
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
  iterable : Deferred.zip,
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
  method : Iter.map,
  /**
   * @ignore
   */
  context : {iterateSpeed : Deferred.iterate},
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
  method : Iter.filter,
  /**
   * @ignore
   */
  context : {iterateSpeed : Deferred.iterate},
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
  method : Iter.reduce,
  /**
   * @ignore
   */
  context : {iterateSpeed : Deferred.iterate},
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
  method : Iter.every,
  /**
   * @ignore
   */
  context : {iterateSpeed : Deferred.iterate},
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
  method : Iter.some,
  /**
   * @ignore
   */
  context : {iterateSpeed : Deferred.iterate},
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

createSyncIterator = PotTmp.createSyncIterator;

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
  map : createSyncIterator(function(speedKey) {
    return function() {
      var context = {iterateSpeedSync : Pot.iterate[speedKey]};
      return Iter.map.apply(context, arguments);
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
  filter : createSyncIterator(function(speedKey) {
    return function() {
      var context = {iterateSpeedSync : Pot.iterate[speedKey]};
      return Iter.filter.apply(context, arguments);
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
  reduce : createSyncIterator(function(speedKey) {
    return function() {
      var context = {iterateSpeedSync : Pot.iterate[speedKey]};
      return Iter.reduce.apply(context, arguments);
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
  every : createSyncIterator(function(speedKey) {
    return function() {
      var context = {iterateSpeedSync : Pot.iterate[speedKey]};
      return Iter.every.apply(context, arguments);
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
  some : createSyncIterator(function(speedKey) {
    return function() {
      var context = {iterateSpeedSync : Pot.iterate[speedKey]};
      return Iter.some.apply(context, arguments);
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
    return Iter.range.apply(null, arguments);
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
   * @param  {*}              subject A subject object.
   * @param  {*}              (from)  (Optional) The index at
   *                                    which to begin the search.
   *                                  Defaults to 0.
   * @return                          Return the index of result, or -1.
   * @function
   * @static
   * @public
   */
  indexOf : function() {
    return Iter.indexOf.apply(null, arguments);
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
   * @param  {*}              subject A subject object.
   * @param  {*}             (from)   (Optional) The index at which to
   *                                    start searching backwards.
   *                                  Defaults to the array's length.
   * @return                          Return the index of result, or -1.
   * @function
   * @static
   * @public
   */
  lastIndexOf : function() {
    return Iter.lastIndexOf.apply(null, arguments);
  }
});

update(PotInternal, {
  defineDeferrater : createSyncIterator
});

// Definition of deferreed function.
(function() {
  /**@ignore*/
  var Deferrizer = function(func) {
    return new Deferrizer.prototype.init(func);
  },
  SPEED = buildSerial({NAME : '.\u0000[~`{{*@:SPEED:@*}}`~]\u0001'}),
  CACHE = {},
  CACHE_COUNT = 0,
  CACHE_LIMIT = 0x2000;
  Deferrizer.prototype = update(Deferrizer.prototype, {
    /**
     * @private
     * @ignore
     * @internal
     */
    constructor : Deferrizer,
    /**
     * @private
     * @ignore
     */
    id : PotInternal.getMagicNumber(),
    /**
     * @ignore
     * @private
     */
    func : null,
    /**
     * @ignore
     * @private
     */
    code : null,
    /**
     * @ignore
     * @private
     */
    tokens : [],
    /**
     * @ignore
     * @private
     */
    uniqs : {},
    /**
     * @ignore
     * @private
     */
    tails : [],
    /**
     * @ignore
     * @private
     */
    iteration : {},
    /**
     * Initialize properties.
     *
     * @private
     * @ignore
     */
    init : function(func) {
      this.func = func;
      this.code = this.toCode(this.func);
      this.tokens = [];
      this.iteration = {};
      this.tails = [];
      return this;
    },
    /**
     * Execute.
     *
     * @private
     * @ignore
     */
    execute : function() {
      var that = this, result = '';
      if (this.code) {
        if (this.code in CACHE) {
          result = CACHE[this.code];
        } else {
          this.uniqs = {};
          each('key val ret rev err nxt'.split(' '), function(v) {
            that.uniqs[v] = that.generateUniqName({
              NAME : '$_' + v + '_'
            });
          });
          this.tokens = this.tokenize(this.code);
          if (!this.hasIteration(this.tokens)) {
            result = this.func;
          } else {
            this.parseLoop();
            result = this.deferrizeFunction();
            if (result) {
              if (CACHE_COUNT < CACHE_LIMIT) {
                CACHE[this.code] = result;
                CACHE_COUNT++;
              }
            }
          }
        }
      }
      return result;
    },
    /**
     * @internal
     * @private
     * @ignore
     */
    hasIteration : function(tokens) {
      var result = false, i, len, token;
      if (tokens) {
        len = tokens.length;
        for (i = 0; i < len; i++) {
          token = tokens[i];
          if (token === 'for' || token === 'while' || token === 'do') {
            result = true;
            break;
          }
        }
      }
      return result;
    },
    /**
     * @internal
     * @private
     * @ignore
     */
    toCode : function(func) {
      return Pot.getFunctionCode(func);
    },
    /**
     * @internal
     * @private
     * @ignore
     */
    isWord : (function() {
      var RE = {
        SPACE : /\s/,
        WORDS : /[$\w\u0100-\uFFFF]/
      };
      return function(c) {
        return c != null && !RE.SPACE.test(c) && RE.WORDS.test(c);
      };
    }()),
    /**
     * @internal
     * @private
     * @ignore
     */
    isNL : (function() {
      var RE = /\r\n|\r|\n/;
      return function(c) {
        return c != null && RE.test(c);
      };
    }()),
    /**
     * @internal
     * @private
     * @ignore
     */
    format : function(/*format[, ...args]*/) {
      var args = arrayize(arguments);
      return args[0].replace(/#(\d+)/g, function(a, i) {
        return args[+i];
      });
    },
    /**
     * @internal
     * @private
     * @ignore
     */
    joinTokens : function(tokens) {
      var result = [], len = tokens.length,
          prev, prevSuf, pre, suf, i, token;
      for (i = 0; i < len; i++) {
        token = tokens[i];
        if (!prev) {
          result[result.length] = token;
        } else {
          pre = '';
          suf = '';
          if (token === '+'  || token === '-'  ||
              token === '++' || token === '--' ||
              token === 'in'
          ) {
            pre = ' ';
            suf = ' ';
          } else if (this.isWord(prev.slice(-1)) &&
                     this.isWord(token.charAt(0))) {
            pre = ' ';
          }
          if (prevSuf === ' ') {
            pre = '';
          }
          result[result.length] = pre + token + suf;
        }
        prev = token;
        prevSuf = suf;
      }
      return result.join('');
    },
    /**
     * @internal
     * @private
     * @ignore
     */
    toEnd : function(code) {
      var s;
      if (isArray(code)) {
        s = this.joinTokens(code);
      } else {
        s = stringify(code);
      }
      if (trim(s).slice(-1) === ';') {
        return s;
      }
      return s ? s + ';' : s;
    },
    /**
     * @internal
     * @private
     * @ignore
     */
    generateUniqName : function(prefix) {
      var result;
      do {
        result = buildSerial(prefix || Pot, '');
      } while (~Pot.indexOf(this.tokens, result));
      return result;
    },
    /**
     * @internal
     * @private
     * @ignore
     */
    tokenize : (function() {
      var RE = {
        TOKEN : new RegExp(
          '(' + '^\\s*function\\b[^{]*[{]' +            // function prefix
          '|' + '[}][^}]*$' +                           // function suffix
          '|' + '/[*][\\s\\S]*?[*]/' +                  // multiline comment
          '|' + '/{2,}[^\\r\\n]*(?:\\r\\n|\\r|\\n|)' +  // single line comment
          '|' + '"(?:\\\\[\\s\\S]|[^"\\r\\n\\\\])*"' +  // string literal
          '|' + "'(?:\\\\[\\s\\S]|[^'\\r\\n\\\\])*'" +  // string literal
          '|' + '/(?![*])(?:\\\\.|[^/\\r\\n\\\\])+/' +
                '[gimy]{0,4}' +
          '|' + '<([^\\s>]*)[^>]*>[\\s\\S]*?</\\2>' +   // e4x
          '|' + '>>>=?|<<=|===|!==|>>=' +               // operators
          '|' + '[+][+](?=[+])|[-][-](?=[-])' +
          '|' + '[=!<>*+/&|^-]=' +
          '|' + '[&][&]|[|][|]|[+][+]|[-][-]|<<|>>' +
          '|' + '0(?:[xX][0-9a-fA-F]+|[0-7]+)' +        // number literal
          '|' + '\\d+(?:[.]\\d+)?(?:[eE][+-]?\\d+)?' +
          '|' + '[1-9]\\d*' +
          '|' + '[-+/%*=&|^~<>!?:,;@()\\\\[\\].{}]' +   // operator
          '|' + '(?![\\r\\n])\\s+' +                    // white space
          '|' + '(?:\\r\\n|\\r|\\n)' +                  // nl
          '|' + '[^\\s+/%*=&|^~<>!?:,;@()\\\\[\\].{}\'"-]+' + // token
          ')',
          'g'
        ),
        NOTSPACE : /[\S\r\n]/,
        COMMENTS : /^\/{2,}[\s\S]*$|^\/[*][\s\S]*?[*]\/$/
      };
      return function(func) {
        var r = [], m, token, s = this.toCode(func);
        if (s) {
          RE.TOKEN.lastIndex = 0;
          while ((m = RE.TOKEN.exec(s)) != null) {
            token = m[1];
            if (!RE.NOTSPACE.test(token) || RE.COMMENTS.test(token)) {
              continue;
            } else {
              r[r.length] = token;
            }
          }
        }
        return r;
      };
    }()),
    /**
     * @internal
     * @private
     * @ignore
     */
    parseLoop : function() {
      var result, max = 0, loops = [], offsets = [], index = 0, nest = 0,
          level = 0, inLoop, i, token, len = this.tokens.length;
      for (i = 0; i < len; i++) {
        token = this.tokens[i];
        switch (token) {
          case 'for':
          case 'while':
          case 'do':
              if (!inLoop) {
                inLoop = {
                  token : token,
                  org : {
                    level : level,
                    nest  : nest
                  },
                  cur : {
                    level : level,
                    nest  : nest
                  }
                };
              }
              break;
          case '(':
              nest++;
              if (inLoop) {
                inLoop.cur.nest++;
              }
              break;
          case ')':
              nest--;
              if (inLoop) {
                if (--inLoop.cur.nest === inLoop.org.nest &&
                    inLoop.cur.level === inLoop.org.level &&
                    inLoop.token === 'do'
                ) {
                  inLoop.last = true;
                }
              }
              break;
          case '{':
              level++;
              if (inLoop) {
                inLoop.cur.level++;
              }
              break;
          case '}':
              level--;
              if (inLoop) {
                if (--inLoop.cur.level === inLoop.org.level &&
                    inLoop.cur.nest === inLoop.org.nest &&
                    inLoop.token !== 'do'
                ) {
                  inLoop.last = true;
                }
              }
              break;
        }
        if (inLoop) {
          if (!(index in loops)) {
            loops[index] = [];
            offsets[index] = {
              start : i
            };
          }
          loops[index][loops[index].length] = token;
          if (inLoop.last) {
            offsets[index].end = i;
            inLoop = null;
            index++;
          }
        }
      }
      len = loops.length;
      for (i = 0; i < len; i++) {
        if (loops[i].length > max) {
          max = i;
        }
      }
      this.iteration = {
        loops : loops[max],
        start : offsets[max].start,
        end   : offsets[max].end
      };
      return result;
    },
    /**
     * @internal
     * @private
     * @ignore
     */
    deferrizeLoop : function() {
      var tokens = this.iteration.loops,
          state = tokens.shift();
      switch (state) {
        case 'for'   : return this.parseFor(tokens);
        case 'while' : return this.parseWhile(tokens);
        case 'do'    : return this.parseDoWhile(tokens);
      }
    },
    /**
     * @internal
     * @private
     * @ignore
     */
    deferrizeFunction : function() {
      var result, next, looped, token, i, len = this.tokens.length,
          key = 'before', enclose,
          states = {
            level : 0,
            block : 0
          },
          parts = {
            before : [],
            loop   : [],
            after  : [],
            result : []
          },
          /**@ignore*/
          openBlock = function(k) {
            if (!states[k]) {
              states[k] = {
                block : states.block,
                level : states.level
              };
            }
          },
          /**@ignore*/
          closeBlock = function(kv) {
            each(kv ? arrayize(kv) : ['func', 'cond'], function(k) {
              if (states[k] &&
                  states[k].block === states.block &&
                  states[k].level === states.level) {
                states[k] = null;
              }
            });
          };
      for (i = 1; i < len - 1; i++) {
        if (i >= this.iteration.start &&
            i <= this.iteration.end
        ) {
          if (!looped) {
            looped = true;
            i = this.iteration.end - 1;
            parts.loop = arrayize(this.deferrizeLoop());
            key = 'after';
            if (states.cond) {
              enclose = true;
            }
          }
          continue;
        }
        token = this.tokens[i];
        next = this.tokens[i + 1];
        switch (token) {
          case '{':
              states.block++;
              break;
          case '}':
              states.block--;
              closeBlock();
              break;
          case '(':
              states.level++;
              break;
          case ')':
              states.level--;
              if (states.cond && states.cond.expr && next === '{') {
                states.cond.expr = null;
                closeBlock('func');
              } else {
                closeBlock();
              }
              break;
          case ';':
              closeBlock('result');
              break;
          case 'function':
              openBlock('func');
              break;
          case 'if':
              openBlock('cond');
              states.cond.expr = true;
              break;
          case 'return':
              if (!states.func && !states.result) {
                if (!next || next === ';' || this.isNL(next)) {
                  token = this.format('#1 #2=void 0#3',
                    token,
                    this.uniqs.ret,
                    (next === ';' || this.isNL(next)) ? '' : ';'
                  );
                } else {
                  token = this.format('#1(#2!==#3)?#2:#2=',
                    token,
                    this.uniqs.ret,
                    this.uniqs.rev
                  );
                }
                parts.result = [];
                openBlock('result');
              }
              break;
          default:
              if (states.result && this.isNL(token)) {
                closeBlock('result');
              }
              break;
        }
        parts[key][parts[key].length] = token;
        if (states.result) {
          parts.result[parts.result.length] = token;
        }
      }
      result = this.format(
        '#1' +
        'var #2={},#3=#2,#4={};' +
        'return Pot.Deferred.begin(function(){' +
            '#5' +
            '#6' +
            '#9' +
          '});' +
          '#7' +
          '#8' +
        '}).then(function(r){' +
          'return(#2===#3)?r:#2;' +
        '});' +
        '#10',
        this.tokens.shift(),
        this.uniqs.ret,
        this.uniqs.rev,
        this.uniqs.nxt,
        this.toEnd(this.joinTokens(parts.before)),
        this.joinTokens(parts.loop),
        this.joinTokens(this.tails),
        this.joinTokens(enclose ? parts.after  : []),
        this.joinTokens(enclose ? parts.result : parts.after),
        this.tokens.pop()
      );
      return result;
    },
    /**
     * @internal
     * @private
     * @ignore
     */
    parseWhile : function(tokens) {
      var result = '', level = 0, nest = 0, started = false,
          prev, next, skip, key = 'cond', inLoop, token, i,
          len = tokens.length, isEnd = false,
          states = {
            cond : [],
            body : []
          };
      for (i = 0; i < len; i++) {
        token = tokens[i];
        next = tokens[i + 1];
        skip = false;
        switch (token) {
          case '(':
              nest++;
              if (inLoop) {
                inLoop.cur.nest++;
              }
              if (i === 0 && nest === 1) {
                skip = true;
              }
              break;
          case ')':
              nest--;
              if (inLoop) {
                if (--inLoop.cur.nest === inLoop.org.nest &&
                    inLoop.cur.level === inLoop.org.level &&
                    inLoop.token === 'do'
                ) {
                  inLoop = null;
                }
              }
              if (!started && nest === 0 &&
                  level === 0 && next === '{') {
                skip = true;
              }
              break;
          case '{':
              level++;
              if (inLoop) {
                inLoop.cur.level++;
              }
              if (level === 1 && nest === 0 && prev === ')') {
                skip = true;
                started = true;
                key = 'body';
              }
              break;
          case '}':
              level--;
              if (inLoop) {
                if (--inLoop.cur.level === inLoop.org.level &&
                    inLoop.cur.nest === inLoop.org.nest &&
                    inLoop.token !== 'do'
                ) {
                  inLoop = null;
                }
              }
              if (started && nest === 0 && level === 0) {
                states.body.unshift(this.format(
                  'if(#1!==#2||!(#3)){' +
                    'throw Pot.StopIteration;' +
                  '}' +
                  'try{',
                  this.uniqs.ret,
                  this.uniqs.rev,
                  this.joinTokens(states.cond) || 'false'
                ));
                states.body.push(this.format(
                  '}catch(#1){' +
                    'if(Pot.isError(#1)||Pot.isStopIter(#1)){' +
                      'throw #1;' +
                    '}' +
                    'if(#1!==#2){' +
                      'throw #1;' +
                    '}' +
                  '}',
                  this.uniqs.err,
                  this.uniqs.nxt
                ));
                token += ').then(function(){';
                isEnd = true;
              }
              break;
          case 'for':
          case 'while':
          case 'do':
              inLoop = {
                token : token,
                org : {
                  level : level,
                  nest  : nest
                },
                cur : {
                  level : level,
                  nest  : nest
                }
              };
              break;
          case 'break':
              if (!inLoop && started && !this.isWord(next)) {
                token = 'throw Pot.StopIteration';
              }
              break;
          case 'continue':
              if (!inLoop && started && !this.isWord(next)) {
                token = 'throw ' + this.uniqs.nxt;
              }
              break;
          case 'return':
              if (started) {
                if (!next || next === ';' || this.isNL(next)) {
                  token = this.format('#1 #2=void 0#3',
                    token,
                    this.uniqs.ret,
                    (next === ';' || this.isNL(next)) ? '' : ';'
                  );
                } else {
                  token = this.format('#1 #2=',
                    token,
                    this.uniqs.ret
                  );
                }
              }
              break;
        }
        if (!skip) {
          states[key][states[key].length] = token;
        }
        prev = token;
      }
      result = '';
      if (!isEnd) {
        throw new Error("Parse error, expect 'while(...)'");
      }
      result = this.format(
        'return Pot.Deferred.forEver.#1(function(){' +
        '#2',
        SPEED,
        this.joinTokens(states.body)
      );
      return result;
    },
    /**
     * @internal
     * @private
     * @ignore
     */
    parseDoWhile : function(tokens) {
      var result = '', level = 0, nest = 0, prev, next, skip,
          key = 'body', inLoop, token, i, len = tokens.length, isEnd = false,
          states = {
            cond  : [],
            body  : [],
            after : []
          };
      for (i = 0; i < len; i++) {
        token = tokens[i];
        next = tokens[i + 1];
        skip = false;
        switch (token) {
          case '(':
              nest++;
              if (inLoop) {
                inLoop.cur.nest++;
              }
              if (level === 0 && nest === 1 && prev === 'while') {
                skip = true;
                key = 'cond';
              }
              break;
          case ')':
              nest--;
              if (inLoop) {
                if (--inLoop.cur.nest === inLoop.org.nest &&
                    inLoop.cur.level === inLoop.org.level &&
                    inLoop.token === 'do'
                ) {
                  inLoop = null;
                }
              }
              if (nest === 0 && level === 0 && key === 'cond') {
                skip = true;
              }
              break;
          case '{':
              level++;
              if (inLoop) {
                inLoop.cur.level++;
              }
              if (i === 0 && level === 1) {
                skip = true;
              }
              break;
          case '}':
              level--;
              if (inLoop) {
                if (--inLoop.cur.level === inLoop.org.level &&
                    inLoop.cur.nest === inLoop.org.nest &&
                    inLoop.token !== 'do'
                ) {
                  inLoop = null;
                }
              }
              if (nest === 0 && level === 0 && next === 'while') {
                isEnd = true;
                skip = true;
              }
              break;
          case 'while':
              if (level === 0 && nest === 0) {
                skip = true;
                break;
              }
              // FALLTHROUGH
          case 'for':
          case 'do':
              inLoop = {
                token : token,
                org : {
                  level : level,
                  nest  : nest
                },
                cur : {
                  level : level,
                  nest  : nest
                }
              };
              break;
          case 'break':
              if (!inLoop && !this.isWord(next)) {
                token = 'throw Pot.StopIteration';
              }
              break;
          case 'continue':
              if (!inLoop && !this.isWord(next)) {
                token = 'throw ' + this.uniqs.nxt;
              }
              break;
          case 'return':
              if (!next || next === ';' || this.isNL(next)) {
                token = this.format('#1 #2=void 0#3',
                  token,
                  this.uniqs.ret,
                  (next === ';' || this.isNL(next)) ? '' : ';'
                );
              } else {
                token = this.format('#1 #2=',
                  token,
                  this.uniqs.ret
                );
              }
              break;
        }
        if (!skip) {
          states[key][states[key].length] = token;
        }
        prev = token;
      }
      result = '';
      if (!isEnd) {
        throw new Error("Parse error, expect 'do...while()'");
      }
      states.body.unshift(this.format(
        'if(#1!==#2){' +
          'throw Pot.StopIteration;' +
        '}' +
        'try{',
        this.uniqs.ret,
        this.uniqs.rev
      ));
      states.body.push(this.format(
        '}catch(#1){' +
          'if(Pot.isError(#1)||Pot.isStopIter(#1)){' +
            'throw #1;' +
          '}' +
          'if(#1!==#2){' +
            'throw #1;' +
          '}' +
        '}finally{' +
          'if(!(#3)){' +
            'throw Pot.StopIteration;' +
          '}' +
        '}' +
        '}).then(function(){',
        this.uniqs.err,
        this.uniqs.nxt,
        this.joinTokens(states.cond) || 'false'
      ));
      result = this.format(
        'return Pot.Deferred.forEver.#1(function(){' +
        '#2',
        SPEED,
        this.joinTokens(states.body)
      );
      return result;
    },
    /**
     * @internal
     * @private
     * @ignore
     */
    parseFor : function(tokens) {
      var result = '', level = 0, nest = 0, isInOrOf = null, started = false,
          prev, next, skip, key = 'before', varType, inLoop, i, len, token,
          isEnd = false,
          states = {
            prefix : [],
            suffix : [],
            before : [],
            cond   : [],
            after  : [],
            key    : [],
            target : [],
            body   : []
          };
      len = tokens.length;
      for (i = 0; i < len; i++) {
        token = tokens[i];
        next = tokens[i + 1];
        skip = false;
        switch (token) {
          case '(':
              nest++;
              if (inLoop) {
                inLoop.cur.nest++;
              }
              if (i === 0 && nest === 1) {
                skip = true;
              }
              break;
          case ')':
              nest--;
              if (inLoop) {
                if (--inLoop.cur.nest === inLoop.org.nest &&
                    inLoop.cur.level === inLoop.org.level &&
                    inLoop.token === 'do'
                ) {
                  inLoop = null;
                }
              }
              if (!started && nest === 0 &&
                  level === 0 && next === '{') {
                skip = true;
              }
              break;
          case '{':
              level++;
              if (inLoop) {
                inLoop.cur.level++;
              }
              if (level === 1 && nest === 0 && prev === ')') {
                skip = true;
                started = true;
                key = 'body';
              }
              break;
          case '}':
              level--;
              if (inLoop) {
                if (--inLoop.cur.level === inLoop.org.level &&
                    inLoop.cur.nest === inLoop.org.nest &&
                    inLoop.token !== 'do'
                ) {
                  inLoop = null;
                }
              }
              if (started && nest === 0 && level === 0) {
                states.body.unshift(this.format(
                  'if(#1!==#2){' +
                    'throw Pot.StopIteration;' +
                  '}' +
                  'try{',
                  this.uniqs.ret,
                  this.uniqs.rev
                ));
                if (states.suffix.length) {
                  states.body.push(
                    this.toEnd(this.joinTokens(states.suffix))
                  );
                }
                states.body.push(this.format(
                  '}catch(#1){' +
                    'if(Pot.isError(#1)||Pot.isStopIter(#1)){' +
                      'throw #1;' +
                    '}' +
                    'if(#1!==#2){' +
                      'throw #1;' +
                    '}' +
                  '}finally{' +
                    '#3' +
                  '}',
                  this.uniqs.err,
                  this.uniqs.nxt,
                  this.toEnd(this.joinTokens(states.after))
                ));
                token += ').then(function(){';
                isEnd = true;
              }
              break;
          case 'each':
              if (i === 0) {
                throw new Error("Not supported 'for each'");
              }
              break;
          case 'in':
          case 'of':
              if (!started && isInOrOf === null &&
                  nest === 1 && level === 0
              ) {
                skip = true;
                isInOrOf = true;
                if (states.before.length > 2) {
                  throw new Error(
                    "Invalid keys, expect 'for(var [...] in ...);'"
                  );
                }
                if (varType) {
                  states.before.push(';');
                  unshift.apply(states.prefix, states.before);
                  states.before.shift();
                  states.before.pop();
                  if (varType === 'let') {
                    states.prefix.unshift('{');
                    this.tails.push('}');
                  }
                }
                states.before.push('=' + this.uniqs.key);
                states.before.push(';');
                states.key = states.before;
                unshift.apply(states.body, states.key);
                key = 'target';
              }
              break;
          case 'var':
          case 'let':
              if (!varType && i === 1 && nest === 1) {
                varType = token;
              }
              break;
          case ',':
              if (!started && nest === 1 && level === 0 &&
                  !varType &&
                  (key === 'before' || key === 'after')
              ) {
                token = ';';
              }
              break;
          case ';':
              if (!started && nest === 1 && level === 0) {
                skip = true;
                if (isInOrOf === null) {
                  isInOrOf = false;
                }
                if (key === 'before') {
                  key = 'cond';
                  states.prefix.push(
                    this.toEnd(this.joinTokens(states.before))
                  );
                  if (varType === 'let') {
                    states.prefix.unshift('{');
                    this.tails.push('}');
                  }
                } else if (key === 'cond') {
                  key = 'after';
                  if (states.cond.length) {
                    states.cond.unshift('if(');
                    states.cond.push('){');
                    states.suffix.push('}else{throw Pot.StopIteration;}');
                  }
                  push.apply(states.body, states.cond);
                }
              }
              break;
          case 'for':
          case 'while':
          case 'do':
              inLoop = {
                token : token,
                org : {
                  level : level,
                  nest  : nest
                },
                cur : {
                  level : level,
                  nest  : nest
                }
              };
              break;
          case 'break':
              if (!inLoop && started && !this.isWord(next)) {
                token = 'throw Pot.StopIteration';
              }
              break;
          case 'continue':
              if (!inLoop && started && !this.isWord(next)) {
                token = 'throw ' + this.uniqs.nxt;
              }
              break;
          case 'return':
              if (started) {
                if (!next || next === ';' || this.isNL(next)) {
                  token = this.format('#1 #2=void 0#3',
                    token,
                    this.uniqs.ret,
                    (next === ';' || this.isNL(next)) ? '' : ';'
                  );
                } else {
                  token = this.format('#1 #2=',
                    token,
                    this.uniqs.ret
                  );
                }
              }
              break;
        }
        if (!skip) {
          states[key][states[key].length] = token;
        }
        prev = token;
      }
      result = '';
      if (!isEnd) {
        throw new Error("Parse error, expect 'for(...)'");
      }
      if (isInOrOf) {
        result = this.format(
          '#1return Pot.Deferred.forEach.#2(#3,function(#4,#5){' +
          '#6',
          this.toEnd(this.joinTokens(states.prefix)),
          SPEED,
          this.joinTokens(states.target),
          this.uniqs.val,
          this.uniqs.key,
          this.joinTokens(states.body)
        );
      } else {
        result = this.format(
          '#1return Pot.Deferred.forEver.#2(function(){' +
          '#3',
          this.toEnd(this.joinTokens(states.prefix)),
          SPEED,
          this.joinTokens(states.body)
        );
      }
      return result;
    }
  });
  Deferrizer.prototype.init.prototype = Deferrizer.prototype;
  update(PotInternal, {
    /**
     * @lends Pot.Internal
     */
    /**
     * @type Function
     * @internal
     * @ignore
     */
    deferrate : function(func) {
      return (new Deferrizer(func)).execute();
    }
  });
  // Update Pot/Pot.Deferred.
  update(Deferred, {
    /**
     * @lends Pot.Deferred
     */
    /**
     * Create new defer function with speeds from static function.
     * That returns a new instance of Pot.Deferred that
     *  has already ".begin()" called.
     * This function works like 'deferrize'.
     * This function will redefine the function that converts the
     *  synchronous loop block (i.e. for, for-in, do, while) to the
     *  asynchronous iteration by Pot.Deferred.xxx.
     *
     *
     * @example
     *   var toCharCode = function(string) {
     *     var result = [];
     *     for (var i = 0; i < string.length; i++) {
     *       result.push(string.charCodeAt(i));
     *     }
     *     return result;
     *   };
     *   var toCharCodeDefer = Pot.deferreed(toCharCode);
     *   // Note:
     *   //  toCharCodeDefer like below.
     *   //
     *   //  function(string) {
     *   //    var result = [];
     *   //    return Pot.Deferred.repeat(string.length, function(i) {
     *   //      result.push(string.charCodeAt(i));
     *   //    }).then(function() {
     *   //      return result;
     *   //    });
     *   //  };
     *   //
     *   toCharCodeDefer('abc').then(function(res) {
     *     Pot.debug(res); // @results [97, 98, 99]
     *   });
     *   // Large string.
     *   var largeString = new Array(100000).join('abcdef');
     *   // Specify speed 'slow'.
     *   toCharCodeDefer.slow(largeString).then(function(res) {
     *     Pot.debug(res.length); // @results  599994
     *   });
     *
     *
     * @example
     *   // Compress/Decompress string by LZ77 algorithm.
     *   // http://polygon-planet.blogspot.com/2011/02/lz77javascript.html
     *   var TinyLz77 = {
     *     // compress (synchronous)
     *     compress : function(s) {
     *       var a = 53300, b, c, d, e, f, g = -1,
     *           h, i, r = [], x = String.fromCharCode;
     *       if (!s) {
     *         return '';
     *       }
     *       s = new Array(a--).join(' ') + s;
     *       while ((b = s.substr(a, 256))) {
     *         for (c = 2, i = b.length; c <= i; ++c) {
     *           d = s.substring(
     *               a - 52275,
     *               a + c - 1
     *           ).lastIndexOf(b.substring(0, c));
     *           if (!~d) {
     *             break;
     *           }
     *           e = d;
     *         }
     *         if (c === 2 || c === 3 && f === g) {
     *           f = g;
     *           h = s.charCodeAt(a++);
     *           r.push(
     *               x(h >> 8 & 255),
     *               x(h & 255)
     *           );
     *         } else {
     *           r.push(
     *               x((e >> 8 & 255) | 65280),
     *               x(e & 255),
     *               x(c - 3)
     *           );
     *           a += c - 1;
     *         }
     *       }
     *       return r.join('');
     *     },
     *     // decompress (synchronous)
     *     decompress : function(s) {
     *       var a = 53300, b = 0, c, d, e, f, g,
     *           h, r = new Array(a--).join(' '),
     *           x = String.fromCharCode;
     *       if (s && s.length) {
     *         do {
     *           c = s.charCodeAt(b++);
     *           if (c <= 255) {
     *             r += x((c << 8) | s.charCodeAt(b++));
     *           } else {
     *             e = ((c & 255) << 8) | s.charCodeAt(b++);
     *             f = e + s.charCodeAt(b++) + 2;
     *             h = r.slice(-52275);
     *             g = h.substring(e, f);
     *             if (g) {
     *               while (h.length < f) {
     *                 h += g;
     *               }
     *               r += h.substring(e, f);
     *             }
     *           }
     *         } while (b < s.length);
     *       }
     *       return r.slice(a);
     *     }
     *   };
     *   // create asynchronous iteration functions.
     *   var compressDefer   = Pot.deferreed(TinyLz77, 'compress');
     *   var decompressDefer = Pot.deferreed(TinyLz77, 'decompress');
     *   // original string.
     *   var string = 'foooooooooo baaaaaaaaaaaaar baaaaaaazzzzzzzzzzzz';
     *   Pot.debug(string.length); // 48
     *   // execute compress with asynchronous iterator.
     *   compressDefer(string).then(function(res) {
     *     Pot.debug(res.length); // 26
     *     return decompressDefer(res).then(function(res) {
     *       Pot.debug(res.length); // 48
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
     *                                      Returns new asynchronous
     *                                        function that has
     *                                        each speeds below.
     *                                      <pre>
     *                                      ----------------------------------
     *                                       method name |  speed
     *                                      ----------------------------------
     *                                       limp        :  slowest
     *                                       doze        :  slower
     *                                       slow        :  slow
     *                                       normal      :  normal (default)
     *                                       fast        :  fast
     *                                       rapid       :  faster
     *                                       ninja       :  fastest
     *                                      ----------------------------------
     *                                      You can control speed by
     *                                        specify key.
     *                                      e.g.
     *                                        var f = deferreed(func);
     *                                        f();      // normal
     *                                        f.slow(); // slow
     *                                      </pre>
     * @type   Function
     * @function
     * @public
     * @static
     */
    deferreed : function(object, method) {
      var result, func, context, err, code, proc;
      try {
        switch (arguments.length) {
          case 0:
              throw false;
          case 1:
              func = object;
              if (!isFunction(func)) {
                throw func;
              }
              proc = func;
              break;
          case 2:
          default:
              if (isObject(method)) {
                context = method;
                func    = object;
              } else {
                func    = method;
                context = object;
              }
              if (!isFunction(context[func])) {
                throw func;
              }
              proc = context[func];
              break;
        }
        if (!proc || !isFunction(proc) || Pot.isBuiltinMethod(proc)) {
          throw proc;
        }
        code = PotInternal.deferrate(proc);
        if (!code) {
          throw code;
        }
        if (code === proc) {
          result = Deferred.deferrize(proc);
        } else {
          if (!isString(code)) {
            throw code;
          }
          result = PotInternal.defineDeferrater(function(speedKey) {
            var c = code.replace(SPEED, speedKey),
                f = Pot.localEval(c, context);
            return function() {
              return f.apply(context, arguments);
            };
          });
        }
        if (!result || !isFunction(result)) {
          throw result;
        }
      } catch (e) {
        err = e;
        throw isError(err) ? err : new Error(err);
      }
      return result;
    }
  });
  // Refer Pot object.
  Pot.update({
    deferreed : Deferred.deferreed
  });
}());

delete PotTmp.createIterators;
delete PotTmp.createProtoIterators;
delete PotTmp.createSyncIterator;
}());
