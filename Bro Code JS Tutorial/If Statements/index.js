//IF statements

const myText = document.getElementById("myText");
const mySubmit = document.getElementById("mySubmit");
const resultElement = document.getElementById("resultElement");


let age;

mySubmit.onclick = function(){
    age = myText.value; //remember that it is a string datatype so have t otypecast to number
    age = Number(age)

    if(age>=100){ //Take note of how we out this first becaise it is more than 18
    resultElement.textContent = `You are TOO old to enter this site`;

}
else if(age == 0){
    resultElement.textContent = `You can't enter. You were just born`;
} 

else if (age >=18){
    resultElement.textContent = `You are old enough ot enter this site`;

}

else if(age < 0){
   resultElement.textContent = `Your age can't be below 0`;
}

else{
    resultElement.textContent = `You must be 18+ to enter this site`;
}   
}


