## API Reference

All alexa methods return a promise.

#### Initialize Query Client

```js
import AlexaQuery from "alexaquery";
const alexa = new AlexaQuery(cookiePath);
```

cookiePath is relative to your home directory.

#### Login

```js
// The userId is used to identify the cookie and can be any string.
// Returns a boolean (True == success)
await alexa.login(userId, amazon_refresh_token);
```

#### Check Login Status

```js
// Returns a boolean
await alexa.checkStatus(userId);
```

#### Get Devices

```js
// Returns an array of devices
await alexa.getDevices(userId);
```

#### Get Notifications

```js
// Returns an array of notifications
await alexa.getNotifications(userId);
```

#### Get Queue

```js
// Returns a Queue Object
await alexa.getQueue(userId, device);
```
