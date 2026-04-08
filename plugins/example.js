module.exports = {
  name: 'hello',
  description: 'Says hello from a plugin',
  execute(message, args) {
    message.reply('Hello from a plugin!');
  }
};
