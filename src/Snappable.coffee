
{NativeValue} = require "modx/native"

SpringAnimation = require "SpringAnimation"
mergeDefaults = require "mergeDefaults"
assertType = require "assertType"
clampValue = require "clampValue"
Event = require "Event"
Type = require "Type"

type = Type "Snappable"

type.defineOptions
  offset: NativeValue.isRequired
  index: Number.withDefault 0
  maxIndex: Number.isRequired
  gapLength: Number.isRequired
  distanceThreshold: Number.isRequired
  velocityThreshold: Number.isRequired
  maxVelocity: Number.withDefault Infinity
  tension: Number.withDefault 8
  friction: Number.withDefault 5

type.defineValues (options) ->

  maxIndex: options.maxIndex

  gapLength: options.gapLength

  distanceThreshold: options.distanceThreshold

  velocityThreshold: options.velocityThreshold

  maxVelocity: options.maxVelocity

  tension: options.tension

  friction: options.friction

  willSnap: Event()

  _index: null

  _offset: options.offset

type.initInstance (options) ->

  @index = options.index

type.defineGetters

  restOffset: -> @_index * @gapLength

  maxOffset: -> @maxIndex * @gapLength

type.definePrototype

  index:
    get: -> @_index
    set: (newIndex, oldIndex) ->
      return if newIndex is oldIndex
      @_index = newIndex
      @_offset.value = newIndex * @gapLength

type.defineMethods

  toNearest: (distance, velocity) ->
    nextIndex = @resolveIndex distance, velocity
    return @toIndex nextIndex, velocity

  toIndex: (index, velocity) ->

    assertType index, Number
    assertType velocity, Number
    @willSnap.emit index, velocity

    @_index = index
    return @_offset.animate {
      type: SpringAnimation
      endValue: index * @gapLength
      velocity
      @tension
      @friction
      clamp: yes
    }

  resolveIndex: (distance, velocity) ->
    index = @_resolveIndex distance, velocity
    return clampValue index, 0, @maxIndex

  _resolveIndex: (distance, velocity) ->

    distanceSign = getSign distance
    velocitySign = getSign velocity

    if velocitySign is distanceSign

      if Math.abs(velocity) > @velocityThreshold
        return @_index + velocitySign

      if Math.abs(distance) > @distanceThreshold
        return @_index + distanceSign

    return @_index

module.exports = type.build()

getSign = (value) ->
  return 0 if value is 0
  if value > 0 then 1 else -1
