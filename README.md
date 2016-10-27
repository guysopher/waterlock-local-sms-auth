# waterlock-phone-sms-auth

local authentication using phone &amp; sms code for waterlock

waterlock-phone-sms-auth is a module for [waterlock](http://waterlock.ninja/)
providing a local authentication method for users based on phone number and sms code.

It's a reworked version of waterlock-local-sms-auth, with simplified api and connection to twillio.

## Installation

```bash
npm install waterlock-phone-sms-auth
```

Add the following option in your `waterlock.js` config file

```js
authMethod: [
    {
      name:'waterlock-phone-sms-auth',
      sms: {
        twilio: {
          appId: 'YOUR_TWILIO_ACCOUNT_SID',
          secret: 'YOUR_TWILIO_AUTH_TOKEN',
        },
        from: 'SENDER_PHONE_NUMBER', //it is recommended to use your twilio phone number (with + and the country prefix)
        message: '{smsCode} is your one time password' //the {smsCode} will be replaced with the sms-code. Keep it in the begining of the message to make sure it is seen in the message preview
      },
      testAccount: { // the test account will not send sms codes and has a fixed password (used for devlopment or testing)
        phone: 'TEST_PHONE_NUMBER',
        code: '1234'
      }
    }
]
```

## Auth Model
Local auth adds the following attributes onto the Auth model

```js
  phone: {
    type: 'string',
    unique: true
  },
  smsCode: {
    type: 'string',
    minLength: 4
  },
```
## Usage
With phone authentication, the api is really simple, the passwords are temporary and no 'forgot password' option is neccessary.
There are two apis that you need to use:
### Register a new user / regenerate sms-code
```
POST /auth/register
body: {
  type: 'phone-sms',
  phone: 'FULL_PHONE_NUMBER',
  sendSms: true
}
```
This api will create a new user if needed and will generate a new password.
It can also be used to regenerate a password for a signed in user
If the `sendSms` parameter is set to 'true' twilio will be used to send the password in an SMS
The password will be valid for 5 minutes

### Login an existing user using a sms-code
```
POST /auth/login
body: {
  type: 'phone-sms',
  phone: 'FULL_PHONE_NUMBER',
  smsCode: 'CODE_FROM_SMS'
}
```
This api will login an exisiting user using a sms-code.
It will verify the user's saved sms-code with the one in the body and will check that the code is not older than 5 minutes. If the compare is successful, the user will be logged-in.
If the phone matches the testAccount phone, it will compare the smsCode to the smsCode in the testAccount

That's it, the simplest and secured auth method
