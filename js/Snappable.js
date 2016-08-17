var Event, NativeValue, ReactiveVar, SpringAnimation, Type, assertType, assertTypes, clampValue, configTypes, getSign, type;

require("isDev");

NativeValue = require("modx/native").NativeValue;

SpringAnimation = require("SpringAnimation");

ReactiveVar = require("ReactiveVar");

assertTypes = require("assertTypes");

assertType = require("assertType");

clampValue = require("clampValue");

Event = require("Event");

Type = require("Type");

type = Type("Snappable");

type.defineOptions({
  index: Number.withDefault(0),
  maxIndex: Number.isRequired,
  gapLength: Number,
  maxVelocity: Number.withDefault(2e308),
  distanceThreshold: Number.withDefault(0),
  velocityThreshold: Number.withDefault(0),
  tension: Number.withDefault(8),
  friction: Number.withDefault(5)
});

type.defineValues(function(options) {
  return {
    maxIndex: options.maxIndex,
    gapLength: options.gapLength,
    distanceThreshold: options.distanceThreshold,
    velocityThreshold: options.velocityThreshold,
    maxVelocity: options.maxVelocity,
    tension: options.tension,
    friction: options.friction,
    willAnimate: Event(),
    _index: ReactiveVar(options.index),
    _offset: NativeValue(0)
  };
});

type.defineGetters({
  maxOffset: function() {
    return this.__getMaxOffset();
  },
  restOffset: function() {
    return this.offsetAtIndex(this._index._value);
  }
});

type.definePrototype({
  index: {
    get: function() {
      return this._index.get();
    },
    set: function(index) {
      return this._index.set(index);
    }
  }
});

type.defineMethods({
  offsetAtIndex: function(index) {
    assertType(index, Number);
    return this.__getOffset(index);
  },
  animate: function(config) {
    var fromOffset, restOffset, toIndex;
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
    if (config.distance != null) {
      toIndex = this.resolveIndex(config.distance, config.velocity);
      fromOffset = config.distance + this.offsetAtIndex(this._index._value);
    } else {
      toIndex = config.toIndex, fromOffset = config.fromOffset;
    }
    restOffset = this.offsetAtIndex(toIndex);
    this.willAnimate.emit({
      toIndex: toIndex,
      fromOffset: fromOffset,
      restOffset: restOffset
    }, config);
    this._index.set(toIndex);
    return this._offset.animate({
      type: SpringAnimation,
      tension: this.tension,
      friction: this.friction,
      clamp: true,
      endValue: restOffset - fromOffset,
      velocity: config.velocity,
      onUpdate: config.onUpdate,
      onEnd: config.onEnd
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
    if (velocitySign === distanceSign) {
      if (Math.abs(velocity) > this.velocityThreshold) {
        return this._index.get() + velocitySign;
      }
      if (Math.abs(distance) > this.distanceThreshold) {
        return this._index.get() + distanceSign;
      }
    }
    return this._index.get();
  }
});

type.defineHooks({
  __getOffset: function(index) {
    return index * this.gapLength;
  },
  __getMaxOffset: function() {
    return this.maxIndex * this.gapLength;
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

if (isDev) {
  configTypes = {};
  configTypes.animate = {
    velocity: Number,
    distance: Number.Maybe,
    toIndex: Number.Maybe,
    fromOffset: Number.Maybe,
    onUpdate: Function.Maybe,
    onEnd: Function.Maybe
  };
}

//# sourceMappingURL=map/Snappable.map
