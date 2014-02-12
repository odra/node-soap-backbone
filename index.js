var soap = require('soap');
var async = require('async');

module.exports = function(Backbone) {
  Backbone.sync = function( method, model, options ) {
    process.env.DEBUG && console.log('sync', method);
    if (model.models) {
      var operation = model.soapOperationForMethod(method, model, options);
      var body = model.soapBodyForMethod(method, model, options);
      process.env.DEBUG && console.log('doing collection list :: wsdl', model.wsdl, 'operation', operation, 'body', body);
      async.waterfall([function(cb) {
        // ensure soap client is initialised
        if (model.client) {
          return cb(null, model.client);
        } else {
          soap.createClient(model.wsdl, function(err, client) {
            if (err) return cb(err);
            model.client = client;
            model.client.setSecurity(new soap.WSSecurity(model.soapUser, model.soapPass));
            process.env.DEBUG && console.log('soap client', model.client.describe());
            return cb(null, model.client);
          });
        }
      }, function(client, cb) {
        client[operation](body, cb);
      }], function(err, res) {
        if (err) return options.error(err);
        process.env.DEBUG && console.log('fetched models', res.result.length);
        return options.success(res.result);
      });
    } else {
      process.env.DEBUG && console.error('model fetching not implemented');
      return options.error('model fetching not implemented');
    }
  };
};