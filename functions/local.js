const utilities = require('./utilities');

// If the title already exists, we run into problems
// when sharing later. 
let date = new Date();
let title = "IO from Local";
console.log(title);
utilities.setUp(title).then((id) => console.log(id));
