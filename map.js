'use strict';

var arrayRemove = require('./arrayRemove');

module.exports = function Map() {
  var entries = [];
  var self = this;
  
  self.getEntry = function (key) {
    for(var i = 0; i < entries.length; i ++) {
      if (entries[i][0] === key) {
        return entries[i];
      }
    }
    return null;
  };
  
  self.get = function (key) {
    var entry = self.getEntry(key);
    return (entry !== null)? entry[1]: null;
  };
  
  self.set = function (key, value) {
    var entry = self.getEntry(key);
    if (entry)
      entry[1] = value;
    else 
      entries.push([key, value]);
  };
  
  self.remove = function (key) {
    var entry = self.getEntry(key);
    if (! entry)
      return null;
    arrayRemove(entries, entry);
    return entry[1];
  };
  
  self.size = function () {
    return entries.length;
  };
  
  self.forEach = function (callback) {
    var tmp = [].concat(entries);
    for (var i = 0; i < tmp.length; i ++) {
      callback(tmp[i][0], tmp[i][1]);
    }
  };
};