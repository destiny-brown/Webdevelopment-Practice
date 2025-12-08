// string methods = allow you to manipulate and work with text (strings)

let userName = "BroCode";

console.log(userName.charAt(0)); //prints the charactr at the position

console.log(userName.indexOf(o)) //shows the first occurence of the word

console.log(userName.lastIndexOf(o)) // shows us the last occurence of the word

console.log(userName.length) // the length of the string

userName = userName.trim(); //trim the white spaces

console.log(userName);

userName = userName.toUpperCase();

userName = userName.toLowerCase();

userName = userName.repeat(3); //repeats the sting three times

let result = userName.startsWith(" ");

console.log(result); //returns false

if(result){
    console.log("Your username can't begin with ' '");
}
else{
    console.log(userName);
}

//include use case
let output = userName.include(" ");

console.log(result); //returns false

if(result){
    console.log("Your username can't include ' '");
}
else{
    console.log(userName);
}

// ------------------------------
let phoneNumber = "123-456-7890"

phoneNumber = phoneNumber.replaceAll("-", ""); //replace all the dashes with no characters


console.log(phoneNumber)

phoneNumber = phoneNumber.padStart(15,  "0"); //has to be 15 characters and the intial filling to make it that is replaced with zeroes

phoneNumber = phoneNumber.padEnd(15,  "0"); //does the same thing but at the end

//---------  Sting Slicing
const fullName = "Bro Code";

//let firstName = fullName.slice(0,3); //stops at postion [2], the fist one [0] is inclusive

let firstName = fullName.slice(0, fullName.indexOf(" "));
