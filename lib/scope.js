'use strict';
var _ = require('lodash');
var authConfig = require('./waterlock-phone-sms-auth').authConfig;
var utils = require('./utils');

/**
 * TODO these can be refactored later
 * @type {Object}
 */

module.exports = function(Auth, engine){
  var def = Auth.definition;

  if(typeof def.phone !== 'undefined'){
    return generateScope('phone', engine);
  }else{
    var error = new Error('Auth model must have either an email or phone attribute');
    throw error;
  }
};

function generateScope(scopeKey, engine){
  return {
    type: scopeKey,
    engine: engine,

    registerUserAuthObject: function(attributes, req, cb) {
      var self = this;
      var attr = {
        smsCode: attributes.smsCode
      };
      attr[scopeKey] = attributes[scopeKey];

      var criteria = {};
      criteria[scopeKey] = attr[scopeKey];
      
      var attachAuth = function (err, user) {
        attr.smsCode = utils.encryptSmsCode(attr.smsCode);
        self.engine.attachAuthToUser(attr, user, cb);
      }

      this.engine.findAuth(criteria, function(err, user) {
//  On register - recreate the user with a defferent smsCode
        if (user) {
          // cb(); //user alreay exists
          
          //todo - this should call before update
          //create smsCode hash
          attachAuth(null, user);
        } else {
  
          self.engine.findOrCreateAuth(criteria, attr, attachAuth);
        }
      });

    },
    getUserAuthObject: function(attributes, req, cb){
      var attr = {smsCode: attributes.smsCode};
      attr[scopeKey] = attributes[scopeKey];

      var criteria = {};
      criteria[scopeKey] = attr[scopeKey];

      if(authConfig.createOnNotFound){
        this.engine.findOrCreateAuth(criteria, attr, cb);
      }else{
        this.engine.findAuth(criteria, cb);
      }
    }
  };
}
