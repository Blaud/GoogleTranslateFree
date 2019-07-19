var translator = require('./translator');

translator('en', 'ru', 'meow', response => {
  console.log(response.text);
});

translator('en', 'ru', 'time', response => {
  console.log(response.text);
});

translator('en', 'ru', 'date', response => {
  console.log(response.text);
});

translator('en', 'ru', 'now', response => {
  console.log(response.text);
});
