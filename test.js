var translator = require('./translator');

(async () => {
  await translator('en', 'ru', 'meow', async response => {
    console.log(response.text);
  });

  await translator('en', 'ru', 'time', async response => {
    console.log(response.text);
  });

  await translator('en', 'ru', 'date', async response => {
    console.log(response.text);
  });

  await translator('en', 'ru', 'now', async response => {
    console.log(response.text);
  });
})();
