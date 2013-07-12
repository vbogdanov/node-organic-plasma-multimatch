/* global describe: false */
/* global it: false */
/* global expect: false */
/* jshint maxstatements: 30 */
'use strict';

var PlasmaDecorator = require('../index');
var Plasma = require('organic').Plasma;
var Chemical = require('organic').Chemical;

var MyChemical = Chemical.extend(function(mode){
  this.mode = mode;
});

function createPlasma() {
  return new Plasma().use(PlasmaDecorator);
}

describe('Plasma', function(){
  it('should create new instance', function(){
    expect(function () {
      createPlasma();
    }).not.toThrow(); 
  });

  it('should transmit chemical', function(next){
    var plasma = createPlasma();
    plasma.on('test', function(c){
      expect(c.type).toBe('test');
      next();
    });
    plasma.emit(new Chemical('test'));
  });

  it('should transmit chemical with type', function(next){
    var plasma = createPlasma();
    plasma.on(MyChemical, function(c){
      expect(c.mode).toBe('test');
      next();
    });
    plasma.emit(new MyChemical('test'));
  });

  it('should notify listener for chemical only once', function(){
    var plasma = createPlasma();
    var c = 0;
    plasma.once('test2', function(){
      c += 1;
    });
    plasma.emit(new Chemical('test2'));
    plasma.emit(new Chemical('test2'));
    expect(c).toBe(1);
  });

  it('should unregister listener for chemical', function(){
    var plasma = createPlasma();
    var c = 0;
    var m = function(){
      c += 1;
    };
    plasma.on('test3', m);
    plasma.emit(new Chemical('test3'));
    plasma.off('test3', m);
    plasma.emit(new Chemical('test3'));
    expect(c).toBe(1);
  });
  
  it('keeps chemical dissolved and activate new listeners for it', function (next) {
    var plasma = createPlasma();
    var chem = new Chemical('test4');
    plasma.dissolve(chem);
    plasma.onDissolved('test4', function (ch) {
      expect(ch).toBe(chem);
      next();
    });
  });
  
  it('keeps chemical dissolved and activate new listeners multiple times', function (next) {
    var plasma = createPlasma();
    var chem = new Chemical('test4');
    plasma.dissolve(chem);
    plasma.onDissolved('test4', function (ch) {
      expect(ch).toBe(chem);
      
      plasma.onDissolved('test4', function (ch) {
        expect(ch).toBe(chem);
        next();
      });
    });
  });
  
  it('removes dissolved chemicals and activates listeners for it', function (next) {
    var plasma = createPlasma();
    var chem = new Chemical('test4');
    plasma.dissolve(chem);
    plasma.onPrecipitate(chem, function (ch) {
      expect(ch).toBe(chem);
      next();
    });
    plasma.precipitate(chem);
  });
  
  it('removes dissolved chemicals based on pattern and activates listeners for it', function (next) {
    var plasma = createPlasma();
    var chem = new Chemical('test4');
    plasma.dissolve(chem);
    plasma.onPrecipitate(chem, function (ch) {
      expect(ch).toBe(chem);
      next();
    });
    plasma.precipitateAll('test4');
  });
  
  it('handles different chemicals being desolved and precipitated', function (next) {
    var plasma = createPlasma();
    var chemA = new Chemical('A');
    var chemB = new Chemical('B');
    var count = 0;
    
    plasma.onDissolved('A', function (ch) {
      expect(ch).toBe(chemA);
      count ++;
      expect(count).toBe(1);
    });
    
    plasma.dissolve(chemA);
    plasma.dissolve(chemB);
    
    plasma.onDissolved('A', function (ch) {
      expect(ch).toBe(chemA);
      count ++;
      expect(count).toBe(2);
    });
    
    plasma.onDissolved('B', function (ch) {
      expect(ch).toBe(chemB);
      count ++;
      expect(count).toBe(3);
    });
    
    plasma.onPrecipitate(chemA, function (ch) {
      expect(ch).toBe(chemA);
      count ++;
      expect(count).toBe(4);
    });
    
    plasma.precipitate(chemA);
    
    plasma.onDissolved('B', function (ch) {
      expect(ch).toBe(chemB);
      count ++;
      expect(count).toBe(5);
      next();
    });
  });
  
   it('register handler for a combination of dissolved chemicals already present', function (next) {
    var plasma = createPlasma();
    var chemA = new Chemical('A');
    var chemB = new Chemical('B');
    plasma.dissolve(chemA);
    plasma.dissolve(chemB);
    
    plasma.onAll(['A', 'B'], function (ch1, ch2) {
      expect(ch1).toBe(chemA);
      expect(ch2).toBe(chemB);
      next();
    });
  });
   
  it('register handler for a combination of dissolved chemicals not yet present', function (next) {
    var plasma = createPlasma();
    var chemA = new Chemical('A');
    var chemB = new Chemical('B');
    var chemC = new Chemical('C');
        
    plasma.onAll(['A', 'B', 'C'], function (ch1, ch2, ch3) {
      expect(ch1).toBe(chemA);
      expect(ch2).toBe(chemB);
      expect(ch3).toBe(chemC);
      next();
    });
    
    plasma.dissolve(chemC);
    plasma.dissolve(chemB);
    plasma.dissolve(chemA);
  });
  
  it('register handler for a combination of dissolved chemicals not yet present. They are never present together.', function (next) {
    var plasma = createPlasma();
    var chemA = new Chemical('A');
    var chemB = new Chemical('B');
    var chemC = new Chemical('C');
        
    plasma.onAll(['A', 'B', 'C'], function (ch1, ch2, ch3) {
      //fail - should not invoke this one
      expect(true).toBe(false);
    });
    
    plasma.dissolve(chemC);
    plasma.dissolve(chemB);
    plasma.precipitate(chemC);
    plasma.dissolve(chemA);
    
    process.nextTick(next);
  });
  
  it('register handler for a combination of dissolved chemicals not yet present. They are never present together.', function (next) {
    var plasma = createPlasma();
    var chemA = new Chemical('A');
    var chemB = new Chemical('B');
    var chemC = new Chemical('C');
        
    plasma.onAll(['A', 'B', 'C'], function (ch1, ch2, ch3) {
      expect(ch1).toBe(chemA);
      expect(ch2).toBe(chemB);
      expect(ch3).toBe(chemC);
      next();
    });
    
    plasma.dissolve(chemC);
    plasma.dissolve(chemB);
    plasma.precipitate(chemC);
    plasma.dissolve(chemA);
    plasma.dissolve(chemC);
  });
});