const sharp = require('sharp');

const { PORT = 8080 } = process.env;

const defaultImageUrl =
  'https://jaysanalysis.files.wordpress.com/2015/04/the-avengers-wallimages1.jpg';

// build transform function
const addProcess = (transform, [key, value]) => {
  let json;

  try {
    json = JSON.parse(value);
  } catch (error) {
    json = value;
  }

  const args = Array.isArray(json) ? json : [json];

  return transform[key](...args);
};

const makeTransform = (params = []) => Object.entries(params).reduce(addProcess, sharp());

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
      .pipe(makeTransform(query))
      .pipe(res);
  })
  .listen(PORT);

console.log(`running on PORT: ${PORT}`);
