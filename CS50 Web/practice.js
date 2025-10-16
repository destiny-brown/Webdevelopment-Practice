function hello() {
    const heading = document.querySelector('h1')
    if (heading.innerHTML === 'Hello!') {
        heading.innerHTML = 'Goodbye!';
    } else {
       heading.innerHTML = 'Hello!';
    }
}

let counter = 0;
function count(){
    counter++;
    document.querySelector('h1').innerHTML = counter;

    if(counter %10 === 0){
        alert(`Count is now ${counter}`);
    }
}
