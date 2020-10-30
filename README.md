## HTTTP Node Sharp

This service runs an abstract [`sharp`](https://sharp.pixelplumbing.com/) HTTP API.

### Development

To start:

```js
yarn dev
```

This will install dependencies and fire up the local development server.

### Useage

This service accepts query parameters that match the [`sharp`](https://sharp.pixelplumbing.com/) API documentation.

Example:

```
GET http://localhost:8080/?href=https%3A%2F%2Fpicsum.photos%2Fseed%2Fpicsum%2F500&resize=100
```

This will return the image from `https://picsum.photos/seed/picsum/500` and resize it to `100` pixels in height.

Almost any parameter of sharps API can be used as an instruction to transform an image. Where query key represents the trasform function, and the value are the arugments.

A sample service is deployed on heroku at https://http-node-sharp.herokuapp.com/.
