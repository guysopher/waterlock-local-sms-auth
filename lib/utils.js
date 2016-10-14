'use strict';

var jade = require('jade');
var path = require('path');
var bcrypt = require('bcrypt');

/**
 * Returns the email jade template as html
 * @param  {Token} token
 * @return {String} html
 */
exports.getHtmlEmail = function(token){
  var config = require('./waterlock-local-sms-auth').config;
  var authConfig = require('./waterlock-local-sms-auth').authConfig;
  if(typeof config === 'undefined'){
    throw new Error('No config file defined, try running [waterlock install config]');
  }

  var resetUrl;
  if (config.pluralizeEndpoints) {
    resetUrl = config.baseUrl + '/auths/reset?token='+token.token;
  }else {
    resetUrl = config.baseUrl + '/auth/reset?token='+token.token;
  }


  var viewVars = authConfig.passwordReset.template.vars;
  viewVars.url = resetUrl;

  var templatePath = path.normalize(__dirname+'../../../'+authConfig.passwordReset.template.file);
  var html = jade.renderFile(templatePath, viewVars);

  return html;
};

/**
 * Callback for mailing operation
 * @param  {Object} error
 * @param  {Object} response
 */
exports.mailCallback = function(error, info){
   if(error){
        console.log(error);
    }else{
        console.log('Message sent: ' + info.response);
    }
};

exports.encryptSmsCode = function(smsCode) {
  smsCode = String(smsCode);
  try {
    var bcrypt = require('bcrypt');
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(smsCode, salt);
    return hash;
  } catch (e) {
    return '';
  }
};

exports.checkSmsCodes = function(smsCode, auth) {
  var bcrypt = require('bcrypt');
  if (!bcrypt.compareSync(smsCode, auth.smsCode)) {
  // if (this.encryptSmsCode(smsCode) != auth.smsCode) {
    return {
      err: "SMS codes do not match"
    }
  }

  if ((new Date) - (new Date(auth.updatedAt)) > (1000 * 50 * 5)) {
    return {
      err: "SMS code is older than 5 minutes"
    }
  }
  
  return {
    success: true
  }
}
  
exports.sendSmsCode = function(phoneNumber, smsCode) {
  //require the Twilio module and create a REST client
  var config = require('./waterlock-local-sms-auth').config.sms;

  var client = require('twilio')(config.twilio.appId, config.twilio.secret);
  var messageData = {
    to: phoneNumber, // Any number Twilio can deliver to
    from: config.phone, // A number you bought from Twilio and can use for outbound communication
    body: config.message.replace('{smsCode}', smsCode) // body of the SMS message
  };
  
  // console.log("Sending code via sms", messageData);
  //Send an SMS text message
  client.sendMessage(messageData, function (err, responseData) { //this function is executed when a response is received from Twilio
    
    if (!err) { // "err" is an error received during the request, if any
      
      // "responseData" is a JavaScript object containing data received from Twilio.
      // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
      // http://www.twilio.com/docs/api/rest/sending-sms#example-1
      console.log("SMS Sent successfully to", responseData.to);
      
    } else {
      console.log("Error sending message", err, responseData);
    }
  });
}
