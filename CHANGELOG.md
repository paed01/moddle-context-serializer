Changelog
=========

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
