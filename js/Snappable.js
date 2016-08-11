var Event, NativeValue, SpringAnimation, Type, assertType, clampValue, getSign, mergeDefaults, type;

NativeValue = require("modx/native").NativeValue;

SpringAnimation = require("SpringAnimation");

mergeDefaults = require("mergeDefaults");

assertType = require("assertType");

clampValue = require("clampValue");

Event = require("Event");

Type = require("Type");

type = Type("Snappable");

type.defineOptions({
  offset: NativeValue.isRequired,
  index: Number.withDefault(0),
  maxIndex: Number.isRequired,
  gapLength: Number.isRequired,
  distanceThreshold: Number.isRequired,
  velocityThreshold: Number.isRequired,
  maxVelocity: Number.withDefault(2e308),
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
    willSnap: Event(),
    _index: null,
    _offset: options.offset
  };
});

type.initInstance(function(options) {
  return this.index = options.index;
});

type.defineGetters({
  restOffset: function() {
    return this._index * this.gapLength;
  },
  maxOffset: function() {
    return this.maxIndex * this.gapLength;
  }
});

type.definePrototype({
  index: {
    get: function() {
      return this._index;
    },
    set: function(newIndex, oldIndex) {
      if (newIndex === oldIndex) {
        return;
      }
      this._index = newIndex;
      return this._offset.value = newIndex * this.gapLength;
    }
  }
});

type.defineMethods({
  toNearest: function(distance, velocity) {
    var nextIndex;
    nextIndex = this.resolveIndex(distance, velocity);
    return this.toIndex(nextIndex, velocity);
  },
  toIndex: function(index, velocity) {
    assertType(index, Number);
    assertType(velocity, Number);
    this.willSnap.emit(index, velocity);
    this._index = index;
    return this._offset.animate({
      type: SpringAnimation,
      endValue: index * this.gapLength,
      velocity: velocity,
      tension: this.tension,
      friction: this.friction,
      clamp: true
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
        return this._index + velocitySign;
      }
      if (Math.abs(distance) > this.distanceThreshold) {
        return this._index + distanceSign;
      }
    }
    return this._index;
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

//# sourceMappingURL=map/Snappable.map
