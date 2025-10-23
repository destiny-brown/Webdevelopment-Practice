/*
Async fetch request function to get the php data
Return as json data for easier processing
 */
async function fetchFlightInfo() {
    try {
        let response = await fetch('flight.php');
        if (response.status == 200) {
            let data = await response.json();
            var flightData = JSON.stringify(data);
            // Process your flight data here
            document.getElementById('flightInfo').innerHTML = flightData;
        } else {
            console.log("HTTP return status: " + response.status);
        }
    } catch(err) {
        console.log("Fetch Error for flight data!");
    }
}

// Async fetch from iata.json. Also store as a json data for easier processing
async function fetchIataInfo() {
    try {
        let response = await fetch('iata.json');
        if (response.status == 200) {
            let data = await response.json();
            var iataData = JSON.stringify(data);
            // Process your IATA data here
            document.getElementById('iataInfo').innerHTML = iataData;
        } else {
            console.log("HTTP return status: " + response.status);
        }
    } catch(err) {
        console.log("Fetch Error for IATA data!");
    }
}


fetchFlightInfo();
fetchIataInfo();