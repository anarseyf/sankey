
var clone = function(obj) {
    return JSON.parse(JSON.stringify(obj));
};

var uniques = function(array) {
    var arrayClone = clone(array);
    arrayClone.sort();
    var uniqueValues = [];
    var previous;
    arrayClone.forEach(function (value) {
        if (previous !== value) {
            uniqueValues.push(value);
        }
        previous = value;
    });
    return uniqueValues;
};

var jsonify = function(data) {
    return JSON.stringify(data, null, 4);
};