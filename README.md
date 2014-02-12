node-soap-backbone
==================

# Overview

This module overwrites the Backbokne.sync method to use the node-soap module to fetch and populate models. There are some key fields to specify in a Collection that the sync method will try to use

* wsdl - location of wsdl file describing the required resource and available operations. This gets passed into node-soap when creating a client
* soapOperationForMethod - this method should return the soap operation for doing the required method. See Usage for an example.
* soapBodyForMethod - this method should return the soap body for doing the required method. See Usage for an example.
* soapUser - SOAP security username
* soapPass - SOAP security pasword

# Usage

Example using the public Oracle CRM (Fusion Application) wsdl for a Sales Account

```javascript
var Backbone = require('backbone');
require('node-soap-backbone')(Backbone); // Pass in your Backbone here to apply the sync overwrite
var Models = exports.Models = {};
var Collections = exports.Collections = {};

Models.SalesAccount = Backbone.Model.extend({});

Collections.SalesAccounts = Backbone.Collection.extend({
  model: Models.SalesAccount,
  wsdl: 'https://trialawzr.crm.us2.oraclecloud.com/crmCommonSalesParties/SalesPartyService?WSDL',
  soapOperationForMethod: function(method, collection, options) {
    switch(method) {
      case 'read': return 'findSalesAccount';
      default: throw new Error('unsupported_method');
    }
  },
  soapBodyForMethod: function(method, collection, options) {
    switch(method) {
      case 'read':
        return {
          "findCriteria": {
            "fetchSize": 10
          }
        };
      default: throw new Error('unsupported_method');
    }
  },
  soapUser: process.env.SOAP_USER,
  soapPass: process.env.SOAP_PASS
});
```

After model/s and collection/s are defined, use them as normal backbone models e.g.

```javascript
var collection = new Collections.SalesAccounts();
collection.fetch({
  success: function() {
    console.log('fetched ', collection.models.length, 'models');
  },
  error: function(err) {
    console.error('fetch failed', err);
  }
});
```

If you wish to filter out parts of the response that get populated into the model, overwrite the 'parse' method in the model e.g.

```javascript
Models.SalesAccount = Backbone.Model.extend({
  parse: function(json) {
    for(var key in json) {
      if(json[key] instanceof Array || typeof json[key] === 'object') {
        delete json[key];
      }
    }
    return json;
  }
});
```

# Debugging

To enabled logs to stdout in the module, set the DEBUG environment variable. 

# Known Limitations

* Update and delete not supported
* Individual model fetching not supported
* The soap client is stored in the collection after first use to save on setup time. This may cause a high memory footprint.
