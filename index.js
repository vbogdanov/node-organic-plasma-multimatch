var organic = require("organic"),
  dict = require("dict"),
  Iterator = require("./roiterator"),
  arrayRemove = require("./arrayRemove"),
  Map = require("./map"),
  util = require("util");
  
function dissolve (chemical) {
  this._dissolved.set(chemical, []);
  this.emit(chemical);
}

function precipitate (chemical) {
  var ls = this._dissolved.remove(chemical);
  if (ls) {
    for (var i = 0; i < ls.length; i ++) {
      ls[i](chemical);
    }
  }
}


function matchDissolvedToPattern (plasma, chemicalPattern, callback) {
  var strPattern = plasma.chemicalPatternToString(chemicalPattern);
  
  plasma._dissolved.forEach(function (key,value) {
    if (plasma.getChemicalType(key) === strPattern) {
      callback(key, value);
    }
  });
}


function precipitateAll (chemicalPattern) {
  var self = this;
  matchDissolvedToPattern(this, chemicalPattern, function (key, value) {
     self.precipitate(key);
  });
}

function onDissolved(chemicalPattern, handler, context) {
  this.on(chemicalPattern, handler, context);
  matchDissolvedToPattern(this, chemicalPattern, function (key, value) {
    handler.call(context, key);
  });
}

function onPrecipitate(chemical, handler, context) {
  var lsnr = this._dissolved.get(chemical)
  lsnr && lsnr.push(handler.bind(context));
}

function onAll(patterns, handler, context) {
  //do not accept empty pattern array
  if (! (util.isArray(patterns) && patterns.length > 0)) {
    throw "Illegal Arguments - patterns must be not empty array"
  }
  var it = new Iterator.atEnd(patterns);
  return new PartialMatchListener(this, null, it, handler.bind(context));
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
    var cpmo = new PartialMatchObject(plasma, chemical, pmo, patternIt.prev(), handler)
    createdPM.push(cpmo);
    plasma.onPrecipitate(chemical, function () {
      arrayRemove(createdPM, cpmo);
      cpmo.drop();
    });
  }
  
  this.stop = function () {
    plasma.off(pattern, activationHandler);
    for (var i = 0; i < createdPM.length; i++) {
      createdPM[i].drop();
    }
    delete createdPM;
  }
  
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
  args = [pmo.value];
  while (pmo.parent !== null) {
    pmo = pmo.parent;
    args.push(pmo.value);
  }
  handler.apply(null, args);
}



module.exports.decoratePlasma = function decoratePlasma (plasma) {
  plasma._dissolved = new Map();
  plasma.dissolve = dissolve;
  plasma.precipitate = precipitate;
  plasma.precipitateAll = precipitateAll;
  plasma.onDissolved = onDissolved;
  plasma.onPrecipitate = onPrecipitate;
  plasma.onAll = onAll;
  
}

