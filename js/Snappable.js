var Event, NativeValue, Number, Range, ReactiveVar, SpringAnimation, Type, assertType, assertTypes, clampValue, configTypes, getSign, type;

require("isDev");

NativeValue = require("modx/native").NativeValue;

Number = require("Nan").Number;

SpringAnimation = require("SpringAnimation");

ReactiveVar = require("ReactiveVar");

assertTypes = require("assertTypes");

assertType = require("assertType");

clampValue = require("clampValue");

Event = require("Event");

Range = require("Range");

Type = require("Type");

type = Type("Snappable");

type.defineOptions({
  index: Number.withDefault(0),
  indexRange: Range,
  maxVelocity: Number.withDefault(2e308),
  distanceThreshold: Number.withDefault(0),
  velocityThreshold: Number.withDefault(0),
  computeRestOffset: Function,
  gapLength: Number,
  tension: Number.withDefault(8),
  friction: Number.withDefault(5)
});

type.defineValues(function(options) {
  return {
    gapLength: options.gapLength,
    distanceThreshold: options.distanceThreshold,
    velocityThreshold: options.velocityThreshold,
    maxVelocity: options.maxVelocity,
    tension: options.tension,
    friction: options.friction,
    willAnimate: Event(),
    _index: ReactiveVar(options.index),
    _indexRange: options.indexRange || [0, 0],
    _distance: NativeValue(0),
    _lastAnimation: null,
    __computeRestOffset: options.computeRestOffset
  };
});

type.defineGetters({
  minIndex: function() {
    return this._indexRange[0];
  },
  maxIndex: function() {
    return this._indexRange[1];
  },
  maxOffset: function() {
    return this.computeRestOffset(this.maxIndex);
  },
  restOffset: function() {
    return this.computeRestOffset(this._index._value);
  }
});

type.definePrototype({
  index: {
    get: function() {
      return this._index.get();
    },
    set: function(index) {
      assertType(index, Number);
      if (index < this.minIndex) {
        throw RangeError("'index' equals " + index + ", which is < the 'minIndex': " + this.minIndex);
      }
      if (index > this.maxIndex) {
        throw RangeError("'index' equals " + index + ", which is > the 'maxIndex': " + this.maxIndex);
      }
      return this._index.set(index);
    }
  },
  indexRange: {
    get: function() {
      return this._indexRange;
    },
    set: function(range) {
      assertType(range, Range);
      return this._indexRange = range;
    }
  }
});

type.defineMethods({
  computeRestOffset: function(index) {
    var restOffset;
    assertType(index, Number);
    restOffset = this.__computeRestOffset(index);
    assertType(restOffset, Number);
    return restOffset;
  },
  animate: function(config) {
    if (isDev) {
      assertTypes(config, configTypes.animate);
      if (config.toIndex != null) {
        if (config.fromOffset == null) {
          throw Error("Must define 'config.fromOffset' (because 'config.toIndex' is defined)!");
        }
      } else if (config.distance == null) {
        throw Error("Must define 'config.toIndex' or 'config.distance'!");
      }
    }
    config.fromIndex = this._index._value;
    if (config.distance != null) {
      config.toIndex = this.resolveIndex(config.distance, config.velocity);
      config.fromOffset = config.distance + this.computeRestOffset(config.fromIndex);
    }
    config.restOffset = this.computeRestOffset(config.toIndex);
    this.willAnimate.emit(config);
    this._index.set(config.toIndex);
    this._distance.value = 0;
    return this._lastAnimation = this._distance.animate({
      type: SpringAnimation,
      tension: this.tension,
      friction: this.friction,
      clamp: true,
      endValue: config.restOffset - config.fromOffset,
      velocity: config.velocity,
      onUpdate: config.onUpdate,
      onEnd: config.onEnd,
      captureFrames: true
    });
  },
  resolveIndex: function(distance, velocity) {
    var index;
    index = this._resolveIndex(distance, velocity);
    return clampValue(index, 0, this.maxIndex);
  },
  _resolveIndex: function(distance, velocity) {
    var distanceSign, velocitySign;
    distanceSign = getSign(distance);
    velocitySign = getSign(velocity);
    if ((velocity === 0) || (velocitySign === distanceSign)) {
      if (this.velocityThreshold < Math.abs(velocity)) {
        return this._index.get() + velocitySign;
      }
      if (this.distanceThreshold < Math.abs(distance)) {
        return this._index.get() + distanceSign;
      }
    }
    return this._index.get();
  }
});

type.defineHooks({
  __computeRestOffset: function(index) {
    return index * this.gapLength;
  }
});

module.exports = type.build();

getSign = function(value) {
  if (value === 0) {
    return 0;
  }
  if (value > 0) {
    return 1;
  } else {
    return -1;
  }
};

isDev && (configTypes = {
  animate: {
    velocity: Number,
    distance: Number.Maybe,
    toIndex: Number.Maybe,
    fromOffset: Number.Maybe,
    onUpdate: Function.Maybe,
    onEnd: Function.Maybe
  }
});

//# sourceMappingURL=map/Snappable.map
