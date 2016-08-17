
require "isDev"

{NativeValue} = require "modx/native"

SpringAnimation = require "SpringAnimation"
ReactiveVar = require "ReactiveVar"
assertTypes = require "assertTypes"
assertType = require "assertType"
clampValue = require "clampValue"
Event = require "Event"
Type = require "Type"

type = Type "Snappable"

type.defineOptions
  index: Number.withDefault 0
  maxIndex: Number.isRequired
  gapLength: Number
  maxVelocity: Number.withDefault Infinity
  distanceThreshold: Number.withDefault 0
  velocityThreshold: Number.withDefault 0
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

  willAnimate: Event()

  _index: ReactiveVar options.index

  _offset: NativeValue 0

type.defineGetters

  maxOffset: -> @__getMaxOffset()

  restOffset: -> @offsetAtIndex @_index._value

type.definePrototype

  index:
    get: -> @_index.get()
    set: (index) ->
      @_index.set index

type.defineMethods

  offsetAtIndex: (index) ->
    assertType index, Number
    return @__getOffset index

  animate: (config) ->
    if isDev
      assertTypes config, configTypes.animate
      if config.toIndex?
        if not config.fromOffset?
          throw Error "Must define 'config.fromOffset' (because 'config.toIndex' is defined)!"
      else if not config.distance?
        throw Error "Must define 'config.toIndex' or 'config.distance'!"

    if config.distance?
      toIndex = @resolveIndex config.distance, config.velocity
      fromOffset = config.distance + @offsetAtIndex @_index._value
    else {toIndex, fromOffset} = config

    restOffset = @offsetAtIndex toIndex

    @willAnimate.emit {toIndex, fromOffset, restOffset}, config
    @_index.set toIndex
    @_offset.animate {
      type: SpringAnimation
      @tension
      @friction
      clamp: yes
      endValue: restOffset - fromOffset
      velocity: config.velocity
      onUpdate: config.onUpdate
      onEnd: config.onEnd
    }

  resolveIndex: (distance, velocity) ->
    index = @_resolveIndex distance, velocity
    return clampValue index, 0, @maxIndex

  # TODO: Support loose snapping.
  _resolveIndex: (distance, velocity) ->

    distanceSign = getSign distance
    velocitySign = getSign velocity

    if velocitySign is distanceSign

      if Math.abs(velocity) > @velocityThreshold
        return @_index.get() + velocitySign

      if Math.abs(distance) > @distanceThreshold
        return @_index.get() + distanceSign

    return @_index.get()

type.defineHooks

  __getOffset: (index) ->
    index * @gapLength

  __getMaxOffset: ->
    @maxIndex * @gapLength

module.exports = type.build()

#
# Helpers
#

getSign = (value) ->
  return 0 if value is 0
  if value > 0 then 1 else -1

if isDev
  configTypes = {}
  configTypes.animate =
    velocity: Number
    distance: Number.Maybe
    toIndex: Number.Maybe
    fromOffset: Number.Maybe
    onUpdate: Function.Maybe
    onEnd: Function.Maybe
