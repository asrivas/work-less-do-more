const utilities = require('./utilities');

// If the title already exists, we run into problems
// when sharing later. 
let date = new Date();
let title = "Test Title IO Local 2";
console.log(title);
utilities.setUp(title).then((id) => console.log(id));
