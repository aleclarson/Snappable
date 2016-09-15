
require "isDev"

{NativeValue} = require "modx/native"
{Number} = require "Nan"

SpringAnimation = require "SpringAnimation"
ReactiveVar = require "ReactiveVar"
assertTypes = require "assertTypes"
assertType = require "assertType"
clampValue = require "clampValue"
Event = require "Event"
Range = require "Range"
Type = require "Type"

type = Type "Snappable"

type.defineOptions
  index: Number.withDefault 0
  indexRange: Range
  maxVelocity: Number.withDefault Infinity
  distanceThreshold: Number.withDefault 0
  velocityThreshold: Number.withDefault 0
  computeRestOffset: Function
  gapLength: Number
  tension: Number.withDefault 8
  friction: Number.withDefault 5

type.defineValues (options) ->

  gapLength: options.gapLength

  distanceThreshold: options.distanceThreshold

  velocityThreshold: options.velocityThreshold

  maxVelocity: options.maxVelocity

  tension: options.tension

  friction: options.friction

  willAnimate: Event()

  _index: ReactiveVar options.index

  _indexRange: options.indexRange or [0, 0]

  _distance: NativeValue 0

  _lastAnimation: null

  __computeRestOffset: options.computeRestOffset

type.initInstance ->
  @_distance.__attach()

#
# Prototype
#

type.defineGetters

  minIndex: -> @_indexRange[0]

  maxIndex: -> @_indexRange[1]

  maxOffset: -> @computeRestOffset @maxIndex

  restOffset: -> @computeRestOffset @_index._value

type.definePrototype

  index:
    get: -> @_index.get()
    set: (index) ->
      assertType index, Number

      if index < @minIndex
        throw RangeError "'index' equals #{index}, which is < the 'minIndex': #{@minIndex}"

      if index > @maxIndex
        throw RangeError "'index' equals #{index}, which is > the 'maxIndex': #{@maxIndex}"

      @_index.set index

  indexRange:
    get: -> @_indexRange
    set: (range) ->
      assertType range, Range
      @_indexRange = range

type.defineMethods

  computeRestOffset: (index) ->
    assertType index, Number
    restOffset = @__computeRestOffset index
    assertType restOffset, Number
    return restOffset

  animate: (config) ->

    if isDev
      assertTypes config, configTypes.animate

      if config.toIndex?
        if not config.fromOffset?
          throw Error "Must define 'config.fromOffset' (because 'config.toIndex' is defined)!"

      else if not config.distance?
        throw Error "Must define 'config.toIndex' or 'config.distance'!"

    config.fromIndex = @_index._value

    if config.distance?
      config.toIndex = @resolveIndex config.distance, config.velocity
      config.fromOffset = config.distance + @computeRestOffset config.fromIndex

    config.restOffset = @computeRestOffset config.toIndex

    @willAnimate.emit config

    @_index.set config.toIndex
    @_distance.value = 0
    @_lastAnimation = @_distance.animate {
      type: SpringAnimation
      @tension
      @friction
      clamp: yes
      endValue: config.restOffset - config.fromOffset
      velocity: config.velocity
      onUpdate: config.onUpdate
      onEnd: config.onEnd
      captureFrames: yes # TODO: Remove this!
    }

  resolveIndex: (distance, velocity) ->
    index = @_resolveIndex distance, velocity
    return clampValue index, 0, @maxIndex

  # TODO: Support loose snapping.
  _resolveIndex: (distance, velocity) ->

    distanceSign = getSign distance
    velocitySign = getSign velocity

    if (velocity is 0) or (velocitySign is distanceSign)

      if @velocityThreshold < Math.abs velocity
        return @_index.get() + velocitySign

      if @distanceThreshold < Math.abs distance
        return @_index.get() + distanceSign

    return @_index.get()

type.defineHooks

  __computeRestOffset: (index) ->
    index * @gapLength

module.exports = type.build()

#
# Helpers
#

getSign = (value) ->
  return 0 if value is 0
  if value > 0 then 1 else -1

isDev and
configTypes =
  animate:
    velocity: Number
    distance: Number.Maybe
    toIndex: Number.Maybe
    fromOffset: Number.Maybe
    onUpdate: Function.Maybe
    onEnd: Function.Maybe
