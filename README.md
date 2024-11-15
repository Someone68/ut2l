# UT2L
A complete rewrite of my original (shit) project Util.
Documentation coming soon, but this is basically just a lightweight (shit) JQuery clone with some sprinkles on the top. (lipstick on the pig)

## Simple Usage
Grab one or more elements from the DOM.
```javascript
_(".foo") // grabs the first element with the class "foo"
_(".foo", 2) // grabs the third element with the class "foo"
_(".foo", (element) => {}) // runs the callback function for each element with the class "foo"
_(".foo", 2, (element) => {}) // runs the callback function for the third element with the class "foo"
_("#bar") // grabs the element with the ID "bar"
_("p") // grabs the first <p> tag in the DOM
```
## Random
```javascript
_.randInt(min, max)
_.randFloat(min, max, decimalPlaces)
_.randPick(collection) // object/array
```

a lot more but i dont have time no more

##### UT2L is pronounced "cat".
