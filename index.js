const sharp = require('sharp');

const { PORT = 8080 } = process.env;
const defaultImageUrl = 'https://pmcvariety.files.wordpress.com/2014/04/01-avengers-2012.jpg';

// build transform function
const addProcess = (transform, [key, value]) => {
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
};

const makeTransform = (params = {}) => {
  const sharpHas = sharp();
  const invalid = Object.keys(params).filter(x => !sharpHas[x]);

  if (invalid.length) {
    throw new Error(`Invalid transforms: ${invalid.join(', ')}`);
  }

  return Object.entries(params).reduce(addProcess, sharp());
};

const request = require('request');
const { parse } = require('url');
const app = require('express')();

app
  .get('/', (req, res) => {
    const { query } = parse(req.url, true);
    const { href = defaultImageUrl } = query;

    // FIXME: eventually replace this with a spread assignment
    delete query.href;

    res.type(query.toFormat || 'jpg');

    request(decodeURIComponent(href))
      .on('error', (error) => {
        res.type('json');
        res.send({
          message: '"href" query parameter invalid',
          error: error.message,
        });
      })
      .pipe(makeTransform(query))
      .on('error', ({ message }) => {
        res.type('json');
        res.send({ message });
      })
      .pipe(res);
  })
  .listen(PORT);

console.log(`running on PORT: ${PORT}`);
