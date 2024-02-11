Changelog
=========

# 4.1.2

- fix some return type inconsistencies

# 4.1.1

The commonjs release.

```js
const serializer = require('moddle-context-serialiser')`
```

- use the newly discovered rollup destination footer option to set commonjs module.exports

# 4.1.0

- serialize `ConditionEventDefinition` script behaviour

# 4.0.0

- serialize process `Lane` behaviour

# 3.2.2

- ts: fix declaration exports and extendFn accepted return

# 3.2.1

- ts: Fix `getScriptsByElementId` return type

# 3.2.0

- Add type declarations
- Use rollup in favor of babel, some ms faster
- Remove directory structure with scr and dist, the purpose for just one file seems stupid

# 3.1.0-1

- Add exports for node

# 3.0.0

- Convert to module
- Remove backward compatibility test for bpmn-moddle@5

# 2.2.0

- Add property `script.type` to added scripts
- Stop building node 12
- Lint some

# 2.1.0

Activity data associations

## Additions:
- add activity behaviour property `dataInputAssociations` holding a list of the same
- add activity behaviour property `dataOutputAssociations` holding a list of the same

# 2.0.0

Handle participants add add participant information to message flows. To reduce CPU footprint the api is prototyped.

## Breaking:
- returned api is prototyped
- second argument passed to extendFn and result of `getExtendContext` is now an instance of ExtendContext. Hence, you are not able to deconstruct `addScript` and/or `addTimers` functions anymore.

## Additions:
- add participant id and name to `bpmn:MessageFlow`
- elements are exposed in new api elements property
- expose participants in elements property
- add lane information to activity

# 1.1.1

- add support for `bpmn:dataStore`
- remove dataStore prop if none

# 1.1.0

BPMN IO stuff

## Additions:
- add support for `bpmn:property`
- add support for `bpmn:dataStoreReference`

# 1.0.0

No breaking but used in production.

# 0.16.0

Scripts and timers again.

## Additions:
- Add context `getExtendContext` function to get scripts and timers and an ability to add some more

## Bugfix
- deserialized context without scripts or timers breaks when trying to retreive them

# 0.15.0

Extract scripts and timers.

## Additions:
- Extracts all known scripts into an array that can be retreived by `getScripts` or `getScriptsByElementId`
- Extracts all known timers into an array that can be retreived by `getTimers` or `getTimersByElementId`

# 0.14.1

- Add backward compatability for passing old bpmn-moddle@5 callback context as argument

# 0.14.0

- Support bpmn-moddle@7 that has dropped support for callbacks
- Bump dev dependencies

# 0.13.1

- Bump dev dependencies

# 0.13.0

- Serialize bpmn:Transaction as sub process

# 0.12.1

- Fix unrecoverable bug where a message flow that springs from a participant lane throws undefined

# 0.12.0

- Map `implementation` and `messageRef` attributes if they exist rather than based on type
- Add BusinessRuleTask to tests

# 0.11.0

- Add function to get all associations or by scope

# 0.10.0

- Loop artifacts and support bpmn:Association

# 0.9.0

- Pick `loopCondition.body` in StandardLoopCharacteristics

# 0.8.0

- ReceiveTask is messageRef aware

# 0.7.0

- MessageFlow targeting lane is now supported

# 0.6.0

## Breaking
- `getErrorById(errorId)` is no more
- `getErrors()` is no more

# 0.5.0

## Deprecated
The following functions will be removed in next minor version:

- `getErrorById(errorId)` is no longer needed since `getActivityById(errorId)` returns errors as well
- `getErrors()` will be removed since errors are not stored in a separate list anymore. Combine `getActivities()` with type filter for the same result
