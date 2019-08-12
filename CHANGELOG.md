Changelog
=========

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
