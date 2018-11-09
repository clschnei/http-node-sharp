const { parse } = require('url');
const app = require('express')();
const fs = require('fs');
const request = require('request');
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

function getImage(url) {
  const [extension] = url.match(/\.\w*$/);
  const cacheLocation = `./.cache/${Buffer.from(url).toString('base64')}${extension}`;

  if (!fs.existsSync('./.cache')) {
    fs.mkdirSync('./.cache');
  }

  if (fs.existsSync(cacheLocation)) {
    console.log(`getting "${url}" from cache...`);
    return sharp(cacheLocation);
  }

  const image = request(decodeURIComponent(url));

  image.pipe(fs.createWriteStream(cacheLocation));

  return image;
}

app
  .get('/', (req, res) => {
    const { query } = parse(req.url, true);
    const { href = defaultImageUrl } = query;

    // FIXME: eventually replace this with a spread assignment
    delete query.href;

    res.type(query.toFormat || 'jpg');

    const imageStream = getImage(href);

    imageStream.on('error', (error) => {
      res.type('json');
      res.send({
        message: '"href" query parameter invalid',
        error: error.message,
      });
    });

    // send image response
    imageStream.pipe(makeTransform(query))
      .on('error', ({ message }) => {
        res.type('json');
        res.send({ message });
      })
      .pipe(res);
  })
  .listen(PORT);

console.log(`running on PORT: ${PORT}`);
