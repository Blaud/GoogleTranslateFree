var translator = require('./translator');

translator('en', 'ru', 'meow', response => {
  console.log(JSON.stringify(response));
});
