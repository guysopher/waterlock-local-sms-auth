'use strict';
var bcrypt = require('bcrypt');
var utils = require('../../utils.js');

/**
 * Login action
 */
module.exports = function(req, res){

  var scope = require('../../scope')(waterlock.Auth, waterlock.engine);
  var params = req.params.all();
  
  if(typeof params[scope.type] === 'undefined' || typeof params.smsCode !== 'string'){
    //console.log('type mismatch');
    waterlock.cycle.loginFailure(req, res, null, {error: 'Invalid '+scope.type+' or smsCode'});
  }else{
    //console.log('inside else');
    var pass = params.smsCode;
    scope.getUserAuthObject(params, req, function(err, user){
      if (err) {
        console.log('got error while getting user object');
        if (err.code === 'E_VALIDATION') {
          return res.status(400).json(err);
        } else {
          console.log('got error while getting user object');
          return res.serverError(err);
        }
      }
      if (user) {
        console.log('got user object');
        console.log(user);
        // if(pass == user.auth.smsCode){
        var isVaildCode = utils.checkSmsCodes(pass, user.auth);
        if (!isVaildCode.err){
          console.log('smsCode is correct forwarding to loginSuccess');
          waterlock.cycle.loginSuccess(req, res, user);
        }else{
          console.log('smsCode is incorrect forwarding to loginFailure');
          waterlock.cycle.loginFailure(req, res, user, {error: isVaildCode.err});
        }
      } else {
        //TODO redirect to register
        //console.log('user empty');
        waterlock.cycle.loginFailure(req, res, null, {error: 'user not found'});
      }
    });
  }
};
