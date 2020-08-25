// Dane Iracleous
// daneiracleous@gmail.com

var chakram = require('chakram');
var expect = chakram.expect;

// to-do: write integration tests for frontend

describe("Adventurizer API", function () {
  var apiHost = "http://127.0.0.1:5000";
  var accessToken;
  var authOptions;

  // to-do: finish writing test cases for all API endpoints

  after("Cleanup", function() {
    this.timeout(0);
    return chakram.delete(apiHost+"/me", {
      "password": "demo123"
    }, authOptions).then(function(response) {
      // delete user response
      //console.log(response.body);
      expect(response.body.status).to.be.equal("success");
      return chakram.post(apiHost+"/logout", {}, authOptions);
    }).then(function(response) {
      // logout response
      expect(response.body.status).to.be.equal("success");
      accessToken = null;
      authOptions = null;

      return true;
    });
  });

  it("Should support all API endpoints", function () {
    this.timeout(0);
    return chakram.post(apiHost+"/me", {
      "penName": "Test User",
      "email": "dane@adventurizer.net",
      "emailConfirm": "dane@adventurizer.net",
      "password": "demo123",
      "passwordConfirm": "demo123",
      "testing": true
    }).then(function(response) {
      // signup response
      //console.log(response.body);
      expect(response.body.status).to.be.equal("success");
      expect(response.body.data.actionToken).to.exist;
      return chakram.get(apiHost+"/action/"+response.body.data.actionToken);
    }).then(function(response) {
      // activate account response
      //console.log(response.body);
      expect(response.body.status).to.be.equal("success");
      return chakram.post(apiHost+"/login", {
        "email": "dane@adventurizer.net",
        "password": "demo123"
      });
    }).then(function(response) {
      // login response
      //console.log(response.body);
      expect(response.body.status).to.be.equal("success");
      expect(response.body.data.accessToken).to.exist;
      accessToken = response.body.data.accessToken;
      authOptions = {
        "headers": {
          "Content-Type": "application/json",
          "Authorization": accessToken
        }
      };
      return chakram.put(apiHost+"/me", {
        "penName": "Tested User",
        "subscribed": false
      }, authOptions);
    }).then(function(response) {
      // edit user data response
      //console.log(response.body);
      expect(response.body.status).to.be.equal("success");
      return chakram.get(apiHost+"/me", authOptions);
    }).then(function(response) {
      // get user data response
      //console.log(response.body);
      expect(response.body.status).to.be.equal("success");
      expect(response.body.data.user.email.value).to.be.equal("dane@adventurizer.net");
      expect(response.body.data.user.penName.value).to.be.equal("Tested User");
      expect(response.body.data.user.subscribed.value).to.be.equal(false);

      return true;
    });
  });
}); 