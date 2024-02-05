let JuggleChat = require("../src/index");
export const mochaHooks = {
  beforeAll: function (done) {
    console.log('beforeall', JuggleChat)
    this.user = {
      name: 'nickname',
      id: 'userid'
    }
    done();
  },
  afterAll: function () {
    // one-time final cleanup
  }
};