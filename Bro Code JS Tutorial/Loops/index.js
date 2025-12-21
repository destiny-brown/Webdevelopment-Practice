// ------------------ While Loops ---------------------------
//A while loop will repeat some code WHILE some condition is true.

let username = "";
 
//Will continue infinitely
while  (username === ""){
    console.log(`You didn't enter your name`);
} 

console.log(`Hello ${username}`);

//Cannot close the prompt window until you type in something in the window prompt
while(username === "" || username === null){
    username = window.prompt(`Enter your name`);
}

console.log(`Hello ${username}`);

//Do while loop 

let newname;

do{
    newname = window.prompt(`Enter your name`);
} while (newname === "" || newname === null)

console.log(`Hello ${newname}`);


//-----------For Loops ------------------
 //for loop = repeat some code a LIMITED amount of times
//What number we will like to start out, create a counter, let the loop continue for 3 iterations 0,1,2. Increment the counter by one

 for (let i = 0; i<=10; i+=2 ){
    //console.log("Hello");
    console.log(i);
 }