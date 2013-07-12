/* jshint maxparams: 6 */
'use strict';

var organic = require('organic');
var dict = require('dict');
var Iterator = require('./roiterator');
var arrayRemove = require('./arrayRemove');
var MyMap = require('./map');
var util = require('util');
  
//to be used with Plasma.use and Plasma.decorate
module.exports = function (state) { //this is bound to new plasma object

  state._dissolved = new MyMap();
  var plasma = this;

  plasma.dissolve = function (chemical) {
    state._dissolved.set(chemical, []);
    this.emit(chemical);
  };
  plasma.precipitate = function (chemical) {
    var ls = state._dissolved.remove(chemical);
    if (ls) {
      for (var i = 0; i < ls.length; i ++) {
        ls[i](chemical);
      }
    }
  };

  plasma.precipitateAll = function (chemicalPattern) {
    var self = this;
    matchDissolvedToPattern(this, state, chemicalPattern, function (key, value) {
       self.precipitate(key);
    });
  };

  plasma.onDissolved = function (chemicalPattern, handler, context) {
    this.on(chemicalPattern, handler, context);
    matchDissolvedToPattern(this, state, chemicalPattern, function (key, value) {
      handler.call(context, key);
    });
  };

  plasma.onPrecipitate = function (chemical, handler, context) {
    var lsnr = state._dissolved.get(chemical);
    if(lsnr) lsnr.push(handler.bind(context));
  };


  plasma.onAll = function (patterns, handler, context) {
    //do not accept empty pattern array
    if (! (util.isArray(patterns) && patterns.length > 0)) {
      throw 'Illegal Arguments - patterns must be not empty array';
    }
    var it = new Iterator.atEnd(patterns);
    return new PartialMatchListener(this, null, it, handler.bind(context));
  };

};

function matchDissolvedToPattern (plasma, state, chemicalPattern, callback) {
  var strPattern = plasma.chemicalPatternToString(chemicalPattern);
  
  state._dissolved.forEach(function (key,value) {
    if (plasma.getChemicalType(key) === strPattern) {
      callback(key, value);
    }
  });
}

var FakePartialMatchListener = { stop: function () {} };
function PartialMatchListener (plasma, pmo, patternIt, handler) {
  //all conditions met
  if (patternIt.index() === -1) {
    invokeHandler(plasma, pmo, handler);
    return FakePartialMatchListener;
  }
  
  var pattern = patternIt.val();
  var createdPM = [];
  
  var activationHandler = function (chemical) {
    var cpmo = new PartialMatchObject(plasma, chemical, pmo, patternIt.prev(), handler);
    createdPM.push(cpmo);
    plasma.onPrecipitate(chemical, function () {
      arrayRemove(createdPM, cpmo);
      cpmo.drop();
    });
  };
  
  this.stop = function () {
    plasma.off(pattern, activationHandler);
    for (var i = 0; i < createdPM.length; i++) {
      createdPM[i].drop();
    }
    createdPM = [];
  };
  
  plasma.onDissolved(pattern, activationHandler, this);
}

function PartialMatchObject(plasma, chemical, parent, remainingPatterns, handler) {
 
  this.value = chemical;
  this.parent = parent;
  this.pml = new PartialMatchListener(plasma, this, remainingPatterns, handler);

  this.drop = function () {
    this.pml.stop();
  };
}

function invokeHandler(plasma, pmo, handler) {
  var args = [pmo.value];
  while (pmo.parent !== null) {
    pmo = pmo.parent;
    args.push(pmo.value);
  }
  handler.apply(null, args);
}
