const { parse } = require('url');
const app = require('express')();
const crypto = require('crypto');
const fs = require('fs');
const request = require('request');
const sharp = require('sharp');
const path = require('path');

const { PORT = 8080 } = process.env;

// build transform function
function addProcess(transform, [key, value]) {
  let json;

  try {
    json = JSON.parse(value);
  } catch (error) {
    json = value;
  }

  const args = Array.isArray(json) ? json : [json];

  try {
    return transform[key](...args);
  } catch (error) {
    throw new Error(`invalid parameters for "${key}": ${error.message}`);
  }
}

const sharpHas = sharp();

function makeTransform(params = {}) {
  const invalid = Object.keys(params).filter((x) => !sharpHas[x]);

  if (invalid.length) {
    throw new Error(`Invalid transforms: ${invalid.join(', ')}`);
  }

  return Object.entries(params).reduce(addProcess, sharp());
}

function getImage(url) {
  if (url) {
    console.log(`getting image: "${url}"`);
    return request(decodeURIComponent(url));
  }

  console.log(`returning default image`);
  return fs.createReadStream(path.resolve(__dirname, './theavengers_lob_crd_03.jpg'));
}

function setCache({ method }, res, next) {
  if (method == 'GET') {
    res.set('Cache-control', `public, max-age=${60 * 5}`);
  } else {
    res.set('Cache-control', `no-store`);
  }

  next();
}

app
  .use(setCache)
  .get('/', (req, res) => {
    const url = parse(req.url, true);
    const { href = '', ...query } = url.query;

    res.type(query.toFormat || 'jpg');

    const image = getImage(href);

    // send image response
    image
      .pipe(makeTransform(query))
      .on('error', (error) => {
        console.error(error);

        res.type('json');
        res.send({
          message: '"href" query parameter invalid',
          error: error.message,
        });
      })
      .pipe(res);
  })
  .listen(PORT);

console.log(`running on PORT: ${PORT}`);
