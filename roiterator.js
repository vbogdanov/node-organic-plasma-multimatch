'use strict';

function Iterator(array, startIndex) {
  /* jshint maxstatements: 10 */
  var index = startIndex || 0;
  
  this.val = function () {
    return array[index];
  };
  
  this.hasPrev = function () {
    return index > 0;
  };
  
  this.prev = function () {
    return new Iterator (array, index - 1);
  };
  
  this.hasNext = function () {
    return index < array.length - 1;
  };
  
  this.next = function () {
    return new Iterator (array, index + 1);
  };
  
  this.arr = function () {
    return array;
  };
  
  this.index = function () {
    return index;
  };
  
  this.isValid = function () {
    return index >= 0 && index < array.length;
  };
}

module.exports = Iterator;

module.exports.atEnd = function (array) {
  return new Iterator(array, array.length - 1);
};