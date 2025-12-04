//ternerary operator os a shortcut to if and else statements. 
//it helps assign a variable based on a condition ? codeifTrue: codeiffalse;

 //let age = 21;
 //let message = age >=18 ? "You're an adult" : "You're a minor" //useful when assigning a condition to a variable
 //console.log(message);

 //let time = 16;
 //let greeting = time < 12 ? "Good morning!" : "Good afternoon!"
 //onsole.log(greeting);


//  let isStudent = false;
//  let message = isStudent ? "You are a Student" : "You are Not a student";
//  console.log(message);
 
let purchaseAmount = 125;
let discount = purchaseAmount >=100 ? 10 : 0;
console.log(`Your total is $${purchaseAmount - purchaseAmount *(discount/100)}`);