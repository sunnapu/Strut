// Generated by CoffeeScript 1.2.1-pre
var callView, comparers;

define([], function() {
  var Bindings, middlewareDefaults;
  if (!$.event.special.destroyed) {
    $.event.special.destroyed = {
      remove: function(o) {
        if (o.handler) return o.handler();
      }
    };
  }
  middlewareDefaults = {
    toView: {},
    toModel: {}
  };
  return Bindings = (function() {

    Bindings.name = 'Bindings';

    /*
    		#	opts {
    		#		model: backbone model,
    		#		el: element
    		#		mapping: binding mapping
    		#		middleware: middleware funcs
    		#			toView: "selector": func
    		# 	}
    */


    function Bindings(opts) {
      var _this = this;
      this.model = opts.model;
      this.$el = opts.el instanceof $ ? opts.el : $(opts.el);
      this.middleware = opts.middleware || {};
      _.defaults(this.middleware, middlewareDefaults);
      this.$el.bind("destroyed", function() {
        return _this.dispose();
      });
      this._bind(opts.mapping);
    }

    Bindings.prototype.dispose = function() {
      return this.model.off(null, null, this);
    };

    Bindings.prototype.on = function() {};

    Bindings.prototype._bind = function(mapping) {
      var $target, actualSelector, binding, bindingObj, idx, selector, _results;
      _results = [];
      for (selector in mapping) {
        binding = mapping[selector];
        if (typeof binding === "object") {
          $target = this.$el.find(selector);
          _results.push(this._applyBinding($target, binding, {
            toView: this.middleware.toView[selector]
          }));
        } else {
          idx = selector.indexOf(" ");
          actualSelector = $.trim(selector.substring(idx));
          $target = this.$el.find(actualSelector);
          bindingObj = {
            fn: selector.substring(0, idx),
            field: binding
          };
          _results.push(this._applyBinding($target, bindingObj, {
            toView: this.middleware.toView[actualSelector]
          }));
        }
      }
      return _results;
    };

    Bindings.prototype._applyBinding = function($target, binding, middleware) {
      var field;
      field = binding.field;
      if (typeof this.model[field] === "function") {
        return this._bindToComputedProperty($target, binding, middleware);
      } else {
        console.log("Binding: " + field);
        return this.model.on("change:" + field, function(model, value) {
          if (middleware.toView != null) value = middleware.toView(value);
          return callView($target, binding.fn, value);
        });
      }
    };

    Bindings.prototype._bindToComputedProperty = function($target, binding, middleware) {
      var dependencies, field, fn, oldGet, value, _results,
        _this = this;
      dependencies = {};
      oldGet = this._replaceGet(dependencies);
      this.model[binding.field]();
      this._restoreGet(oldGet);
      fn = function(model, value) {
        value = _this.model[binding.field]();
        if (middleware.toView != null) value = middleware.toView(value);
        return callView($target, binding.fn, value);
      };
      _results = [];
      for (field in dependencies) {
        value = dependencies[field];
        _results.push(this.model.on("change:" + field, fn));
      }
      return _results;
    };

    Bindings.prototype._replaceGet = function(dependencies) {
      var oldGet,
        _this = this;
      oldGet = this.model.get;
      this.model.get = function(key) {
        var result;
        result = oldGet.apply(_this.model, arguments);
        dependencies[key] = true;
        return result;
      };
      return oldGet;
    };

    Bindings.prototype._restoreGet = function(oldGet) {
      return this.model.get = oldGet;
    };

    return Bindings;

  })();
});

callView = function($target, fn, value) {
  var comp, fnData, fnName, fnType, key, _i, _len, _results, _results2;
  fnType = typeof fn;
  if (Array.isArray(fn)) fnType = "array";
  switch (fnType) {
    case "string":
      return $target[fn](value);
    case "object":
      _results = [];
      for (key in fn) {
        fnData = fn[key];
        comp = comparers[key];
        if (comp(value)) {
          _results.push($target[fnData[0]].apply($target, fnData.slice(1, fnData.length)));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
      break;
    default:
      _results2 = [];
      for (_i = 0, _len = fn.length; _i < _len; _i++) {
        fnName = fn[_i];
        _results2.push($target[fnName](value));
      }
      return _results2;
  }
};

comparers = {
  "true": function(val) {
    return val === true;
  },
  "false": function(val) {
    return val === false;
  },
  truthy: function(val) {
    return val === true;
  },
  falsy: function(val) {
    return val === false;
  },
  exists: function(val) {
    return val != null;
  },
  missing: function(val) {
    return !(val != null);
  }
};

/*
	"attribute selector": "fieldName"  (where attribute is some jquery func: text, val, css, addClass, removeClass, etc.)
	well what if we want one func on true and another on false.. that is a common use case...

	#alternative:

		"selector": 
			fn: "jQuery fn to apply"  (what about ender and so on?)
			field: "name of model field to observe"
			# optional funcs to apply with certain values
			fn_false:
			fn_missing:
			events: [list of events to bind from view back to model]???

		What about middleware?  Allow that to be passed in through the mapping variable?

	How should / could we handle computed properties?
	How do we know what properties a func will depend on?
		1. We can specify it in the mapping..
		2. We can use wizardry (error prone)
		3. We can run the function and see what "gets" it calls...
		  The gets that are called then obviously make up our computed property
			if the func has side effects then that is a non-starter
			add the stipulation that it can't had side effects?  It is a getter anyway...
*/

