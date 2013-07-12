'use strict';
/**
 * Removes an item from an array
 */
module.exports = function arrayRemove (array, item) {
  array.splice(array.indexOf(item), 1);
};